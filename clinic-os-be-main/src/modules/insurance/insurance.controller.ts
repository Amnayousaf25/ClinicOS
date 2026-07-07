import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InsuranceService } from './insurance.service';
import {
  CreateInsuranceProviderDto,
  UpdateInsuranceProviderDto,
} from './dto/create-insurance-provider.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions, PERMISSIONS } from 'src/common/permissions';
import { OrgId } from 'src/common/decorators/org-id.decorator';

@ApiTags('Insurance Providers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('insurance-providers')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Get()
  @Permissions(PERMISSIONS.APPOINTMENTS_READ)
  async findAll(@OrgId() orgId: string) {
    return {
      message: 'Insurance providers fetched successfully',
      data: await this.insuranceService.findAllByOrg(orgId),
    };
  }

  @Post()
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async create(
    @OrgId() orgId: string,
    @Body() dto: CreateInsuranceProviderDto,
  ) {
    return {
      message: 'Insurance provider created successfully',
      data: await this.insuranceService.create(orgId, dto),
    };
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async update(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInsuranceProviderDto,
  ) {
    return {
      message: 'Insurance provider updated successfully',
      data: await this.insuranceService.update(orgId, id, dto),
    };
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async remove(@OrgId() orgId: string, @Param('id') id: string) {
    await this.insuranceService.remove(orgId, id);
    return { message: 'Insurance provider deleted successfully' };
  }
}
