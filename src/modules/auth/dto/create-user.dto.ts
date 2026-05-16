import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ServicePlan, UserType } from 'prisma/generated/client';

export class CreateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '019948547647' })
  @ApiProperty()
  phone_number?: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @MinLength(8, { message: 'Password should be minimum 8 characters' })
  password: string;

  @ApiPropertyOptional({
    enum: UserType,
    default: UserType.CLIENT,
  })
  @ApiProperty({ example: UserType.CLIENT })
  @IsOptional()
  @IsEnum(UserType)
  type?: UserType;
}

export class RegisterClientDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({ example: 'client@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '019948547647' })
  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @ApiProperty({ example: 'Male' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ example: '1999-02-17' })
  @IsDateString()
  @IsNotEmpty()
  date_of_birth: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'password123' })
  @MinLength(8, { message: 'Password should be minimum 8 characters' })
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: ServicePlan.BASIC })
  @IsEnum(ServicePlan)
  @IsOptional()
  service_plan?: ServicePlan;

  @ApiPropertyOptional({ example: 'agent_id' })
  @IsOptional()
  assigned_agent_id?: string;
}

export class RegisterAgentDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({ example: 'agent@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '019948547647' })
  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @ApiProperty({ example: 'Male' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ example: '1999-02-17' })
  @IsDateString()
  @IsNotEmpty()
  date_of_birth: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'password123' })
  @MinLength(8, { message: 'Password should be minimum 8 characters' })
  @IsNotEmpty()
  password: string;

  // Agent Specific Fields
  @ApiProperty({ example: 'Certification Body' })
  @IsString()
  @IsNotEmpty()
  certification_body: string;

  @ApiProperty({ example: 'Certification Number' })
  @IsString()
  @IsNotEmpty()
  certification_number: string;

  @ApiProperty({ example: '2' })
  @IsString()
  @IsNotEmpty()
  years_of_experience: string;

  @ApiProperty({ example: 'Will Writing' })
  @IsString()
  @IsNotEmpty()
  specialisation: string;

  @ApiProperty({ example: 'Professional Bio' })
  @IsString()
  @IsOptional()
  professional_bio?: string;

  @ApiProperty({ example: 'attachment_id' })
  @IsString()
  @IsNotEmpty()
  attachment_id: string; // From file upload service

  @ApiProperty({ example: '' })
  @IsString()
  preferred_working_hours: string;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  max_clients_per_month?: number;
}
