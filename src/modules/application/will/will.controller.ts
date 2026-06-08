import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WillService } from './will.service';
import { CreateWillDto } from './dto/create-will.dto';
import { UpdateWillDto } from './dto/update-will.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

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
    console.log('userId::>>', userId, agent_id);
    return this.willService.createWillTransaction(
      userId,
      createWillDto,
      agent_id,
    );
  }

  @Get()
  findAll() {
    return this.willService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.willService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWillDto: UpdateWillDto) {
    return this.willService.update(+id, updateWillDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.willService.remove(+id);
  }
}
