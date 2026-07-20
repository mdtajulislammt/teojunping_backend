import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { AppointmentStatus } from 'prisma/generated/client';

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus, example: AppointmentStatus.CONFIRMED })
  @IsEnum(AppointmentStatus)
  @IsNotEmpty()
  status: AppointmentStatus;

  @ApiPropertyOptional({ example: 'https://zoom.us/j/1234567890', description: 'Zoom link required when status is CONFIRMED' })
  @IsUrl()
  @IsOptional()
  zoom_link?: string;
}