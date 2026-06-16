// src/modules/application/specificbequests/specificbequests.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  Put,
  Get,
  Delete,
} from '@nestjs/common';
import { SpecificbequestsService } from './specificbequests.service';
import { CreateSpecificbequestDto } from './dto/create-specificbequest.dto';
import { UpdateSpecificbequestDto } from './dto/update-specificbequest.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Specific Bequests')
@Controller('specificbequests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SpecificbequestsController {
  constructor(private readonly specificbequestsService: SpecificbequestsService) {}

  @Post('create/:clientId')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Create a specific bequest with asset proof documents attached' })
  @ApiParam({ name: 'clientId', description: 'The ID of the Client User', type: String })
  async createSpecificBequest(
    @Param('clientId') clientId: string,
    @Body() dto: CreateSpecificbequestDto,
    @Req() req: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const agentId = req.user.userId;
    return this.specificbequestsService.createSpecificbequest(clientId, agentId, dto, files);
  }

  //get all 
  @Get('getall/:clientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all specific bequests for a client' })
  @ApiParam({ name: 'clientId', description: 'The ID of the Client User', type: String })
  async getAllSpecificBequests(
    @Param('clientId') clientId: string,
    @Req() req: any,
  ) {
    const agentId = req.user.userId;
    return this.specificbequestsService.getAllSpecificBequests(clientId, agentId);
  }

  //get single specific bequest
  @Get('get/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific bequest by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the Specific Bequest', type: String })
  async getSpecificBequest(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const agentId = req.user.userId;
    return this.specificbequestsService.getSpecificBequest(id, agentId);
  }


  // update 
  @Put('update/:id')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Edit or update an existing specific bequest including file attachment upgrades' })
  @ApiParam({ name: 'id', description: 'The UUID of the Specific Bequest to edit', type: String })
  async updateBequest(
    @Param('id') id: string,
    @Body() dto: UpdateSpecificbequestDto,
    @Req() req: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const requestUserId = req.user.userId;

    // Swagger parsing guard for text array inside multipart form-data
    if (dto.newAttachmentIds && typeof dto.newAttachmentIds === 'string') {
      dto.newAttachmentIds = [dto.newAttachmentIds];
    }

    return this.specificbequestsService.updateBequestTransaction(id, dto, requestUserId, files);
  }

  // delete 
  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a specific bequest' })
  @ApiParam({ name: 'id', description: 'The ID of the Specific Bequest to delete', type: String })
  async deleteBequest(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const requestUserId = req.user.userId;
    return this.specificbequestsService.deleteBequest(id, requestUserId);
  }
}