// src/modules/application/specificbequests/specificbequests.service.ts
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

  // ১. CREATE METHOD (With Multiple Attachment Support)
  async createSpecificbequest(
    clientId: string,
    agentId: string,
    dto: CreateSpecificbequestDto,
    files: Express.Multer.File[],
  ) {
    const { beneficiaryId, ...coreBequestData } = dto;
    const folder = 'leads';
    const uploadedAttachments: Array<{
      name: string;
      type: string;
      path: string;
    }> = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        await TajulStorage.put(`${folder}/${fileName}`, file.buffer);

        uploadedAttachments.push({
          name: file.originalname,
          type: file.mimetype,
          path: fileName,
        });
      }
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const clientUser = await tx.user.findUnique({
          where: { id: clientId },
        });
        if (!clientUser)
          throw new BadRequestException(
            `Target Client '${clientId}' not found.`,
          );

        const agentUser = await tx.user.findUnique({ where: { id: agentId } });
        if (!agentUser)
          throw new BadRequestException(`Acting Agent '${agentId}' not found.`);

        const targetBeneficiary = await tx.beneficiary.findUnique({
          where: { id: beneficiaryId },
        });
        if (!targetBeneficiary)
          throw new BadRequestException(
            `Designated Beneficiary '${beneficiaryId}' not found.`,
          );

        const newBequest = await tx.specificBequest.create({
          data: {
            item_category: coreBequestData.itemCategory,
            item_name: coreBequestData.itemName,
            full_description: coreBequestData.fullDescription,
            estimated_value: coreBequestData.estimatedValue || 0.0,
            location_storage: coreBequestData.locationStorage || null,
            serial_reference: coreBequestData.serialReference || null,
            agent_id: agentId,
            client_id: clientId,
            beneficiary_id: beneficiaryId,
            attachments:
              uploadedAttachments.length > 0
                ? {
                    create: uploadedAttachments,
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
          message: 'Specific Bequest asset logged successfully.',
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

  //get
  async getAllSpecificBequests(clientId: string, agentId: string) {
    const specificBequests = await this.prisma.specificBequest.findMany({
      where: {
        client_id: clientId,
        agent_id: agentId,
      },
      include: {
        attachments: true,
        beneficiary: true,
        will: true,
      },
    });

    if (specificBequests.length === 0) {
      throw new BadRequestException(
        'No specific bequests found for the provided client and agent.',
      );
    }

    return {
      status: 'success',
      statusCode: 200,
      message: 'Specific bequests fetched successfully.',
      payload: specificBequests,
    };
  }

  // get single specific bequest
  async getSpecificBequest(id: string, agentId: string) {
    const specificBequest = await this.prisma.specificBequest.findUnique({
      where: { id, agent_id: agentId },
      include: {
        attachments: true,
        beneficiary: true,
        will: true,
      },
    });

    if (!specificBequest) {
      throw new NotFoundException('Specific bequest not found.');
    }

    return {
      status: 'success',
      statusCode: 200,
      message: 'Specific bequest fetched successfully.',
      data: specificBequest,
    };
  }

  async updateBequestTransaction(
    id: string,
    dto: UpdateSpecificbequestDto,
    requestUserId: string,
    files?: Express.Multer.File[],
  ) {
    const result = await this.getBequestById(id);
    const currentBequest = result.data;

    if (
      currentBequest.agent_id !== requestUserId &&
      currentBequest.client_id !== requestUserId
    ) {
      throw new ForbiddenException(
        'Security Block: You do not have privilege permissions to edit this resource.',
      );
    }

    const {
      newAttachmentIds,
      beneficiaryId,
      itemCategory,
      itemName,
      fullDescription,
      estimatedValue,
      locationStorage,
      serialReference,
    } = dto;

    const folder = 'leads';
    const newUploadedFiles: Array<{
      name: string;
      type: string;
      path: string;
    }> = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        await TajulStorage.put(`${folder}/${fileName}`, file.buffer);
        newUploadedFiles.push({
          name: file.originalname,
          type: file.mimetype,
          path: fileName,
        });
      }
    }

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

        const updatePayload: any = {
          ...(itemCategory && { item_category: itemCategory }),
          ...(itemName && { item_name: itemName }),
          ...(fullDescription && { full_description: fullDescription }),
          ...(beneficiaryId && { beneficiary_id: beneficiaryId }),
          ...(estimatedValue !== undefined && {
            estimated_value: Number(estimatedValue),
          }),
          ...(locationStorage !== undefined && {
            location_storage: locationStorage,
          }),
          ...(serialReference !== undefined && {
            serial_reference: serialReference,
          }),
        };

        if (newAttachmentIds || newUploadedFiles.length > 0) {
          updatePayload.attachments = {
            ...(newAttachmentIds && {
              set: newAttachmentIds.map((attId) => ({ id: attId })),
            }),
            ...(newUploadedFiles.length > 0 && { create: newUploadedFiles }),
          };
        }

        const updatedData = await tx.specificBequest.update({
          where: { id },
          data: updatePayload,
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

  // Helper: Get Request Base ID
  async getBequestById(id: string) {
    const bequest = await this.prisma.specificBequest.findUnique({
      where: { id },
    });
    if (!bequest) {
      throw new NotFoundException(
        `Specific Bequest record with ID '${id}' was not found.`,
      );
    }
    return {
      status: 'success',
      statusCode: 200,
      data: bequest,
    };
  }

  async deleteBequest(id: string, requestUserId: string) {
    const result = await this.getBequestById(id);
    const currentBequest = result.data;

    if (currentBequest.agent_id !== requestUserId) {
      throw new ForbiddenException(
        'Security Block: You do not have privilege permissions to delete this resource.',
      );
    }

    await this.prisma.specificBequest.delete({
      where: { id },
    });

    return {
      status: 'success',
      statusCode: 200,
      message: 'Specific bequest deleted successfully.',
    };
  }
}
