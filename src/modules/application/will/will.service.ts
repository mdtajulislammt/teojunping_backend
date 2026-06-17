// src/modules/application/will/will.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateWillDto } from './dto/create-will.dto';
import { UpdateWillDto } from './dto/update-will.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WillService {
  constructor(private readonly prisma: PrismaService) {}

  // ১. CREATE WILL TRANSACTION
  async createWillTransaction(
    clientId: string,
    dto: CreateWillDto,
    agentId: string,
  ) {
    if (dto.beneficiaries && dto.beneficiaries.length > 0) {
      const totalShares = dto.beneficiaries.reduce(
        (sum, b) => sum + Number(b.sharePercentage),
        0,
      );
      if (totalShares !== 100) {
        throw new BadRequestException(
          `Validation Failed: Estate allocation shares must equal exactly 100%. Provided total: ${totalShares}%`,
        );
      }
    }

    const {
      dependants,
      beneficiaries,
      executors,
      exclusions,
      ...coreWillFields
    } = dto;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const clientUser = await tx.user.findUnique({ where: { id: clientId } });
        if (!clientUser) {
          throw new BadRequestException(`Client record with ID: '${clientId}' does not exist inside our directory.`);
        }

        const agentUser = await tx.user.findUnique({ where: { id: agentId } });
        if (!agentUser) {
          throw new BadRequestException(`Agent record with ID: '${agentId}' does not exist inside our directory.`);
        }

        const newWill = await tx.will.create({
          data: {
            ...coreWillFields,
            testatorDob: new Date(coreWillFields.testatorDob),
            agent_id: agentId,
            client_id: clientId,

            dependants: dependants && dependants.length > 0 ? {
              createMany: { data: dependants }
            } : undefined,

            beneficiaries: beneficiaries && beneficiaries.length > 0 ? {
              createMany: {
                data: beneficiaries.map((b) => ({
                  ...b,
                  dob: b.dob ? new Date(b.dob) : null,
                })),
              }
            } : undefined,

            executors: executors && executors.length > 0 ? {
              createMany: { data: executors }
            } : undefined,

            exclusions: exclusions && exclusions.length > 0 ? {
              createMany: { data: exclusions }
            } : undefined,
          },
          include: {
            dependants: true,
            beneficiaries: true,
            executors: true,
            exclusions: true,
          },
        });

        return {
          status: 'success',
          statusCode: 201,
          message: 'Will generation block compiled and executed smoothly.',
          data: newWill,
        };
      });
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(
        `An elite runtime database rollback triggered during Will compilation: ${err.message}`,
      );
    }
  }

  // ২. READ ALL METHOD
  async findAll() {
    try {
      const wills = await this.prisma.will.findMany({
        include: {
          dependants: true,
          beneficiaries: true,
          executors: true,
          exclusions: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return {
        status: 'success',
        statusCode: 200,
        message: 'Will records retrieved successfully.',
        data: wills,
      };
    } catch (err) {
      throw new InternalServerErrorException(
        `An elite runtime database rollback triggered during Will retrieval: ${err.message}`,
      );
    }
  }

  // ৩. READ SINGLE METHOD
  async findOne(id: string) {
    try {
      const will = await this.prisma.will.findUnique({
        where: { id },
        include: {
          dependants: true,
          beneficiaries: true,
          executors: true,
          exclusions: true,
          specificBequests: true,
        },
      });
      if (!will) {
        throw new NotFoundException(`Will record with ID: '${id}' does not exist inside our directory.`);
      }
      return {
        status: 'success',
        statusCode: 200,
        message: 'Will record retrieved successfully.',
        data: will,
      };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException(
        `An elite runtime database rollback triggered during Will retrieval: ${err.message}`,
      );
    }
  }

  // ৪. UPDATE WILL TRANSACTION (Atomic Drop & Replace Core Framework)
  async updateWillTransaction(id: string, dto: UpdateWillDto, requestUserId: string) {
    const existingWillResult = await this.findOne(id);
    const currentWill = existingWillResult.data;

    // সিকিউরিটি লক: উইলের অ্যাসাইনড এজেন্ট ছাড়া অন্য কেউ যেন এডিট করতে না পারে
    if (currentWill.agent_id !== requestUserId) {
      throw new ForbiddenException('Security Block: You do not possess structural assignment to update this Will framework.');
    }

    // বিজনেস লজিক ভ্যালিডেশন: এলোকেশন শেয়ার সাম চেক করা (১০০% হতে হবে)
    if (dto.beneficiaries && dto.beneficiaries.length > 0) {
      const totalShares = dto.beneficiaries.reduce((sum, b) => sum + Number(b.sharePercentage), 0);
      if (totalShares !== 100) {
        throw new BadRequestException(`Validation Failed: Estate allocation shares must equal exactly 100%. Provided total: ${totalShares}%`);
      }
    }

    const { dependants, beneficiaries, executors, exclusions, ...coreWillFields } = dto;

    try {
      return await this.prisma.$transaction(async (tx) => {
        
        // ১. ওল্ড চাইল্ড রিলেশনগুলো ট্রানজেকশনের ভেতরে পুরোপুরি ক্লিয়ার (Wipe) করা
        await tx.dependant.deleteMany({ where: { willId: id } });
        await tx.beneficiary.deleteMany({ where: { willId: id } });
        await tx.executor.deleteMany({ where: { willId: id } });
        await tx.exclusion.deleteMany({ where: { willId: id } });

        // ২. মেইন উইল টেবিল আপডেট এবং একই সাথে নতুন ডাটা ব্যাচ ইনসার্ট করা
        const updatedWill = await tx.will.update({
          where: { id },
          data: {
            ...coreWillFields,
            ...(coreWillFields.testatorDob && { testatorDob: new Date(coreWillFields.testatorDob) }),
            
            dependants: dependants && dependants.length > 0 ? {
              createMany: { data: dependants }
            } : undefined,

            beneficiaries: beneficiaries && beneficiaries.length > 0 ? {
              createMany: {
                data: beneficiaries.map((b) => ({
                  ...b,
                  dob: b.dob ? new Date(b.dob) : null,
                })),
              }
            } : undefined,

            executors: executors && executors.length > 0 ? {
              createMany: { data: executors }
            } : undefined,

            exclusions: exclusions && exclusions.length > 0 ? {
              createMany: { data: exclusions }
            } : undefined,
          },
          include: {
            dependants: true,
            beneficiaries: true,
            executors: true,
            exclusions: true,
          },
        });

        return {
          status: 'success',
          statusCode: 200,
          message: 'Will architecture and child relations updated successfully.',
          data: updatedWill,
        };
      });
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(`Failed to commit transactional Update packet: ${err.message}`);
    }
  }

  // ৫. REMOVE / DELETE WILL TRANSACTION
  async removeWillTransaction(id: string, requestUserId: string) {
    const existingWillResult = await this.findOne(id);
    const currentWill = existingWillResult.data;

    if (currentWill.agent_id !== requestUserId) {
      throw new ForbiddenException('Security Block: You do not possess structural assignment to wipe this Will framework.');
    }

    try {
      // স্কিমাতে onDelete: Cascade থাকার কারণে মেইন টেবিল ডিলিট দিলে সাব-টেবিল ডাটা অটোমেটিক ডিলিট হবে
      await this.prisma.will.delete({
        where: { id },
      });

      return {
        status: 'success',
        statusCode: 200,
        message: `Will record with unique ID '${id}' and all cascades were successfully deleted from database engine.`,
      };
    } catch (err) {
      throw new InternalServerErrorException(`Purging sequence encountered a runtime error node: ${err.message}`);
    }
  }
}