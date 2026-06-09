import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSpecificbequestDto } from './dto/create-specificbequest.dto';
import { UpdateSpecificbequestDto } from './dto/update-specificbequest.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { TajulStorage } from 'src/common/lib/Disk/TajulStorage';

@Injectable()
export class SpecificbequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSpecificbequest(
    clientId: string,
    agentId: string,
    dto: CreateSpecificbequestDto,
    files: Express.Multer.File[],
  ) {
    const { beneficiaryId, willId, ...coreBequestData } = dto;

    let fileName = '';
    const folder = 'leads';
    const file = files && files.length > 0 ? files[0] : null;

    if (file) {
      fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
      await TajulStorage.put(`${folder}/${fileName}`, file.buffer);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const clientUser = await tx.user.findUnique({
          where: { id: clientId },
        });
        if (!clientUser) {
          throw new BadRequestException(
            `Target Client '${clientId}' not found.`,
          );
        }

        const agentUser = await tx.user.findUnique({ where: { id: agentId } });
        if (!agentUser) {
          throw new BadRequestException(`Acting Agent '${agentId}' not found.`);
        }

        const targetWill = await tx.will.findUnique({ where: { id: willId } });
        if (!targetWill) {
          throw new BadRequestException(
            `Target Will record '${willId}' not found.`,
          );
        }

        const targetBeneficiary = await tx.beneficiary.findUnique({
          where: { id: beneficiaryId },
        });
        if (!targetBeneficiary) {
          throw new BadRequestException(
            `Designated Beneficiary '${beneficiaryId}' not found.`,
          );
        }

        if (targetBeneficiary.willId !== willId) {
          throw new BadRequestException(
            'Security Alert: The selected beneficiary does not belong to the provided Will scope.',
          );
        }

        const newBequest = await tx.specificBequest.create({
          data: {
            item_category: coreBequestData.itemCategory,
            item_name: coreBequestData.itemName,
            full_description: coreBequestData.fullDescription,
            estimated_value: coreBequestData.estimatedValue,
            location_storage: coreBequestData.locationStorage,
            serial_reference: coreBequestData.serialReference,
            agent_id: agentId,
            client_id: clientId,
            beneficiary_id: beneficiaryId,
            willId: willId,
            attachments: fileName
              ? {
                  create: [
                    {
                      name: file.originalname,
                      type: file.mimetype,
                      path: fileName,
                    },
                  ],
                }
              : undefined,
          },
          include: {
            attachments: true,
            beneficiary: true,
            will: true,
          },
        });

        return {
          status: 'success',
          statusCode: 201,
          message:
            'Specific Bequest asset logged and tied successfully under security standards.',
          payload: newBequest,
        };
      });
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(
        `An elite operational layer failure aborted the asset log: ${err.message}`,
      );
    }
  }

  // Get all specific bequests

  async getAllBequests(willId?: string) {
    return await this.prisma.specificBequest.findMany({
      where: willId ? { willId } : {},
      include: {
        attachments: true,
        beneficiary: {
          select: { id: true, fullName: true, relationship: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // ২. GET SINGLE: আইডি দিয়ে সুনির্দিষ্ট একটি Bequest খুঁজে বের করা
  async getBequestById(id: string) {
    const bequest = await this.prisma.specificBequest.findUnique({
      where: { id },
      include: {
        attachments: true,
        beneficiary: true,
        will: true,
      },
    });

    if (!bequest) {
      throw new NotFoundException(
        `Specific Bequest asset with ID '${id}' was not found.`,
      );
    }
    return bequest;
  }

  async updateBequestTransaction(
    id: string,
    dto: UpdateSpecificbequestDto,
    requestUserId: string,
  ) {
    const currentBequest = await this.getBequestById(id);

    if (
      currentBequest.agent_id !== requestUserId &&
      currentBequest.client_id !== requestUserId
    ) {
      throw new ForbiddenException(
        'Security Block: You do not have privilege permissions to edit this asset resource.',
      );
    }

    const {
      newAttachmentIds,
      beneficiaryId,
      willId,
      itemCategory,
      itemName,
      fullDescription,
      ...scalarUpdates
    } = dto;

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (beneficiaryId) {
          const beneficiaryExists = await tx.beneficiary.findUnique({
            where: { id: beneficiaryId },
          });
          if (!beneficiaryExists)
            throw new BadRequestException(
              'The newly assigned beneficiary does not exist.',
            );
        }

        const updatedData = await tx.specificBequest.update({
          where: { id },
          data: {
            ...scalarUpdates,
            item_category: itemCategory,
            item_name: itemName,
            full_description: fullDescription,
            beneficiary_id: beneficiaryId,
            attachments: newAttachmentIds
              ? {
                  set: [],
                  connect: newAttachmentIds.map((attId) => ({ id: attId })),
                }
              : undefined,
          },
          include: {
            attachments: true,
            beneficiary: true,
          },
        });

        return {
          status: 'success',
          statusCode: 200,
          message: 'Specific Bequest details updated perfectly.',
          payload: updatedData,
        };
      });
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(
        `Failed to commit transactional update packet: ${err.message}`,
      );
    }
  }

  async deleteBequestTransaction(id: string, requestUserId: string) {
    const currentBequest = await this.getBequestById(id);

    if (
      currentBequest.agent_id !== requestUserId &&
      currentBequest.client_id !== requestUserId
    ) {
      throw new ForbiddenException(
        'Security Block: You do not possess structural ownership to drop this record.',
      );
    }

    try {
      await this.prisma.specificBequest.delete({
        where: { id },
      });

      return {
        status: 'success',
        statusCode: 200,
        message: `Specific Bequest asset '${currentBequest.item_name}' was successfully wiped from the cluster matrix.`,
      };
    } catch (err) {
      throw new InternalServerErrorException(
        `Wiping sequence encountered an internal error node: ${err.message}`,
      );
    }
  }
}
