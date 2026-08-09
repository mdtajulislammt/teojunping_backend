import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { MeetingFormat, TypeFormat } from '@prisma/client';

export class CreateAppointmentDto {

  @ApiProperty({ enum: MeetingFormat, example: MeetingFormat.INITIAL_CONSULTATION })
  @IsEnum(MeetingFormat)
  @IsNotEmpty()
  appointment_type: MeetingFormat;

  @ApiProperty({ enum: TypeFormat, example: TypeFormat.ZOOM_VIDEO_CALL })
  @IsEnum(TypeFormat)
  @IsNotEmpty()
  meeting_format: TypeFormat;

  @ApiProperty({ example: '2026-07-20T10:00:00.000Z', description: 'Scheduled date and time' })
  @IsString() // Production-এ standard ISO string check or custom transform schema
  @IsNotEmpty()
  scheduled_at: string;

  @ApiPropertyOptional({ example: 45, default: 45, description: 'Duration in minutes' })
  @IsInt()
  @Min(15)
  @IsOptional()
  duration_minutes?: number;

  @ApiPropertyOptional({ example: 'Need discussion regarding real estate asset division.', description: 'Optional client notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}