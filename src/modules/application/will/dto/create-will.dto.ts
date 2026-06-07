// src/will/dto/create-will.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  MaritalStatus,
  RelationshipType,
  BeneficiaryType,
} from 'prisma/generated/client';

export class CreateDependantDto {
  @ApiProperty({ example: 'Liam Johnson' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ enum: RelationshipType, example: RelationshipType.CHILD })
  @IsEnum(RelationshipType)
  relationship: RelationshipType;
}

export class CreateBeneficiaryDto {
  @ApiProperty({ enum: BeneficiaryType, example: BeneficiaryType.PRIMARY })
  @IsEnum(BeneficiaryType)
  type: BeneficiaryType;

  @ApiProperty({ example: 'Sarah Elizabeth Johnson' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    enum: RelationshipType,
    example: RelationshipType.SPOUSE_PARTNER,
  })
  @IsEnum(RelationshipType)
  relationship: RelationshipType;

  @ApiPropertyOptional({ example: '1988-08-24' })
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiProperty({
    example: 100.0,
    description: 'Percentage share of estate allocated',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  sharePercentage: number;

  @ApiPropertyOptional({ example: '12 Elm Street, London, EC1A 1BB' })
  @IsString()
  @IsOptional()
  contactAddress?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isMinor: boolean;

  @ApiPropertyOptional({ example: 'The residential property equity share' })
  @IsString()
  @IsOptional()
  specificBequest?: string;
}

export class CreateExecutorDto {
  @ApiProperty({
    example: 1,
    description: 'Priority level, e.g., 1 = Primary, 2 = Backup',
  })
  @IsNumber()
  priority: number;

  @ApiProperty({ example: 'James Smith' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ enum: RelationshipType, example: RelationshipType.FRIEND })
  @IsEnum(RelationshipType)
  relationship: RelationshipType;

  @ApiProperty({ example: 'executor.james@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+44 7700 900077' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Full residential address here' })
  @IsString()
  @IsNotEmpty()
  address: string;
}

export class CreateExclusionDto {
  @ApiProperty({ example: 'David Johnson' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ enum: RelationshipType, example: RelationshipType.OTHER })
  @IsEnum(RelationshipType)
  relationship: RelationshipType;

  @ApiPropertyOptional({
    example: 'Formally excluded due to prolonged estrangement',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreateWillDto {
  // @ApiProperty({
  //   example: 'cl0oxg88a0000vuzp4b8k2abc',
  //   description: 'The CUID of the writing Agent',
  // })
  // @IsString()
  // @IsNotEmpty()
  // agentId: string;

  // Step 1A: Testator Information
  @ApiProperty({ example: 'Sarah Elizabeth Johnson' })
  @IsString()
  @IsNotEmpty()
  testatorFullName: string;

  @ApiProperty({ example: '1985-03-14' })
  @IsDateString()
  @IsNotEmpty()
  testatorDob: string;

  @ApiPropertyOptional({ example: 'AB 12 34 56 C' })
  @IsString()
  @IsOptional()
  nationalInsuranceNo?: string;

  @ApiProperty({ enum: MaritalStatus, example: MaritalStatus.MARRIED })
  @IsEnum(MaritalStatus)
  maritalStatus: MaritalStatus;

  @ApiProperty({ example: '12 Elm Street, London, EC1A 1BB' })
  @IsString()
  @IsNotEmpty()
  currentAddress: string;

  @ApiProperty({ example: 'British' })
  @IsString()
  @IsNotEmpty()
  nationality: string;

  @ApiPropertyOptional({ example: 'Accountant' })
  @IsString()
  @IsOptional()
  occupation?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  previouslyMadeWill: boolean;

  // Step 1B & Step 6 Checklist Flags
  @ApiProperty({ example: true })
  @IsBoolean()
  hasImmediateDependants: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  hasChildren: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  hasExclusions: boolean;

  // Step 1: Agent Confirmations
  @ApiProperty({ example: true })
  @IsBoolean()
  agentConfirmSoundMind: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  agentConfirmVerified: boolean;

  // Step 3: Executor Powers
  @ApiProperty({ example: true })
  @IsBoolean()
  powerToSellProperty: boolean;

  // Step 6: Final Checklist Verification Flags
  @ApiProperty({ example: true })
  @IsBoolean()
  testatorInfoCorrect: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  sharesTotalAllocated: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  executorsCorrect: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  exclusionsReviewed: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  childrenConfirmed: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  sectionsApproved: boolean;

  // Child Relational Arrays
  @ApiPropertyOptional({ type: [CreateDependantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDependantDto)
  @IsOptional()
  dependants?: CreateDependantDto[];

  @ApiPropertyOptional({ type: [CreateBeneficiaryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBeneficiaryDto)
  @IsOptional()
  beneficiaries?: CreateBeneficiaryDto[];

  @ApiPropertyOptional({ type: [CreateExecutorDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExecutorDto)
  @IsOptional()
  executors?: CreateExecutorDto[];

  @ApiPropertyOptional({ type: [CreateExclusionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExclusionDto)
  @IsOptional()
  exclusions?: CreateExclusionDto[];
}
