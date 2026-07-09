import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClinicSettingsService } from './clinic-settings.service';
import { UpdateClinicSettingsDto } from './dto/update-settings.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { BlockSlotDto } from './dto/block-slot.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions, PERMISSIONS } from 'src/common/permissions';
import { OrgId } from 'src/common/decorators/org-id.decorator';
import { RESPONSE } from 'src/common/constants/response.constants';

@ApiTags('Clinic Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('clinic-settings')
export class ClinicSettingsController {
  constructor(private readonly settingsService: ClinicSettingsService) {}

  @Get()
  @Permissions(PERMISSIONS.APPOINTMENTS_READ)
  async getSettings(@OrgId() orgId: string) {
    return {
      message: RESPONSE.CLINIC_SETTINGS.FETCHED,
      data: await this.settingsService.getOrCreate(orgId),
    };
  }

  @Patch()
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async updateSettings(
    @OrgId() orgId: string,
    @Body() dto: UpdateClinicSettingsDto,
  ) {
    return {
      message: RESPONSE.CLINIC_SETTINGS.UPDATED,
      data: await this.settingsService.update(orgId, dto),
    };
  }

  @Patch('availability')
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async updateAvailability(
    @OrgId() orgId: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return {
      message: RESPONSE.CLINIC_SETTINGS.UPDATED,
      data: await this.settingsService.updateAvailability(orgId, dto),
    };
  }

  @Post('block-slot')
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async blockSlot(@OrgId() orgId: string, @Body() dto: BlockSlotDto) {
    return {
      message: RESPONSE.CLINIC_SETTINGS.SLOT_BLOCKED,
      data: await this.settingsService.blockSlot(orgId, dto),
    };
  }

  @Delete('block-slot')
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async unblockSlot(@OrgId() orgId: string, @Body() dto: BlockSlotDto) {
    return {
      message: RESPONSE.CLINIC_SETTINGS.SLOT_UNBLOCKED,
      data: await this.settingsService.unblockSlot(orgId, dto),
    };
  }
}
