import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appoinment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appoinment.dto';
import {
  Appointment,
  AppointmentStatus,
  Prisma,
} from 'prisma/generated/client';
import {
  CreateAppointmentResponse,
  DashboardMetricsResponse,
  PaginatedAppointmentListResponse,
} from './dto/appointment-response.interface';
import {
  DateRangeFilter,
  GetAdminAppointmentsQueryDto,
  GetAppointmentsQueryDto,
  RescheduleAppointmentDto,
} from './dto/get-appointments-query.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    clientId: string,
    agentId: string,
    dto: CreateAppointmentDto,
  ): Promise<CreateAppointmentResponse> {
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

    return {
      success: true,
      message: 'Appointment booked successfully',
      appointment: appointment_post,
    };
  }

  async getAgentMetrics(agentId: string): Promise<DashboardMetricsResponse> {
    const now = new Date();

    // Date Ranges
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // Queries executed concurrently
    const [
      thisWeekCount,
      lastWeekCount,
      thisMonthCount,
      lastMonthCount,
      pendingCount,
      todayAppointments,
      weeklyBreakdown,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: { agentId, scheduledAt: { gte: startOfWeek } },
      }),
      this.prisma.appointment.count({
        where: {
          agentId,
          scheduledAt: { gte: startOfLastWeek, lt: startOfWeek },
        },
      }),
      this.prisma.appointment.count({
        where: { agentId, scheduledAt: { gte: startOfMonth } },
      }),
      this.prisma.appointment.count({
        where: {
          agentId,
          scheduledAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
      }),
      this.prisma.appointment.count({
        where: { agentId, status: AppointmentStatus.PENDING },
      }),
      this.prisma.appointment.findMany({
        where: { agentId, scheduledAt: { gte: startOfToday, lte: endOfToday } },
        orderBy: { scheduledAt: 'asc' },
      }),
      this.prisma.appointment.groupBy({
        by: ['status'],
        where: { agentId, scheduledAt: { gte: startOfWeek } },
        _count: { status: true },
      }),
    ]);

    const statusMap = weeklyBreakdown.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      },
      {} as Record<string, number>,
    );

    const nextAppointment = todayAppointments.find((a) => a.scheduledAt > now);

    return {
      success: true,
      data: {
        thisWeek: {
          count: thisWeekCount,
          growthVsLastWeek: thisWeekCount - lastWeekCount,
        },
        thisMonth: {
          count: thisMonthCount,
          growthVsLastMonth: thisMonthCount - lastMonthCount,
        },
        pendingApproval: pendingCount,
        today: {
          count: todayAppointments.length,
          nextAppointmentTime: nextAppointment
            ? nextAppointment.scheduledAt.toISOString()
            : null,
        },
        weeklyBreakdown: {
          confirmed: statusMap[AppointmentStatus.CONFIRMED] || 0,
          pending: statusMap[AppointmentStatus.PENDING] || 0,
          complete: statusMap[AppointmentStatus.COMPLETED] || 0,
          cancelled: statusMap[AppointmentStatus.CANCELLED] || 0,
        },
      },
    };
  }

  async getTodaySchedule(agentId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        agentId,
        scheduledAt: { gte: startOfToday, lte: endOfToday },
      },
      include: {
        client: {
          select: { name: true, email: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return {
      success: true,
      data: appointments,
    };
  }

  async findAllForAdmin(
    query: GetAdminAppointmentsQueryDto,
  ): Promise<PaginatedAppointmentListResponse> {
    const { page = 1, limit = 8, search, status, agentId, dateRange } = query;
    const skip = (page - 1) * limit;

    // Build Prisma Where Clause
    const where: Prisma.AppointmentWhereInput = {};

    // 1. Filter by Status
    if (status) {
      where.status = status;
    }

    // 2. Filter by Specific Agent
    if (agentId) {
      where.agentId = agentId;
    }

    // 3. Search (Client or Agent Name/Email)
    if (search) {
      where.OR = [
        {
          client: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        {
          agent: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    // 4. Date Range Filter
    if (dateRange && dateRange !== DateRangeFilter.ALL) {
      const now = new Date();
      if (dateRange === DateRangeFilter.TODAY) {
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        const endOfToday = new Date(now.setHours(23, 59, 59, 999));
        where.scheduledAt = { gte: startOfToday, lte: endOfToday };
      } else if (dateRange === DateRangeFilter.THIS_WEEK) {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        where.scheduledAt = { gte: startOfWeek };
      } else if (dateRange === DateRangeFilter.THIS_MONTH) {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        where.scheduledAt = { gte: startOfMonth };
      }
    }

    // Execute queries in parallel
    const [total, appointments] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
          agent: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { scheduledAt: 'desc' },
      }),
    ]);

    return {
      success: true,
      message: 'Platform appointments fetched successfully',
      data: appointments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllForAgent(
    agentId: string,
    query: GetAppointmentsQueryDto,
  ): Promise<PaginatedAppointmentListResponse> {
    const { page = 1, limit = 8, search, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = {
      agentId,
      ...(status && { status }),
      ...(search && {
        client: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      }),
    };

    const [total, appointments] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { scheduledAt: 'desc' },
      }),
    ]);

    return {
      success: true,
      message: 'Appointments fetched successfully',
      data: appointments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllForClient(
    clientId: string,
    query: GetAppointmentsQueryDto,
  ): Promise<PaginatedAppointmentListResponse> {
    const { page = 1, limit = 8, search, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = {
      clientId,
      ...(status && { status }),
      ...(search && {
        client: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      }),
    };

    const [total, appointments] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { scheduledAt: 'desc' },
      }),
    ]);

    return {
      success: true,
      message: 'Appointments fetched successfully',
      data: appointments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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
      throw new BadRequestException(
        'You are not authorized to manage this appointment',
      );
    }

    if (dto.status === AppointmentStatus.CONFIRMED && !dto.zoom_link) {
      throw new BadRequestException(
        'Zoom link is required to confirm the appointment',
      );
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: dto.status,
        zoomLink: dto.zoom_link,
      },
    });
  }

  async reschedule(
    appointmentId: string,
    agentId: string,
    dto: RescheduleAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.agentId !== agentId) {
      throw new BadRequestException(
        'You are not authorized to manage this appointment',
      );
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        scheduledAt: new Date(dto.scheduled_at),
        status: AppointmentStatus.PENDING,
      },
    });
  }
}
