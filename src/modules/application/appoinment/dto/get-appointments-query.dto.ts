// dto/get-appointments-query.dto.ts
import {
  IsOptional,
  IsEnum,
  IsString,
  IsInt,
  Min,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from 'prisma/generated/client';
import { ApiProperty } from '@nestjs/swagger';

export class GetAppointmentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 8;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}

export class RescheduleAppointmentDto {
  @ApiProperty({
    example: '2026-08-01T10:00:00.000Z',
    description: 'New scheduled date and time',
  })
  @IsNotEmpty()
  @IsDateString()
  scheduled_at: string;
}


export enum DateRangeFilter {
  THIS_WEEK = 'THIS_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  TODAY = 'TODAY',
  ALL = 'ALL',
}

export class GetAdminAppointmentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 8;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsEnum(DateRangeFilter)
  dateRange?: DateRangeFilter;
}