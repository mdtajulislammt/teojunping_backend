import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Get,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AppointmentsService } from './appoinment.service';
import { CreateAppointmentDto } from './dto/create-appoinment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appoinment.dto';
import { Appointment } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Role } from '../../../common/guard/role/role.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CreateAppointmentResponse,
  DashboardMetricsResponse,
  PaginatedAppointmentListResponse,
} from './dto/appointment-response.interface';
import {
  GetAdminAppointmentsQueryDto,
  GetAppointmentsQueryDto,
  RescheduleAppointmentDto,
} from './dto/get-appointments-query.dto';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('client/book')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Client books a new pending appointment' })
  async clientBook(
    @Req() req: any,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<CreateAppointmentResponse> {
    const clientId = req.user.userId;

    const user = await this.prisma.user.findUnique({
      where: { id: clientId },
      select: { assigned_agent_id: true },
    });

    const agentId = user?.assigned_agent_id;

    if (!agentId) {
      throw new BadRequestException('No agent is assigned to this client.');
    }

    return this.appointmentsService.create(
      clientId,
      agentId,
      createAppointmentDto,
    );
  }

  @Get('agent/metrics')
  @Roles(Role.AGENT)
  @ApiOperation({ summary: 'Get dashboard KPI metrics for logged-in Agent' })
  async getAgentMetrics(@Req() req: any): Promise<DashboardMetricsResponse> {
    const agentId = req.user.userId;
    return this.appointmentsService.getAgentMetrics(agentId);
  }

  @Get('agent/today')
  @Roles(Role.AGENT)
  @ApiOperation({ summary: "Get today's schedule for logged-in Agent" })
  async getTodaySchedule(@Req() req: any) {
    const agentId = req.user.userId;
    return this.appointmentsService.getTodaySchedule(agentId);
  }

  @Get('admin/list')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Admin gets platform-wide appointments with search and filters',
  })
  async getAdminAppointments(
    @Query() query: GetAdminAppointmentsQueryDto,
  ): Promise<PaginatedAppointmentListResponse> {
    return this.appointmentsService.findAllForAdmin(query);
  }

  @Get('agent/list')
  @Roles(Role.AGENT)
  @ApiOperation({ summary: 'Get filtered, paginated appointments for Agent' })
  async getAgentAppointments(
    @Req() req: any,
    @Query() query: GetAppointmentsQueryDto,
  ): Promise<PaginatedAppointmentListResponse> {
    const agentId = req.user.userId;
    return this.appointmentsService.findAllForAgent(agentId, query);
  }
  @Get('client/list')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Get filtered, paginated appointments for client' })
  async getClientAppointments(
    @Req() req: any,
    @Query() query: GetAppointmentsQueryDto,
  ): Promise<PaginatedAppointmentListResponse> {
    const clientId = req.user.userId;
    return this.appointmentsService.findAllForClient(clientId, query);
  }

  @Patch('agent/:id/status')
  @Roles(Role.AGENT)
  @ApiOperation({ summary: 'Agent updates appointment status' })
  async agentUpdateStatus(
    @Param('id') appointmentId: string,
    @Req() req: any,
    @Body() updateStatusDto: UpdateAppointmentStatusDto,
  ): Promise<Appointment> {
    const agentId = req.user.userId;
    return this.appointmentsService.updateStatus(
      appointmentId,
      agentId,
      updateStatusDto,
    );
  }

  @Patch('agent/:id/reschedule')
  @Roles(Role.AGENT)
  @ApiOperation({ summary: 'Agent reschedules an appointment' })
  @ApiBody({ type: RescheduleAppointmentDto })
  async agentReschedule(
    @Param('id') appointmentId: string,
    @Req() req: any,
    @Body() dto: RescheduleAppointmentDto,
  ): Promise<Appointment> {
    const agentId = req.user.userId;
    return this.appointmentsService.reschedule(appointmentId, agentId, dto);
  }
}
