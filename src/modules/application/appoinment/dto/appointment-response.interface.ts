// interfaces/appointment-response.interface.ts
import { Appointment, AppointmentStatus } from 'prisma/generated/client';

export interface CreateAppointmentResponse {
  success: boolean;
  message: string;
  appointment: Appointment;
}

export interface DashboardMetricsResponse {
  success: boolean;
  data: {
    thisWeek: { count: number; growthVsLastWeek: number };
    thisMonth: { count: number; growthVsLastMonth: number };
    pendingApproval: number;
    today: { count: number; nextAppointmentTime: string | null };
    weeklyBreakdown: {
      confirmed: number;
      pending: number;
      complete: number;
      cancelled: number;
    };
  };
}

export interface PaginatedAppointmentListResponse {
  success: boolean;
  message: string;
  data: Appointment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}