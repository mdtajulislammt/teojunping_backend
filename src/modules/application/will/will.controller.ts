// src/modules/application/will/will.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  Put,
} from '@nestjs/common';
import { WillService } from './will.service';
import { CreateWillDto } from './dto/create-will.dto';
import { UpdateWillDto } from './dto/update-will.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@ApiTags('Will')
@Controller('will')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WillController {
  constructor(private readonly willService: WillService) {}

  @Post('create/:userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Execute and generate a secure legal Will record for a client user_id',
  })
  @ApiParam({
    name: 'userId',
    description: 'The CUID of the Client User / Testator',
    type: String,
  })
  @ApiResponse({
    status: 211,
    description:
      'Will generated and mapped cleanly inside the database infrastructure.',
  })
  @ApiResponse({
    status: 400,
    description: 'Business calculation failure or entity checks invalid.',
  })
  async createWill(
    @Param('userId') userId: string,
    @Body() createWillDto: CreateWillDto,
    @Req() req: any,
  ) {
    const agent_id = req.user.userId;
    return this.willService.createWillTransaction(
      userId,
      createWillDto,
      agent_id,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all Will records with absolute relational profiling',
  })
  @ApiResponse({
    status: 200,
    description: 'Will records retrieved successfully.',
  })
  async findAll() {
    return this.willService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific Will record by its unique CUID' })
  @ApiParam({
    name: 'id',
    description: 'The CUID string of the Target Will record',
    type: String,
  })
  async findOne(@Param('id') id: string) {
    return this.willService.findOne(id);
  }

  @Put(':id') // Patch এর বদলে REST Standard এবং Prisma Transaction এর জন্য Put ব্যবহার সেরা
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atomically update/override an entire Will structural framework',
  })
  @ApiParam({
    name: 'id',
    description: 'The CUID string of the Will to update',
    type: String,
  })
  async update(
    @Param('id') id: string,
    @Body() updateWillDto: UpdateWillDto,
    @Req() req: any,
  ) {
    const requestUserId = req.user.userId; // Secure Ownership Verification
    return this.willService.updateWillTransaction(
      id,
      updateWillDto,
      requestUserId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Safely purge/remove a Will and cascade delete all its children branches',
  })
  @ApiParam({
    name: 'id',
    description: 'The CUID string of the Will to delete',
    type: String,
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    const requestUserId = req.user.userId;
    return this.willService.removeWillTransaction(id, requestUserId);
  }
}
