import { PartialType } from '@nestjs/swagger';
import { CreateWillDto } from './create-will.dto';

export class UpdateWillDto extends PartialType(CreateWillDto) {}
