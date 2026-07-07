import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { RescheduleDto } from './dto/reschedule.dto';
import { CancelDto } from './dto/cancel.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions, PERMISSIONS } from 'src/common/permissions';
import { OrgId } from 'src/common/decorators/org-id.decorator';
import { RESPONSE } from 'src/common/constants/response.constants';
import { AppointmentHistoryActor } from './schemas/appointment-history.schema';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @Permissions(PERMISSIONS.APPOINTMENTS_READ)
  async findAll(
    @OrgId() orgId: string,
    @Query('period') period?: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
  ) {
    return {
      message: RESPONSE.APPOINTMENTS.FETCHED,
      data: await this.appointmentsService.findAll(orgId, {
        period,
        date,
        status,
      }),
    };
  }

  @Get('stats')
  @Permissions(PERMISSIONS.APPOINTMENTS_READ)
  async getStats(@OrgId() orgId: string, @Query('period') period?: string) {
    return {
      message: RESPONSE.APPOINTMENTS.STATS_FETCHED,
      data: await this.appointmentsService.getStats(orgId, period),
    };
  }

  @Get('patient-history')
  @Permissions(PERMISSIONS.APPOINTMENTS_READ)
  async getPatientHistory(
    @OrgId() orgId: string,
    @Query('phone') phone: string,
  ) {
    return {
      message: RESPONSE.APPOINTMENTS.PATIENT_HISTORY_FETCHED,
      data: await this.appointmentsService.getPatientHistoryByPhone(
        orgId,
        phone,
      ),
    };
  }

  @Get(':id')
  @Permissions(PERMISSIONS.APPOINTMENTS_READ)
  async findOne(@OrgId() orgId: string, @Param('id') id: string) {
    return {
      message: RESPONSE.APPOINTMENTS.FETCHED,
      data: await this.appointmentsService.findById(orgId, id),
    };
  }

  @Get(':id/history')
  @Permissions(PERMISSIONS.APPOINTMENTS_READ)
  async getHistory(@OrgId() orgId: string, @Param('id') id: string) {
    return {
      message: RESPONSE.APPOINTMENTS.HISTORY_FETCHED,
      data: await this.appointmentsService.getAppointmentHistory(orgId, id),
    };
  }

  @Post()
  @Permissions(PERMISSIONS.APPOINTMENTS_MANAGE)
  async create(
    @OrgId() orgId: string,
    @Body() dto: CreateAppointmentDto,
    @Request() req: any,
  ) {
    return {
      message: RESPONSE.APPOINTMENTS.CREATED,
      data: await this.appointmentsService.create(orgId, dto, req.user?.id),
    };
  }

  @Patch(':id/status')
  @Permissions(PERMISSIONS.APPOINTMENTS_MANAGE)
  async updateStatus(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req: any,
  ) {
    return {
      message: RESPONSE.APPOINTMENTS.STATUS_UPDATED,
      data: await this.appointmentsService.updateStatus(orgId, id, dto.status, {
        actor: AppointmentHistoryActor.Staff,
        changedBy: req.user?.id,
      }),
    };
  }

  @Patch(':id/reschedule')
  @Permissions(PERMISSIONS.APPOINTMENTS_MANAGE)
  async reschedule(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: RescheduleDto,
    @Request() req: any,
  ) {
    return {
      message: RESPONSE.APPOINTMENTS.RESCHEDULED,
      data: await this.appointmentsService.reschedule(orgId, id, dto, {
        actor: AppointmentHistoryActor.Staff,
        changedBy: req.user?.id,
      }),
    };
  }

  @Patch(':id/reconfirm')
  @Permissions(PERMISSIONS.APPOINTMENTS_MANAGE)
  async reconfirm(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return {
      message: RESPONSE.APPOINTMENTS.RECONFIRMED,
      data: await this.appointmentsService.reconfirm(orgId, id, {
        actor: AppointmentHistoryActor.Staff,
        changedBy: req.user?.id,
      }),
    };
  }

  @Post(':id/send-confirmation-sms')
  @Permissions(PERMISSIONS.APPOINTMENTS_MANAGE)
  async sendConfirmationSms(@OrgId() orgId: string, @Param('id') id: string) {
    return {
      message: RESPONSE.APPOINTMENTS.CONFIRMATION_SMS_SENT,
      data: await this.appointmentsService.sendConfirmationSms(orgId, id),
    };
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.APPOINTMENTS_MANAGE)
  async cancel(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: CancelDto,
    @Request() req: any,
  ) {
    return {
      message: RESPONSE.APPOINTMENTS.CANCELLED,
      data: await this.appointmentsService.cancel(orgId, id, dto, {
        actor: AppointmentHistoryActor.Staff,
        changedBy: req.user?.id,
      }),
    };
  }
}
