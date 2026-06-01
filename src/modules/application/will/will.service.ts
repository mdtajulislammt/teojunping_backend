import { Injectable } from '@nestjs/common';
import { CreateWillDto } from './dto/create-will.dto';
import { UpdateWillDto } from './dto/update-will.dto';

@Injectable()
export class WillService {
  create(createWillDto: CreateWillDto) {
    return 'This action adds a new will';
  }

  findAll() {
    return `This action returns all will`;
  }

  findOne(id: number) {
    return `This action returns a #${id} will`;
  }

  update(id: number, updateWillDto: UpdateWillDto) {
    return `This action updates a #${id} will`;
  }

  remove(id: number) {
    return `This action removes a #${id} will`;
  }
}
