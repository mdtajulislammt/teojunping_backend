import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appoinment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appoinment.dto';
import { Appointment, AppointmentStatus } from 'prisma/generated/client';

export interface CreateAppointmentResponse {
  success: boolean;
  message: string;
  appointment: Appointment;
}

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    clientId: string,
    agentId: string,
    dto: CreateAppointmentDto,
  ): Promise<CreateAppointmentResponse> {
    // 1. Prisma operation MUST be awaited
    const appointment_post = await this.prisma.appointment.create({
      data: {
        clientId: clientId,
        agentId: agentId,
        appointmentType: dto.appointment_type,
        meetingFormat: dto.meeting_format,
        scheduledAt: new Date(dto.scheduled_at),
        durationMinutes: dto.duration_minutes ?? 45,
        notes: dto.notes,
        status: AppointmentStatus.PENDING,
      },
    });

    // 2. Return payload strictly matches Promise<CreateAppointmentResponse>
    return {
      success: true,
      message: 'Appointment booked successfully',
      appointment: appointment_post,
    };
  }

  async updateStatus(
    appointmentId: string, 
    agentId: string, 
    dto: UpdateAppointmentStatusDto,
  ): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.agentId !== agentId) {
      throw new BadRequestException('You are not authorized to manage this appointment');
    }

    // Business Logic Validation: Confirmed status hole Zoom link validation check
    if (dto.status === AppointmentStatus.CONFIRMED && !dto.zoom_link) {
      throw new BadRequestException('Zoom link is required to confirm the appointment');
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: dto.status,
        zoomLink: dto.zoom_link,
      },
    });
  }

  async findAllForAgent(agentId: string): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { agentId: agentId },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findAllForClient(clientId: string): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { clientId: clientId },
      orderBy: { scheduledAt: 'desc' },
    });
  }
}