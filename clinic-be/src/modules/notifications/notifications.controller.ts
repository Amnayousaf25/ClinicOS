import {
  Controller,
  Sse,
  MessageEvent,
  Param,
  Get,
  Query,
  Res,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { Observable } from 'rxjs';

import { GetUser } from 'src/modules/auth/decorators/user.decorator';

import { NotificationsService } from './notifications.service';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { NOTIFICATION_ROUTES } from './constants/routes';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller(NOTIFICATION_ROUTES.BASE)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Each client connects here with their userId
  @Sse(NOTIFICATION_ROUTES.STREAM)
  stream(@Param('userId') userId: string): Observable<MessageEvent> {
    return this.notificationsService.subscribe(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(NOTIFICATION_ROUTES.USER)
  async getUserNotifications(
    @GetUser('userId') userId: string,
    @Query() getNotificationsDto: GetNotificationsDto,
    @Res() res: Response,
  ) {
    const { page = 1, limit = 10 } = getNotificationsDto;
    const response = await this.notificationsService.getUserNotifications(
      userId,
      page,
      limit,
    );
    return res.status(response.status).json(response);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(NOTIFICATION_ROUTES.MARK_ALL_AS_READ)
  async markAllNotificationsAsRead(
    @GetUser('userId') userId: string,
    @Res() res: Response,
  ) {
    const response = await this.notificationsService.markAllAsRead(userId);
    return res.status(response.status).json(response);
  }

  @UseGuards(JwtAuthGuard)
  @Get(NOTIFICATION_ROUTES.UNREAD_COUNT)
  @ApiOperation({
    summary: 'Get unread notifications count',
    description:
      'Returns the count of all unread notifications for the authenticated user',
  })
  async getUnreadCount(
    @GetUser('userId') userId: string,
    @Res() res: Response,
  ) {
    const response = await this.notificationsService.getUnreadCount(userId);
    return res.status(response.status).json(response);
  }
}
