// src/modules/application/specificbequests/dto/update-specificbequest.dto.ts
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateSpecificbequestDto } from './create-specificbequest.dto';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateSpecificbequestDto extends PartialType(CreateSpecificbequestDto) {
  @ApiPropertyOptional({ 
    type: [String], 
    example: ['attachment-uuid-123'], 
    description: 'Existing attachment IDs to preserve or swap if resetting relation (Optional)' 
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  newAttachmentIds?: string[];
}