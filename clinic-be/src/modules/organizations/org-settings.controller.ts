import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions, PERMISSIONS } from 'src/common/permissions';
import { OrgId } from 'src/common/decorators/org-id.decorator';
import { OrganizationsService } from './organizations.service';
import { UpdateRoleDefaultsDto } from './dto/update-role-defaults.dto';

@ApiTags('Organization Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('settings')
export class OrgSettingsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Get('role-defaults')
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async getRoleDefaults(@OrgId() orgId: string) {
    return {
      message: 'Role defaults fetched',
      data: await this.orgsService.getRoleDefaults(orgId),
    };
  }

  @Patch('role-defaults')
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async updateRoleDefaults(
    @OrgId() orgId: string,
    @Body() dto: UpdateRoleDefaultsDto,
  ) {
    return {
      message: 'Role defaults updated',
      data: await this.orgsService.updateRoleDefaults(
        orgId,
        dto.roleDefaultOverrides ?? {},
      ),
    };
  }
}
