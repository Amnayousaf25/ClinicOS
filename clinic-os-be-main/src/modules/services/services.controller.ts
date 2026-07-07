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
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/create-service.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions, PERMISSIONS } from 'src/common/permissions';
import { OrgId } from 'src/common/decorators/org-id.decorator';
import { RESPONSE } from 'src/common/constants/response.constants';

@ApiTags('Services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @Permissions(PERMISSIONS.APPOINTMENTS_READ)
  async findAll(@OrgId() orgId: string) {
    return {
      message: RESPONSE.SERVICES.FETCHED,
      data: await this.servicesService.findAllByOrg(orgId),
    };
  }

  @Post()
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async create(@OrgId() orgId: string, @Body() dto: CreateServiceDto) {
    return {
      message: RESPONSE.SERVICES.CREATED,
      data: await this.servicesService.create(orgId, dto),
    };
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async update(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return {
      message: RESPONSE.SERVICES.UPDATED,
      data: await this.servicesService.update(orgId, id, dto),
    };
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async remove(@OrgId() orgId: string, @Param('id') id: string) {
    await this.servicesService.remove(orgId, id);
    return { message: RESPONSE.SERVICES.DELETED };
  }
}
