import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  Query,
  Put,
} from '@nestjs/common';
import { SpecificbequestsService } from './specificbequests.service';
import { CreateSpecificbequestDto } from './dto/create-specificbequest.dto';
import { UpdateSpecificbequestDto } from './dto/update-specificbequest.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';

@Controller('specificbequests')
@ApiTags('Specific Bequests')
export class SpecificbequestsController {
  constructor(
    private readonly specificbequestsService: SpecificbequestsService,
  ) {}

@Post('create/:clientId')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@HttpCode(HttpStatus.CREATED)
@ApiConsumes('multipart/form-data')
@UseInterceptors(FilesInterceptor('files'))
async createBequest(
  @Param('clientId') clientId: string,
  @Body() dto: CreateSpecificbequestDto,
  @Req() req: any,
  @UploadedFiles() files: Express.Multer.File[],
) {
  const agentId = req.user.userId;

  return this.specificbequestsService.createSpecificbequest(
    clientId,
    agentId,
    dto,
    files,
  );
}
@Get('all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all specific bequests with optional filtering by Will ID' })
  @ApiQuery({ name: 'willId', required: false, description: 'Filter assets by a specific Will UUID' })
  async getAllBequests(@Query('willId') willId?: string) {
    return this.specificbequestsService.getAllBequests(willId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific bequest asset by its unique UUID' })
  @ApiParam({ name: 'id', description: 'The UUID of the Specific Bequest' })
  async getBequestById(@Param('id') id: string) {
    return this.specificbequestsService.getBequestById(id);
  }

  @Put('update/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Edit or update an existing specific bequest asset description/value' })
  @ApiParam({ name: 'id', description: 'The UUID of the Specific Bequest to edit' })
  async updateBequest(
    @Param('id') id: string,
    @Body() dto: UpdateSpecificbequestDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.userId; // JWT থেকে লগইন করা ইউজারের আইডি
    return this.specificbequestsService.updateBequestTransaction(id, dto, requestUserId);
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a specific bequest record safely from a will context' })
  @ApiParam({ name: 'id', description: 'The UUID of the Specific Bequest to delete' })
  async deleteBequest(@Param('id') id: string, @Req() req: any) {
    const requestUserId = req.user.userId;
    return this.specificbequestsService.deleteBequestTransaction(id, requestUserId);
  }
}
