// src/modules/application/asset/asset.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AssetService as AsstesService } from './asstes.service';
import { CreateAssetDto, CreateBulkAssetDto } from './dto/create-asste.dto';
import { UpdateAssteDto } from './dto/update-asste.dto';
@ApiTags('Assets')
@Controller('assets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssetController {
  constructor(private readonly assetService: AsstesService) {}

  @Post('create/:clientId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Create and register multiple properties under a single global Asset Type selection',
  })
  @ApiParam({
    name: 'clientId',
    description: 'The CUID/ID of the Client User',
    type: String,
  })
  async createAssets(
    @Param('clientId') clientId: string,
    @Body() createBulkAssetDto: CreateBulkAssetDto,
    @Req() req: any,
  ) {
    const agentId = req.user.userId;
    return this.assetService.createBulkAssets(
      clientId,
      agentId,
      createBulkAssetDto,
    );
  }

  @Get('all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get all assets with optional filtering by Client ID or Asset Type',
  })
  @ApiQuery({
    name: 'clientId',
    required: false,
    description: 'Filter assets by a specific Client ID',
  })
  @ApiQuery({
    name: 'Type',
    required: false,
    description: 'Filter assets by a specific Asset Type ',
  })
  async getAllAssets(@Query('clientId') clientId?: string, @Query('type') type?: string) {
    return this.assetService.getAllAssets(clientId, type);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single specific asset by its unique UUID' })
  @ApiParam({ name: 'id', description: 'The UUID of the Asset' })
  async getAssetById(@Param('id') id: string) {
    return this.assetService.getAssetById(id);
  }

  @Put('update/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update or edit an existing asset record' })
  @ApiParam({ name: 'id', description: 'The UUID of the Asset to edit' })
  async updateAsset(
    @Param('id') id: string,
    @Body() updateAssetDto: UpdateAssteDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.userId;
    return this.assetService.updateAsset(id, updateAssetDto, requestUserId);
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Safely drop or delete an asset record from registry',
  })
  @ApiParam({ name: 'id', description: 'The UUID of the Asset to delete' })
  async deleteAsset(@Param('id') id: string, @Req() req: any) {
    const requestUserId = req.user.userId;
    return this.assetService.deleteAsset(id, requestUserId);
  }
}
