import { PartialType } from '@nestjs/swagger';
import { CreateAssetDto } from './create-asste.dto';
export class UpdateAssteDto extends PartialType(CreateAssetDto) {}
