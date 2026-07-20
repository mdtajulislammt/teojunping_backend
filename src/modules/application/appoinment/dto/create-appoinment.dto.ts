import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { MeetingFormat, TypeFormat } from 'prisma/generated/client';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', description: 'ID of the agent selected by the client' })
  @IsUUID()
  @IsNotEmpty()
  agent_id: string;

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