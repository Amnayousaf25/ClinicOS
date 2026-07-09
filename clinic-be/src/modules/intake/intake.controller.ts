import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IntakeService } from './intake.service';
import { SubmitIntakeDto } from './dto/submit-intake.dto';
import { UpdateIntakeDto } from './dto/update-intake.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions, PERMISSIONS } from 'src/common/permissions';
import { OrgId } from 'src/common/decorators/org-id.decorator';
import { RESPONSE } from 'src/common/constants/response.constants';
import { CONFIG } from 'src/common/constants/config.constants';
import { JwtPayload } from 'src/common/types/jwt-payload.types';

@ApiTags('Intake Forms')
@Controller('intake')
export class IntakeController {
  constructor(
    private readonly intakeService: IntakeService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private async resolveOrgIdFromBearer(req: any): Promise<string | undefined> {
    const authHeader = req.headers?.authorization;
    if (!authHeader?.startsWith('Bearer ')) return undefined;

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) return undefined;

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get(CONFIG.JWT_SECRET),
      });
      return payload.orgId;
    } catch {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  /** Public: get intake context for an existing appointment */
  @Get(':appointmentId')
  async getPublicAppointmentInfo(
    @Param('appointmentId') appointmentId: string,
  ) {
    return {
      message: RESPONSE.INTAKE.INFO_FETCHED,
      data: await this.intakeService.getPublicAppointmentInfo(appointmentId),
    };
  }

  /** Public or staff: submit intake form, optionally linked to an existing appointment */
  @Post()
  async submitForm(@Body() dto: SubmitIntakeDto, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    const orgId = dto.appointmentId
      ? undefined
      : await this.resolveOrgIdFromBearer(req);
    return {
      message: RESPONSE.INTAKE.SUBMITTED,
      data: await this.intakeService.submitForm(dto, orgId, ip),
    };
  }

  /** Protected: staff views submitted form data */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.INTAKE_VIEW)
  @Get(':appointmentId/submission')
  async getSubmission(
    @Param('appointmentId') appointmentId: string,
    @OrgId() orgId: string,
  ) {
    return {
      message: RESPONSE.INTAKE.FORM_FETCHED,
      data: await this.intakeService.getSubmission(appointmentId, orgId),
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.INTAKE_VIEW)
  @Patch(':appointmentId/submission')
  async updateSubmission(
    @Param('appointmentId') appointmentId: string,
    @OrgId() orgId: string,
    @Body() dto: UpdateIntakeDto,
  ) {
    return {
      message: RESPONSE.INTAKE.FORM_FETCHED,
      data: await this.intakeService.updateSubmission(
        appointmentId,
        orgId,
        dto,
      ),
    };
  }
}
