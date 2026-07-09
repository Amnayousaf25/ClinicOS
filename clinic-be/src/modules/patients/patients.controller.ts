import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions, PERMISSIONS } from 'src/common/permissions';
import { OrgId } from 'src/common/decorators/org-id.decorator';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get('search')
  @Permissions(PERMISSIONS.APPOINTMENTS_READ)
  async search(
    @OrgId() orgId: string,
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    const lim = limit ? Math.min(50, parseInt(limit, 10) || 10) : 10;
    return {
      message: 'Patients fetched',
      data: await this.patientsService.search(orgId, q || '', lim),
    };
  }

  @Post()
  @Permissions(PERMISSIONS.APPOINTMENTS_MANAGE)
  async create(@OrgId() orgId: string, @Body() dto: CreatePatientDto) {
    const patient = await this.patientsService.createPatient({
      orgId: new Types.ObjectId(orgId),
      ...dto,
    });
    return { message: 'Patient created', data: patient };
  }

  @Post('backfill')
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async backfill() {
    const sanitized = await this.patientsService.sanitizeLegacyRefs();
    const linked = await this.patientsService.backfillFromAppointments();
    const mrns = await this.patientsService.backfillMrns();
    return {
      message: 'Backfill complete',
      data: { sanitized, linked, mrns },
    };
  }

  @Get(':id')
  @Permissions(PERMISSIONS.APPOINTMENTS_READ)
  async findOne(@OrgId() orgId: string, @Param('id') id: string) {
    return {
      message: 'Patient fetched',
      data: await this.patientsService.findById(orgId, id),
    };
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.APPOINTMENTS_MANAGE)
  async update(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    const updated = await this.patientsService.updatePatient(
      new Types.ObjectId(orgId),
      id,
      dto,
    );
    return { message: 'Patient updated', data: updated };
  }
}
