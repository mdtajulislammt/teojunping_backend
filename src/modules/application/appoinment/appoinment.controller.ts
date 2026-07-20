import { Controller, Post, Body, Patch, Param, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appoinment.service';
import { CreateAppointmentDto } from './dto/create-appoinment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appoinment.dto';
import { Appointment } from 'prisma/generated/client';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Role } from '../../../common/guard/role/role.enum';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post('client/book')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Client books a new pending appointment (Story image_29a105.png)' })
  @ApiResponse({ status: 201, description: 'Appointment requested successfully.' })
  async clientBook(
    @Req() req: any,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const clientId = req.user.userId;
    return this.appointmentsService.create(clientId, createAppointmentDto);
  }

  @Patch('agent/:id/status')
  @Roles(Role.AGENT)
  @ApiOperation({ summary: 'Agent confirms, completes, or cancels an appointment (Story image_29a0a9.png)' })
  @ApiResponse({ status: 200, description: 'Appointment status updated successfully.' })
  async agentUpdateStatus(
    @Param('id') appointmentId: string,
    @Req() req: any,
    @Body() updateStatusDto: UpdateAppointmentStatusDto,
  ): Promise<Appointment> {
    const agentId = req.user.userId;
    return this.appointmentsService.updateStatus(appointmentId, agentId, updateStatusDto);
  }

  @Get('agent/list')
  @Roles(Role.AGENT)
  @ApiOperation({ summary: 'Get all appointments for the logged-in Agent' })
  async getAgentAppointments(@Req() req: any): Promise<Appointment[]> {
    const agentId = req.user.userId;
    return this.appointmentsService.findAllForAgent(agentId);
  }

  @Get('client/list')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Get all appointments for the logged-in Client' })
  async getClientAppointments(@Req() req: any): Promise<Appointment[]> {
    const clientId = req.user.userId;
    return this.appointmentsService.findAllForClient(clientId);
  }
}