// src/will/dto/update-specific-bequest.dto.ts
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateSpecificbequestDto } from './create-specificbequest.dto';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateSpecificbequestDto extends PartialType(
  CreateSpecificbequestDto,
) {
  @ApiPropertyOptional({
    type: [String],
    example: ['cuid9876543210'],
    description:
      'New array of attachment IDs to strictly replace current ones (Optional)',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  newAttachmentIds?: string[];
}
