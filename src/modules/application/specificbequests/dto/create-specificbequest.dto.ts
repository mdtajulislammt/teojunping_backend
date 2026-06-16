// src/modules/application/specificbequests/dto/create-specificbequest.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsEnum, IsOptional, IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ItemCategory } from 'prisma/generated/client';

export class CreateSpecificbequestDto {
  @ApiProperty({
    example: 'cmq4roxd10000lgtzf83oj010',
    description: 'The UUID of the parent Will',
  })
  @IsString()
  @IsNotEmpty()
  willId: string;

  @ApiProperty({
    enum: ItemCategory,
    example: ItemCategory.JEWELLERY_PRECIOUS_METALS,
  })
  @IsEnum(ItemCategory)
  @IsNotEmpty()
  itemCategory: ItemCategory;

  @ApiProperty({ example: 'Vintage Rolex Submariner 1982' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty({
    example: 'Solid 18k gold oyster perpetual watch with blue dial, stored in the master bedroom safe.',
  })
  @IsString()
  @IsNotEmpty()
  fullDescription: string;

  @ApiPropertyOptional({
    example: 15500.0,
    description: 'Estimated value of the item',
  })
  @Transform(({ value }) => (value ? Number(value) : undefined)) // Form-data string-to-number correction
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  estimatedValue?: number;

  @ApiPropertyOptional({ example: 'Central Safe Deposit Box, London' })
  @IsString()
  @IsOptional()
  locationStorage?: string;

  @ApiPropertyOptional({ example: 'SRN-82910-X' })
  @IsString()
  @IsOptional()
  serialReference?: string;

  @ApiProperty({
    example: 'e5962d07-7174-4694-8550-4e1a73c11e2c',
    description: 'Target Beneficiary UUID',
  })
  @IsString()
  @IsNotEmpty()
  beneficiaryId: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    isArray: true,
    description: 'Select photos or documents for this specific bequest',
  })
  @IsOptional()
  files?: any;
}