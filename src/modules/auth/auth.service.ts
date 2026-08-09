// external imports
import { InjectRedis } from '@nestjs-modules/ioredis';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';

//internal imports
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  RegisterAgentDto,
  RegisterClientDto,
} from 'src/modules/auth/dto/create-user.dto';
import { StringHelper } from '../../common/helper/string.helper';
import { TajulStorage } from '../../common/lib/Disk/TajulStorage';
import { UcodeRepository } from '../../common/repository/ucode/ucode.repository';
import { UserRepository } from '../../common/repository/user/user.repository';
import appConfig from '../../config/app.config';
import { MailService } from '../../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaymentTransactionService } from '../admin/payment-transaction/payment-transaction.service';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10; // Configuration for bcrypt hashing rounds

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private mailService: MailService,
    private userRepository: UserRepository,
    private ucodeRepository: UcodeRepository,
    @InjectRedis() private readonly redis: Redis,
    private paymentTransactionService: PaymentTransactionService,
  ) {}

  // src/modules/auth/auth.service.ts

  async me(userId: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
          deleted_at: null,
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          name: true,
          email: true,
          phone_number: true,
          avatar: true,
          address: true,
          type: true,
          status: true,
          created_at: true,
          email_verified_at: true,
          is_two_factor_enabled: true,
          professional_bio: true,
          specialisation: true,
          years_of_experience: true,
          certification_body: true,
          certification_number: true,
          plan_id: true,
          assigned_agent_id: true,
          preferred_working_hours: true,
          max_clients_per_month: true,
          plan: {
            select: {
              id: true,
              name: true,
              display_name: true,
              description: true,
              price: true,
              currency: true,
              features: true,
            },
          },
        },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Build avatar URL
      let avatarUrl = null;
      if (user.avatar) {
        avatarUrl = TajulStorage.url(
          appConfig().storageUrl.avatar + '/' + user.avatar,
        );
      }

      // Get stats based on user type
      let clientsCount = 0;
      let willsCount = 0;
      let invoicesCount = 0;

      if (user.type === 'AGENT') {
        // Clients assigned to this agent
        clientsCount = await this.prisma.user.count({
          where: {
            assigned_agent_id: user.id,
            deleted_at: null,
          },
        });

        // Wills created by this agent
        willsCount = await this.prisma.will.count({
          where: {
            agent_id: user.id,
          },
        });

        // Invoices for agent's clients
        invoicesCount = await this.prisma.paymentTransaction.count({
          where: {
            user: {
              assigned_agent_id: user.id,
            },
          },
        });
      } else if (user.type === 'CLIENT') {
        // Wills for this client
        willsCount = await this.prisma.will.count({
          where: {
            client_id: user.id,
          },
        });

        // Invoices for this client
        invoicesCount = await this.prisma.paymentTransaction.count({
          where: {
            user_id: user.id,
          },
        });
      }

      // Return formatted response matching Figma
      return {
        success: true,
        data: {
          // Personal Info
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          email: user.email,
          phone_number: user.phone_number,
          avatar: avatarUrl,
          type: user.type,
          role_title:
            user.type === 'AGENT' ? user.specialisation || 'Agent' : 'Client',
          location: user.address || 'Not specified',
          bio: user.professional_bio || '',

          // Account Status
          account_status: {
            is_active: user.status === 1,
            is_email_verified: !!user.email_verified_at,
            is_two_factor_enabled: user.is_two_factor_enabled === 1,
            member_since: user.created_at,
          },

          // Plan Info
          plan: user.plan
            ? {
                id: user.plan.id,
                name: user.plan.name,
                display_name: user.plan.display_name,
                description: user.plan.description,
                price: user.plan.price,
                currency: user.plan.currency,
                features: user.plan.features,
              }
            : null,

          // Stats (Figma: 24 CLIENTS, 18 WILLS, 31 INVOICES)
          stats: {
            clients: clientsCount,
            wills: willsCount,
            invoices: invoicesCount,
          },

          // Agent specific fields
          agent_details:
            user.type === 'AGENT'
              ? {
                  specialisation: user.specialisation,
                  years_of_experience: user.years_of_experience,
                  certification_body: user.certification_body,
                  certification_number: user.certification_number,
                  professional_bio: user.professional_bio,
                  preferred_working_hours: user.preferred_working_hours,
                  max_clients_per_month: user.max_clients_per_month,
                }
              : null,

          // Client specific fields
          client_details:
            user.type === 'CLIENT'
              ? {
                  assigned_agent_id: user.assigned_agent_id,
                }
              : null,

          // Timestamps
          created_at: user.created_at,
          email_verified_at: user.email_verified_at,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Register Client Account
   */
  async registerClient(dto: RegisterClientDto) {
    // 1. Check uniqueness
    await this.validateUniqueEmail(dto.email);

    try {
      // 2. Get the plan by name
      const plan = await this.prisma.plan.findUnique({
        where: { name: dto.plan },
      });

      if (!plan) {
        throw new NotFoundException(`Plan ${dto.plan} not found`);
      }

      // 3. Hash Password
      const hashedPassword = await bcrypt.hash(dto.password, this.saltRounds);

      // 4. Persist to Database with plan
      const client = await this.prisma.user.create({
        data: {
          first_name: dto.first_name,
          last_name: dto.last_name,
          email: dto.email,
          phone_number: dto.phone_number,
          gender: dto.gender,
          date_of_birth: new Date(dto.date_of_birth),
          address: dto.address,
          password: hashedPassword,
          type: 'CLIENT',
          plan_id: plan.id,
          assigned_agent_id: dto.assigned_agent_id || null,
          status: 1,
        },
      });

      // 5. Create invoice internally (no need to return)
      try {
        await this.paymentTransactionService.createInvoice(client.id, dto.plan);
      } catch (invoiceError) {
        // Log error but don't fail registration
        console.error('Invoice creation failed:', invoiceError);
        // Continue - client can still login and see pending payment
      }

      // 6. Secure payload cleanup
      delete client.password;

      // 7. Return only user data
      return {
        success: true,
        message:
          'Client account created successfully. An invoice has been generated for payment.',
        data: {
          id: client.id,
          first_name: client.first_name,
          last_name: client.last_name,
          email: client.email,
          phone_number: client.phone_number,
          type: client.type,
          plan: {
            name: plan.name,
            display_name: plan.display_name,
          },
          status: client.status,
          created_at: client.created_at,
        },
      };
    } catch (error: any) {
      // Handle specific errors
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }

      throw new InternalServerErrorException(
        error.message || 'Failed to create client account',
      );
    }
  }

  /**
   * Validate unique email
   */
  private async validateUniqueEmail(email: string): Promise<void> {
    const userExists = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (userExists) {
      throw new ConflictException('Email address already exists');
    }
  }

  /**
   * Register Will Writer Agent Account
   */
  async registerAgent(dto: RegisterAgentDto, files?: Express.Multer.File[]) {
    let fileName = '';
    const folder = 'body_certificates';
    const file = files && files.length > 0 ? files[0] : null;

    // 1. Check uniqueness
    await this.validateUniqueEmail(dto.email);

    try {
      if (file) {
        fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        await TajulStorage.put(`${folder}/${fileName}`, file.buffer);
      }
      // 2. Hash Password
      const hashedPassword = await bcrypt.hash(dto.password, this.saltRounds);

      // 3. Persist Agent to Database
      const agent = await this.prisma.user.create({
        data: {
          first_name: dto.first_name,
          last_name: dto.last_name,
          email: dto.email,
          phone_number: dto.phone_number,
          gender: dto.gender,
          date_of_birth: new Date(dto.date_of_birth),
          address: dto.address,
          password: hashedPassword,
          type: 'AGENT',

          // Agent specific fields mapping
          certification_body: dto.certification_body,
          certification_number: dto.certification_number,
          years_of_experience: dto.years_of_experience,
          specialisation: dto.specialisation,
          professional_bio: dto.professional_bio || null,
          certificate_url: fileName
            ? {
                create: {
                  name: file.originalname,
                  type: file.mimetype,
                  path: fileName,
                },
              }
            : undefined,
          preferred_working_hours: dto.preferred_working_hours,
          max_clients_per_month: dto.max_clients_per_month || 20,
        },
      });

      // Secure payload cleanup
      delete agent.password;

      return {
        success: true,
        message: 'Agent account registered successfully',
        data: agent,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Failed to register agent account',
      );
    }
  }

  // done
  async login({
    email,
    userId,
    fcm_token,
  }: {
    email: string;
    userId: string;
    fcm_token?: string;
  }) {
    const userActive = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!userActive) {
      return {
        success: false,
        message: 'Please wait for admin approval',
      };
    }

    try {
      if (fcm_token) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            fcm_token: fcm_token,
          },
        });
      }
      // ---------------------------------------------------------

      const payload = { email: email, sub: userId, type: 'user' };

      const accessToken = this.jwtService.sign(payload, { expiresIn: '10d' });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

      const user = await this.userRepository.getUserDetails(userId);

      await this.redis.set(
        `refresh_token:${user.id}`,
        refreshToken,
        'EX',
        60 * 60 * 24 * 7,
      );

      return {
        success: true,
        message: 'Logged in successfully',
        authorization: {
          type: 'bearer',
          access_token: accessToken,
          refresh_token: refreshToken,
        },
        userid: user.id,
        type: user.type,
        fcm_token: user.fcm_token,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // update user
  async updateUser(
    userId: string,
    dto: UpdateUserDto,
    image?: Express.Multer.File,
  ) {
    try {
      // 1. User fetch kora (Checking if exists)
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) return { success: false, message: 'User not found' };

      // 2. Phone unique check (Jodi phone change hoy)
      if (dto.phone_number && dto.phone_number !== user.phone_number) {
        const exists = await this.prisma.user.findFirst({
          where: { phone_number: dto.phone_number },
        });
        if (exists)
          return { success: false, message: 'Phone number already exists' };
      }

      // 3. Image Handle kora
      let avatarName = user.avatar;
      if (image) {
        // Old image delete (jodi thake)
        if (user.avatar)
          await TajulStorage.delete(
            `${appConfig().storageUrl.avatar}/${user.avatar}`,
          );

        // New image upload
        avatarName = `${StringHelper.randomString()}_${image.originalname}`;
        await TajulStorage.put(
          `${appConfig().storageUrl.avatar}/${avatarName}`,
          image.buffer,
        );
      }

      // 4. Final Update
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...dto,
          avatar: avatarName,
          updated_at: new Date(),
        },
      });

      return { success: true, message: 'User updated successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  // done
  async forgotPassword(email) {
    try {
      const user = await this.userRepository.exist({
        field: 'email',
        value: email,
      });

      if (user) {
        const token = await this.ucodeRepository.createToken({
          userId: user.id,
          isOtp: true,
        });

        await this.mailService.sendOtpCodeToEmail({
          email: email,
          name: user.name,
          otp: token,
        });

        return {
          success: true,
          message: 'We have sent an OTP code to your email',
        };
      } else {
        return {
          success: false,
          message: 'Email not found',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // done
  async resendToken(email: string) {
    try {
      const user = await this.userRepository.getUserByEmail(email);

      if (user) {
        // create otp code
        const token = await this.ucodeRepository.createToken({
          userId: user.id,
          isOtp: true,
          time: 2,
        });

        // send otp code to email
        await this.mailService.sendOtpCodeToEmail({
          email: email,
          name: user.name,
          otp: token,
        });

        return {
          success: true,
          message: 'We have sent a token code to your email',
        };
      } else {
        return {
          success: false,
          message: 'Email not found',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // done
  async verifyToken({ email, token }) {
    try {
      const user = await this.userRepository.exist({
        field: 'email',
        value: email,
      });

      if (user) {
        const result = await this.ucodeRepository.verifyToken({
          email: email,
          token: token,
        });

        // Check the actual success property, not just if object exists
        if (result && result.success) {
          return {
            success: true,
            message: result.message || 'Token verified successfully',
          };
        } else {
          return {
            success: false,
            message: result?.message || 'Invalid token',
          };
        }
      } else {
        return {
          success: false,
          message: 'Email not found',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  //done
  async verifyEmail({ email, token }) {
    try {
      const user = await this.userRepository.exist({
        field: 'email',
        value: email,
      });

      if (user) {
        const existToken = await this.ucodeRepository.validateToken({
          email: email,
          token: token,
        });

        if (existToken) {
          await this.prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              email_verified_at: new Date(Date.now()),
            },
          });

          return {
            success: true,
            message: 'Email verified successfully',
          };
        } else {
          return {
            success: false,
            message: 'Invalid token',
          };
        }
      } else {
        return {
          success: false,
          message: 'Email not found',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  // done
  async resendVerificationEmail(email: string) {
    try {
      const user = await this.userRepository.getUserByEmail(email);

      if (user) {
        // create otp code
        const token = await this.ucodeRepository.createToken({
          userId: user.id,
          isOtp: true,
        });

        // send otp code to email
        await this.mailService.sendOtpCodeToEmail({
          email: email,
          name: user.name,
          otp: token,
        });

        return {
          success: true,
          message: 'We have sent a verification code to your email',
        };
      } else {
        return {
          success: false,
          message: 'Email not found',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async resetPassword({ email, token, password }) {
    try {
      const user = await this.userRepository.exist({
        field: 'email',
        value: email,
      });

      if (user) {
        const existToken = await this.ucodeRepository.verifycheckToken({
          email: email,
          token: token,
        });

        if (existToken) {
          await this.userRepository.changePassword({
            email: email,
            password: password,
          });

          // delete otp code
          await this.ucodeRepository.deleteToken({
            email: email,
            token: token,
          });

          return {
            success: true,
            message: 'Password updated successfully',
          };
        } else {
          return {
            success: false,
            message: 'Invalid token',
          };
        }
      } else {
        return {
          success: false,
          message: 'Email not found',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async changePassword({ user_id, oldPassword, newPassword }) {
    try {
      const user = await this.userRepository.getUserDetails(user_id);

      if (user) {
        const _isValidPassword = await this.userRepository.validatePassword({
          email: user.email,
          password: oldPassword,
        });
        if (_isValidPassword) {
          await this.userRepository.changePassword({
            email: user.email,
            password: newPassword,
          });

          return {
            success: true,
            message: 'Password updated successfully',
          };
        } else {
          return {
            success: false,
            message: 'Invalid password',
          };
        }
      } else {
        return {
          success: false,
          message: 'Email not found',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ---------------------------------(end)---------------------------------------

  async refreshToken(user_id: string, refreshToken: string) {
    try {
      const storedToken = await this.redis.get(`refresh_token:${user_id}`);

      if (!storedToken || storedToken != refreshToken) {
        return {
          success: false,
          message: 'Refresh token is required',
        };
      }

      if (!user_id) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const userDetails = await this.userRepository.getUserDetails(user_id);
      if (!userDetails) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const payload = {
        email: userDetails.email,
        sub: userDetails.id,
        type: userDetails.type,
      };
      const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });

      return {
        success: true,
        authorization: {
          type: 'bearer',
          access_token: accessToken,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async revokeRefreshToken(user_id: string) {
    try {
      const storedToken = await this.redis.get(`refresh_token:${user_id}`);
      if (!storedToken) {
        return {
          success: false,
          message: 'Refresh token not found',
        };
      }

      await this.redis.del(`refresh_token:${user_id}`);

      return {
        success: true,
        message: 'Refresh token revoked successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async requestEmailChange(user_id: string, email: string) {
    try {
      const user = await this.userRepository.getUserDetails(user_id);
      if (user) {
        const token = await this.ucodeRepository.createToken({
          userId: user.id,
          isOtp: true,
          email: email,
        });

        await this.mailService.sendOtpCodeToEmail({
          email: email,
          name: email,
          otp: token,
        });

        return {
          success: true,
          message: 'We have sent an OTP code to your email',
        };
      } else {
        return {
          success: false,
          message: 'User not found',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async changeEmail({
    user_id,
    new_email,
    token,
  }: {
    user_id: string;
    new_email: string;
    token: string;
  }) {
    try {
      const user = await this.userRepository.getUserDetails(user_id);

      if (user) {
        const existToken = await this.ucodeRepository.validateToken({
          email: new_email,
          token: token,
          forEmailChange: true,
        });

        if (existToken) {
          await this.userRepository.changeEmail({
            user_id: user.id,
            new_email: new_email,
          });

          // delete otp code
          await this.ucodeRepository.deleteToken({
            email: new_email,
            token: token,
          });

          return {
            success: true,
            message: 'Email updated successfully',
          };
        } else {
          return {
            success: false,
            message: 'Invalid token',
          };
        }
      } else {
        return {
          success: false,
          message: 'User not found',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async validateUser(
    email: string,
    pass: string,
    token?: string,
  ): Promise<any> {
    const _password = pass;
    const user = await this.prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (user) {
      const _isValidPassword = await this.userRepository.validatePassword({
        email: email,
        password: _password,
      });
      if (_isValidPassword) {
        // Check if email is verified
        // if (!user.email_verified_at) {
        //   throw new UnauthorizedException(
        //     'Please verify your email before logging in',
        //   );
        // }
        const { password, ...result } = user;
        if (user.is_two_factor_enabled) {
          if (token) {
            const isValid = await this.userRepository.verify2FA(user.id, token);
            if (!isValid) {
              throw new UnauthorizedException('Invalid token');
              // return {
              //   success: false,
              //   message: 'Invalid token',
              // };
            }
          } else {
            throw new UnauthorizedException('Token is required');
            // return {
            //   success: false,
            //   message: 'Token is required',
            // };
          }
        }
        return result;
      } else {
        throw new UnauthorizedException('Password not matched');
        // return {
        //   success: false,
        //   message: 'Password not matched',
        // };
      }
    } else {
      throw new UnauthorizedException('Email not found');
      // return {
      //   success: false,
      //   message: 'Email not found',
      // };
    }
  }

  // --------- 2FA ---------
  async generate2FASecret(user_id: string) {
    try {
      return await this.userRepository.generate2FASecret(user_id);
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async verify2FA(user_id: string, token: string) {
    try {
      const isValid = await this.userRepository.verify2FA(user_id, token);
      if (!isValid) {
        return {
          success: false,
          message: 'Invalid token',
        };
      }
      return {
        success: true,
        message: '2FA verified successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async enable2FA(user_id: string) {
    try {
      const user = await this.userRepository.getUserDetails(user_id);
      if (user) {
        await this.userRepository.enable2FA(user_id);
        return {
          success: true,
          message: '2FA enabled successfully',
        };
      } else {
        return {
          success: false,
          message: 'User not found',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async disable2FA(user_id: string) {
    try {
      const user = await this.userRepository.getUserDetails(user_id);
      if (user) {
        await this.userRepository.disable2FA(user_id);
        return {
          success: true,
          message: '2FA disabled successfully',
        };
      } else {
        return {
          success: false,
          message: 'User not found',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  // --------- end 2FA ---------

  async allClients(user_id: string) {
    try {
      // Check if the requesting user exists
      const user = await this.userRepository.getUserDetails(user_id);

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const clients = await this.userRepository.getAllClients();

      return {
        success: true,
        message: 'Clients fetched successfully',
        data: clients,
      };
    } catch (error: any) {
      // Production e error log kora bhalo
      console.error('Error fetching clients:', error);
      return {
        success: false,
        message: error.message || 'Internal server error',
      };
    }
  }

  async allAgent(user_id: string) {
    try {
      // Check if the requesting user exists
      const user = await this.userRepository.getUserDetails(user_id);

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const agents = await this.userRepository.getAllAgents();

      return {
        success: true,
        message: 'Agents fetched successfully',
        data: agents,
      };
    } catch (error: any) {
      // Production e error log kora bhalo
      console.error('Error fetching agents:', error);
      return {
        success: false,
        message: error.message || 'Internal server error',
      };
    }
  }

  // my client by assigned_agent_id (agent)
  async myClients(user_id: string) {
    try {
      // 1. Authenticate Requesting Agent Profile
      const agent = await this.userRepository.getUserDetails(user_id);
      if (!agent) {
        return {
          success: false,
          message: 'Agent profile structure not found.',
        };
      }

      // 2. Fetch specific UI bound data fields
      const clientsData =
        await this.userRepository.getClientsByAgentId(user_id);

      // 3. Map values precisely matching standard state logic of UI cards
      const formattedClients = clientsData.map((client) => {
        const latestWill = client.created_requests[0] || null;
        const latestInvoice = client.payment_transactions[0] || null;

        return {
          id: client.id,
          name:
            client.name ||
            `${client.first_name || ''} ${client.last_name || ''}`.trim(),
          email: client.email,
          phone: client.phone_number || 'N/A',
          avatar: client.avatar,
          // plan: client.service_plan, // BASIC, STANDARD, PREMIUM
          willStatus: latestWill ? latestWill.status : 'Not Started', // Card tag dynamic state
          invoice: latestInvoice
            ? {
                amount: latestInvoice.amount,
                status: latestInvoice.status, // PAID, UNPAID, PENDING
              }
            : null,
          nextAppointment: 'Apr 26, 2026', // Dynamic calculation pipeline placeholder
        };
      });

      return {
        success: true,
        message: 'Dashboard clients processed successfully',
        data: formattedClients,
      };
    } catch (error: any) {
      console.error(
        `[Dashboard Metrics Fetch Failure] Agent Reference ID: ${user_id}`,
        error,
      );
      return {
        success: false,
        message: 'Failed to synchronize component view parameters.',
      };
    }
  }
}
