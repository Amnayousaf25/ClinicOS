import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions, PERMISSIONS } from 'src/common/permissions';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateFirstAdminDto } from './dto/create-first-admin.dto';

@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions(PERMISSIONS.ORG_MANAGE)
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  create(@Body() dto: CreateOrganizationDto) {
    return this.orgsService.create(dto);
  }

  @Get()
  findAll(): ReturnType<OrganizationsService['findAll']> {
    return this.orgsService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.orgsService.findById(id);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.orgsService.getOrgStats(id);
  }

  @Get(':id/users')
  getOrgUsers(@Param('id') id: string) {
    return this.orgsService.getOrgUsers(id);
  }

  @Post(':id/admin')
  createFirstAdmin(@Param('id') id: string, @Body() dto: CreateFirstAdminDto) {
    return this.orgsService.createFirstAdmin(id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.orgsService.update(id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.orgsService.deactivate(id);
  }
}
