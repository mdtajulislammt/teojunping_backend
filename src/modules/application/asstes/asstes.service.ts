// src/modules/application/asset/asset.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAssetDto, CreateBulkAssetDto } from './dto/create-asste.dto';
import { AssetType } from '@prisma-client';
import { UpdateAssteDto } from './dto/update-asste.dto';

@Injectable()
export class AssetService {
  constructor(private readonly prisma: PrismaService) {}

  // ১. POST / CREATE ASSET
  async createBulkAssets(
    clientId: string,
    agentId: string,
    dto: CreateBulkAssetDto,
  ) {
    const { asset_type, assets } = dto;

    if (!assets || assets.length === 0) {
      throw new BadRequestException('Asset array checklist cannot be empty.');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const clientUser = await tx.user.findUnique({
          where: { id: clientId },
        });
        if (!clientUser)
          throw new BadRequestException(
            `Client with ID '${clientId}' does not exist.`,
          );

        const agentUser = await tx.user.findUnique({ where: { id: agentId } });
        if (!agentUser)
          throw new BadRequestException(
            `Agent with ID '${agentId}' does not exist.`,
          );
        const assetDataBatch = assets.map((asset) => ({
          asset_type: asset_type,
          property_address: asset.property_address || null,
          ownership_type: asset.ownership_type || null,
          property_type: asset.property_type || null,
          estimated_value: asset.estimated_value || 0.0,
          outstanding_mortgage: asset.outstanding_mortgage || 0.0,
          additional_notes: asset.additional_notes || null,
          agent_id: agentId,
          client_id: clientId,
        }));

        const result = await tx.asset.createMany({
          data: assetDataBatch,
        });

        return {
          status: 'success',
          statusCode: 201,
          message: `Successfully registered ${result.count} entries under ${asset_type} cluster configuration.`,
          payload: {
            count: result.count,
          },
          data: assets,
        };
      });
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(
        `Transactional asset matrix generation failed: ${err.message}`,
      );
    }
  }

  // ২. GET ALL ASSETS (With Filtering)
  async getAllAssets(clientId?: string, type?: string) {
    const assets = await this.prisma.asset.findMany({
      where: {
        ...(clientId && { client_id: clientId }),
        ...(type && { asset_type: type as AssetType }),
      },
      orderBy: { created_at: 'desc' },
    });

    if (!assets || assets.length === 0) {
      throw new NotFoundException(
        `Asset record with unique ID '${clientId}' was not found.`,
      );
    }

    return {
      status: 'success',
      statusCode: 200,
      message: 'Successfully retrieved all assets.',
      data: assets,
    };
  }

  // ৩. GET SINGLE ASSET BY ID
  async getAssetById(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      throw new NotFoundException(
        `Asset record with unique ID '${id}' was not found.`,
      );
    }
    return {
      status: 'success',
      statusCode: 200,
      message: 'Successfully retrieved asset.',
      data: asset,
    };
  }

  // ৪. PUT / EDIT ASSET WITH SECURITY OWNERSHIP GUARD
  async updateAsset(id: string, dto: UpdateAssteDto, requestUserId: string) {
    const { data: currentAsset } = await this.getAssetById(id);

    if (currentAsset.agent_id !== requestUserId) {
      throw new ForbiddenException(
        'Security Block: You do not possess structural ownership to update this asset.',
      );
    }

    try {
      const updatedAsset = await this.prisma.asset.update({
        where: { id },
        data: {
          asset_type: dto.asset_type,
          property_address: dto.property_address,
          ownership_type: dto.ownership_type,
          property_type: dto.property_type,
          estimated_value: dto.estimated_value,
          outstanding_mortgage: dto.outstanding_mortgage,
          additional_notes: dto.additional_notes,
        },
      });

      return {
        status: 'success',
        statusCode: 200,
        message: 'Asset registration metrics updated perfectly.',
        payload: updatedAsset,
      };
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to commit transactional packet to database: ${err.message}`,
      );
    }
  }

  // ৫. DELETE ASSET WITH SECURITY OWNERSHIP GUARD
  async deleteAsset(id: string, requestUserId: string) {
    const { data: currentAsset } = await this.getAssetById(id);

    if (currentAsset.agent_id !== requestUserId) {
      throw new ForbiddenException(
        'Security Block: Operation terminated. Lack of privileges to drop this record.',
      );
    }

    try {
      await this.prisma.asset.delete({
        where: { id },
      });

      return {
        status: 'success',
        statusCode: 200,
        message: `Asset resource was successfully wiped from the cluster database matrix.`,
      };
    } catch (err) {
      throw new InternalServerErrorException(
        `Wiping engine triggered an internal node error: ${err.message}`,
      );
    }
  }
}
