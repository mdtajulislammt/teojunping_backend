import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WillService } from './will.service';
import { CreateWillDto } from './dto/create-will.dto';
import { UpdateWillDto } from './dto/update-will.dto';

@Controller('will')
export class WillController {
  constructor(private readonly willService: WillService) {}

  @Post()
  create(@Body() createWillDto: CreateWillDto) {
    return this.willService.create(createWillDto);
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
