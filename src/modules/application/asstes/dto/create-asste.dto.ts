export class CreateAssteDto {}

// src/modules/application/asset/dto/create-asset.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';

export class CreateAssetDto {
  @ApiProperty({ enum: AssetType, example: AssetType.PROPERTY })
  @IsEnum(AssetType)
  asset_type: AssetType;

  @ApiPropertyOptional({ example: '12 Elm Street, London, EC1A 1BB' })
  @IsString()
  @IsOptional()
  property_address?: string;

  @ApiPropertyOptional({
    example: 'Sole Owner',
    description: 'e.g., Sole Owner, Joint Tenants',
  })
  @IsString()
  @IsOptional()
  ownership_type?: string;

  @ApiPropertyOptional({
    example: 'Residential',
    description: 'e.g., Residential, Commercial',
  })
  @IsString()
  @IsOptional()
  property_type?: string;

  @ApiPropertyOptional({ example: 450000.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  estimated_value?: number;

  @ApiPropertyOptional({ example: 0.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  outstanding_mortgage?: number;

  @ApiPropertyOptional({ example: 'Tenants, co-owners, special conditions...' })
  @IsString()
  @IsOptional()
  additional_notes?: string;
}

export class AssetFieldsDto {
  @ApiPropertyOptional({ example: '12 Elm Street, London, EC1A 1BB' })
  @IsString()
  @IsOptional()
  property_address?: string;

  @ApiPropertyOptional({ example: 'Sole Owner' })
  @IsString()
  @IsOptional()
  ownership_type?: string;

  @ApiPropertyOptional({ example: 'Residential' })
  @IsString()
  @IsOptional()
  property_type?: string;

  @ApiPropertyOptional({ example: 450000.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  estimated_value?: number;

  @ApiPropertyOptional({ example: 0.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  outstanding_mortgage?: number;

  @ApiPropertyOptional({ example: 'Tenants, co-owners, special conditions...' })
  @IsString()
  @IsOptional()
  additional_notes?: string;
}

export class CreateBulkAssetDto {
  @ApiProperty({
    enum: AssetType,
    example: AssetType.PROPERTY,
    description: 'Selected once at the top',
  })
  @IsEnum(AssetType)
  @IsNotEmpty()
  asset_type: AssetType;

  @ApiProperty({
    type: [AssetFieldsDto],
    description: 'List of assets generated via + Add Another button',
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AssetFieldsDto)
  assets: AssetFieldsDto[];
}
