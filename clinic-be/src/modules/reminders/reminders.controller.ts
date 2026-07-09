import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { UpdateReminderConfigDto } from './dto/update-config.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions, PERMISSIONS } from 'src/common/permissions';
import { OrgId } from 'src/common/decorators/org-id.decorator';

@ApiTags('Reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get('configs')
  @Permissions(PERMISSIONS.APPOINTMENTS_READ)
  async getConfigs(@OrgId() orgId: string) {
    return {
      message: 'Reminder configs fetched',
      data: await this.remindersService.getConfigs(orgId),
    };
  }

  @Patch('configs/:id')
  @Permissions(PERMISSIONS.REMINDERS_MANAGE)
  async updateConfig(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReminderConfigDto,
  ) {
    return {
      message: 'Reminder config updated',
      data: await this.remindersService.updateConfig(orgId, id, dto),
    };
  }

  @Get('log')
  @Permissions(PERMISSIONS.APPOINTMENTS_READ)
  async getLog(
    @OrgId() orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      message: 'Reminder log fetched',
      data: await this.remindersService.getLog(orgId, {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50,
      }),
    };
  }
}
