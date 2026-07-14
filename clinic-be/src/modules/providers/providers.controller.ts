import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import {
  CreateProviderDto,
  UpdateProviderDto,
} from './dto/create-provider.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions, PERMISSIONS } from 'src/common/permissions';
import { OrgId } from 'src/common/decorators/org-id.decorator';

@ApiTags('Providers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @Permissions(PERMISSIONS.APPOINTMENTS_READ)
  async findAll(
    @OrgId() orgId: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return {
      message: 'Providers fetched successfully',
      data: await this.providersService.findAllByOrg(orgId, serviceId),
    };
  }

  @Post()
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async create(@OrgId() orgId: string, @Body() dto: CreateProviderDto) {
    return {
      message: 'Provider created successfully',
      data: await this.providersService.create(orgId, dto),
    };
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async update(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProviderDto,
  ) {
    return {
      message: 'Provider updated successfully',
      data: await this.providersService.update(orgId, id, dto),
    };
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async remove(@OrgId() orgId: string, @Param('id') id: string) {
    await this.providersService.remove(orgId, id);
    return { message: 'Provider deleted successfully' };
  }
}
