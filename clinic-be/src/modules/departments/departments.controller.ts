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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions, PERMISSIONS } from 'src/common/permissions';
import { RESPONSE } from 'src/common/constants/response.constants';
import { OrgId } from 'src/common/decorators/org-id.decorator';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @Permissions(PERMISSIONS.DEPARTMENTS_VIEW)
  async findAll(@OrgId() orgId: string) {
    return {
      message: RESPONSE.DEPARTMENTS.FETCHED,
      data: await this.departmentsService.findAll(orgId),
    };
  }

  @Post()
  @Permissions(PERMISSIONS.DEPARTMENTS_MANAGE)
  async create(@OrgId() orgId: string, @Body() dto: CreateDepartmentDto) {
    return {
      message: RESPONSE.DEPARTMENTS.CREATED,
      data: await this.departmentsService.create(orgId, dto),
    };
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.DEPARTMENTS_MANAGE)
  async update(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: CreateDepartmentDto,
  ) {
    return {
      message: RESPONSE.DEPARTMENTS.UPDATED,
      data: await this.departmentsService.update(orgId, id, dto),
    };
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.DEPARTMENTS_MANAGE)
  async remove(@OrgId() orgId: string, @Param('id') id: string) {
    await this.departmentsService.remove(orgId, id);
    return { message: RESPONSE.DEPARTMENTS.DELETED };
  }
}
