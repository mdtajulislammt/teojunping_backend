import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateWillDto } from './dto/create-will.dto';
import { UpdateWillDto } from './dto/update-will.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WillService {
  constructor(private readonly prisma: PrismaService) {}

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
        const clientUser = await tx.user.findUnique({
          where: { id: clientId },
        });
        if (!clientUser) {
          throw new BadRequestException(
            `Client record with ID: '${clientId}' does not exist inside our directory.`,
          );
        }

        const agentUser = await tx.user.findUnique({ where: { id: agentId } });
        if (!agentUser) {
          throw new BadRequestException(
            `Agent record with ID: '${agentId}' does not exist inside our directory.`,
          );
        }

        const newWill = await tx.will.create({
          data: {
            ...coreWillFields,
            testatorDob: new Date(coreWillFields.testatorDob), // explicitly parsing into database iso date format
            agent_id: agentId, // maps to schema field naming specs
            client_id: clientId, // maps to client user id passed from route parameter

            // Nested create execution queries for nested data
            dependants:
              dependants && dependants.length > 0
                ? {
                    createMany: {
                      data: dependants.map((d) => ({
                        fullName: d.fullName,
                        relationship: d.relationship,
                      })),
                    },
                  }
                : undefined,

            beneficiaries:
              beneficiaries && beneficiaries.length > 0
                ? {
                    createMany: {
                      data: beneficiaries.map((b) => ({
                        type: b.type,
                        fullName: b.fullName,
                        relationship: b.relationship,
                        dob: b.dob ? new Date(b.dob) : null,
                        sharePercentage: b.sharePercentage,
                        contactAddress: b.contactAddress,
                        isMinor: b.isMinor,
                        specificBequest: b.specificBequest,
                      })),
                    },
                  }
                : undefined,

            executors:
              executors && executors.length > 0
                ? {
                    createMany: {
                      data: executors.map((e) => ({
                        priority: e.priority,
                        firstName: e.firstName,
                        relationship: e.relationship,
                        email: e.email,
                        phone: e.phone,
                        address: e.address,
                      })),
                    },
                  }
                : undefined,

            exclusions:
              exclusions && exclusions.length > 0
                ? {
                    createMany: {
                      data: exclusions.map((ex) => ({
                        fullName: ex.fullName,
                        relationship: ex.relationship,
                        reason: ex.reason,
                      })),
                    },
                  }
                : undefined,
          },
          // রিলেশনাল ডেটা সহ রেসপন্স রিটার্ন করার কনফিগারেশন
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

  async findAll() {
    try {
      const wills = await this.prisma.will.findMany();
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

  async findOne(id: string) {
    try {
      const will = await this.prisma.will.findUnique({
        where: { id },
        include: {
          dependants: true,
          beneficiaries: true,
          executors: true,
          exclusions: true,
        },
      });
      if (!will) {
        throw new BadRequestException(
          `Will record with ID: '${id}' does not exist inside our directory.`,
        );
      }
      return {
        status: 'success',
        statusCode: 200,
        message: 'Will record retrieved successfully.',
        payload: will,
      };
    } catch (err) {
      throw new InternalServerErrorException(
        `An elite runtime database rollback triggered during Will retrieval: ${err.message}`,
      );
    }
  }

  update(id: number, updateWillDto: UpdateWillDto) {
    return `This action updates a #${id} will`;
  }

  remove(id: number) {
    return `This action removes a #${id} will`;
  }
}
