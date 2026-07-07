import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions, PERMISSIONS } from 'src/common/permissions';
import { OrgId } from 'src/common/decorators/org-id.decorator';
import { RESPONSE } from 'src/common/constants/response.constants';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('invite')
  @Permissions(PERMISSIONS.TEAM_INVITE)
  async invite(
    @OrgId() orgId: string,
    @Request() req,
    @Body() dto: InviteUserDto,
  ) {
    return {
      message: RESPONSE.USERS.INVITED,
      data: await this.usersService.inviteUser(
        orgId,
        req.user.role,
        dto,
        req.user?._id ?? req.user?.id,
      ),
    };
  }

  @Get()
  @Permissions(PERMISSIONS.TEAM_VIEW)
  async findAll(
    @OrgId() orgId: string,
    @Query('department') department?: string,
    @Query('role') role?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return {
      message: RESPONSE.USERS.FETCHED,
      data: await this.usersService.findAll(orgId, {
        department,
        role,
        includeInactive: includeInactive === 'true',
      }),
    };
  }

  @Get(':id')
  @Permissions(PERMISSIONS.TEAM_VIEW)
  async findOne(@Param('id') id: string) {
    return {
      message: RESPONSE.USERS.FETCHED,
      data: await this.usersService.findOne(id),
    };
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.TEAM_EDIT)
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateUserDto,
  ) {
    if ((dto as any).role === 'superadmin') {
      throw new BadRequestException('Cannot assign superadmin role');
    }
    await this.usersService.enforceHierarchy(req.user, id);
    return {
      message: RESPONSE.USERS.UPDATED,
      data: await this.usersService.update(id, dto),
    };
  }

  @Patch(':id/permissions')
  @Permissions(PERMISSIONS.TEAM_EDIT)
  async updatePermissions(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdatePermissionsDto,
  ) {
    return {
      message: RESPONSE.USERS.UPDATED,
      data: await this.usersService.updatePermissions(
        id,
        dto,
        req.user._id?.toString(),
      ),
    };
  }

  @Get(':id/permissions')
  @Permissions(PERMISSIONS.TEAM_VIEW)
  async getPermissions(@Param('id') id: string) {
    /**
     * Get user's permission configuration
     * Returns: role, roleDefaults, permissionOverrides, effectivePermissions
     */
    return {
      message: 'Permissions retrieved successfully',
      data: await this.usersService.getPermissions(id),
    };
  }

  @Post(':id/permissions/reset')
  @Permissions(PERMISSIONS.TEAM_EDIT)
  async resetPermissions(@Param('id') id: string, @Request() req) {
    /**
     * Clear all permission overrides for user
     * Returns user to role-default permissions
     */
    return {
      message: 'Permission overrides reset to role defaults',
      data: await this.usersService.resetPermissions(
        id,
        req.user._id?.toString(),
      ),
    };
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.TEAM_DELETE)
  async remove(@Param('id') id: string, @Request() req) {
    if (req.user._id.toString() === id) {
      throw new BadRequestException('You cannot delete your own account');
    }
    await this.usersService.enforceHierarchy(req.user, id);
    await this.usersService.softDelete(id);
    return { message: RESPONSE.USERS.DELETED };
  }

  @Post(':id/restore')
  @Permissions(PERMISSIONS.TEAM_DELETE)
  async restore(@Param('id') id: string) {
    return {
      message: RESPONSE.USERS.RESTORED,
      data: await this.usersService.restore(id),
    };
  }

  @Get(':id/export')
  @Permissions(PERMISSIONS.TEAM_VIEW)
  async export(@Param('id') id: string) {
    return {
      message: RESPONSE.USERS.EXPORTED,
      data: await this.usersService.exportData(id),
    };
  }
}
