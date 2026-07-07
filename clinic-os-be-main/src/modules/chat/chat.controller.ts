import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/modules/auth/decorators/user.decorator';

import { ChatService } from './chat.service';
import { CHAT_ROUTES } from './constants/routes';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { InitiateChatDto } from './dto/initiate-chat.dto';

/**
 * Chat Controller
 *
 * This controller handles all REST API endpoints for the chat module.
 *
 * Note: Authentication is skipped for now. userId should be provided as a query parameter.
 *
 * Usage Example:
 * ```typescript
 * // Get user's rooms
 * GET /chat/rooms?userId=user-id-here
 *
 * // Get or create room with another user
 * GET /chat/rooms/user/other-user-id?userId=current-user-id
 *
 * // Send a message
 * POST /chat/rooms/room-id/messages?userId=sender-id
 * Body: { content: "Hello!" }
 * ```
 */
@Controller(CHAT_ROUTES.BASE)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Initiate a chat between sender and receiver
   *
   * Creates a new chat room between two users and optionally sends an initial message.
   * If a room already exists between the users, it returns that room.
   * The sender ID is automatically extracted from the authentication token.
   *
   * @param userId - The ID of the sender (from authentication token)
   * @param initiateChatDto - Contains receiverId and optional content for initial message
   * @returns Created room and optionally the initial message
   *
   * @example
   * ```typescript
   * // Initiate chat without initial message
   * POST /chat/initiate
   * Headers: { Authorization: "Bearer <token>" }
   * Body: { receiverId: "receiver-id" }
   *
   * // Initiate chat with initial message
   * POST /chat/initiate
   * Headers: { Authorization: "Bearer <token>" }
   * Body: { receiverId: "receiver-id", content: "Hello!" }
   * ```
   */
  @Post(CHAT_ROUTES.INITIATE)
  @ApiOperation({
    summary: 'Initiate a chat',
    description:
      'Creates a new chat room between sender and receiver, and optionally sends an initial message. If a room already exists, returns that room. Requires authentication.',
  })
  async initiateChat(
    @GetUser('id') userId: string,
    @Body() initiateChatDto: InitiateChatDto,
    @Res() res: Response,
  ) {
    const response = await this.chatService.initiateChat(
      userId,
      initiateChatDto.receiverId,
      initiateChatDto.content,
    );
    return res.status(response.status).json(response);
  }

  /**
   * Get all chat rooms for a user
   *
   * Returns all 1-on-1 chat rooms where the user is a participant,
   * sorted by last message time.
   *
   * @param userId - The ID of the user (from query parameter)
   * @param page - Page number for pagination (default: 1)
   * @param limit - Number of items per page (default: 20, max: 100)
   * @returns List of chat rooms with pagination metadata
   *
   * @example
   * ```typescript
   * GET /chat/rooms?userId=user-id&page=1&limit=20
   * ```
   */
  @Get(CHAT_ROUTES.ROOMS)
  @ApiOperation({
    summary: 'Get user chat rooms',
    description:
      'Returns all chat rooms for a user with pagination. Rooms are sorted by last message time.',
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'The ID of the user',
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (default: 20, max: 100)',
    type: Number,
  })
  async getUserRooms(
    @Query('userId') userId: string,
    @Res() res: Response,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const response = await this.chatService.getUserRooms(
      userId,
      pageNum,
      limitNum,
    );
    return res.status(response.status).json(response);
  }

  /**
   * Get room details by ID
   *
   * Returns details of a specific chat room.
   *
   * @param roomId - The ID of the room
   * @param userId - The ID of the user (from query parameter)
   * @returns Room details
   *
   * @example
   * ```typescript
   * GET /chat/rooms/room-id?userId=user-id
   * ```
   */
  @Get(CHAT_ROUTES.ROOM_BY_ID)
  @ApiOperation({
    summary: 'Get room details',
    description: 'Returns details of a specific chat room',
  })
  @ApiParam({
    name: 'roomId',
    description: 'The ID of the chat room',
    type: String,
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'The ID of the user',
    type: String,
  })
  async getRoomById(
    @Param('roomId') roomId: string,
    @Query('userId') userId: string,
    @Res() res: Response,
  ) {
    const response = await this.chatService.getRoomById(roomId, userId);
    return res.status(response.status).json(response);
  }

  /**
   * Get or create a room with another user
   *
   * If a room already exists between the two users, returns that room.
   * Otherwise, creates a new room.
   *
   * @param otherUserId - The ID of the other user
   * @param userId - The ID of the current user (from query parameter)
   * @returns Room details
   *
   * @example
   * ```typescript
   * GET /chat/rooms/user/other-user-id?userId=current-user-id
   * ```
   */
  @Get(CHAT_ROUTES.ROOM_BY_USER)
  @ApiOperation({
    summary: 'Get or create room with user',
    description:
      'Gets an existing room or creates a new 1-on-1 room between two users',
  })
  @ApiParam({
    name: 'otherUserId',
    description: 'The ID of the other user',
    type: String,
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'The ID of the current user',
    type: String,
  })
  async getOrCreateRoom(
    @Param('otherUserId') otherUserId: string,
    @Query('userId') currentUserId: string,
    @Res() res: Response,
  ) {
    const response = await this.chatService.getOrCreateRoom(
      currentUserId,
      otherUserId,
    );
    return res.status(response.status).json(response);
  }

  /**
   * Get messages for a room
   *
   * Returns messages from a chat room with pagination.
   * Messages are sorted by creation time (oldest first for chat UI).
   *
   * @param roomId - The ID of the room
   * @param userId - The ID of the user (from query parameter)
   * @param getMessagesDto - Pagination parameters (page, limit)
   * @returns List of messages with pagination metadata
   *
   * @example
   * ```typescript
   * GET /chat/rooms/room-id/messages?userId=user-id&page=1&limit=20
   * ```
   */
  @Get(CHAT_ROUTES.MESSAGES)
  @ApiOperation({
    summary: 'Get room messages',
    description:
      'Returns messages from a chat room with pagination. Messages are sorted by creation time.',
  })
  @ApiParam({
    name: 'roomId',
    description: 'The ID of the chat room',
    type: String,
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'The ID of the user',
    type: String,
  })
  async getRoomMessages(
    @Param('roomId') roomId: string,
    @Query('userId') userId: string,
    @Query() getMessagesDto: GetMessagesDto,
    @Res() res: Response,
  ) {
    const { page = 1, limit = 20 } = getMessagesDto;
    const response = await this.chatService.getRoomMessages(
      roomId,
      userId,
      page,
      limit,
    );
    return res.status(response.status).json(response);
  }

  /**
   * Send a message to a room
   *
   * Creates a new message in the room and saves it to the database.
   * For real-time delivery, use Socket.IO instead.
   *
   * @param roomId - The ID of the room
   * @param userId - The ID of the sender (from query parameter)
   * @param sendMessageDto - Message content
   * @returns Created message
   *
   * @example
   * ```typescript
   * POST /chat/rooms/room-id/messages?userId=sender-id
   * Body: { content: "Hello, how are you?" }
   * ```
   */
  @Post(CHAT_ROUTES.MESSAGES)
  @ApiOperation({
    summary: 'Send a message',
    description:
      'Sends a message to a chat room. For real-time delivery, use Socket.IO instead.',
  })
  @ApiParam({
    name: 'roomId',
    description: 'The ID of the chat room',
    type: String,
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'The ID of the sender',
    type: String,
  })
  async sendMessage(
    @Param('roomId') roomId: string,
    @Query('userId') userId: string,
    @Body() sendMessageDto: SendMessageDto,
    @Res() res: Response,
  ) {
    const response = await this.chatService.sendMessage(
      roomId,
      userId,
      sendMessageDto.content,
    );
    return res.status(response.status).json(response);
  }

  /**
   * Mark messages as read
   *
   * Marks messages in a room as read by a user.
   * If messageIds are not provided, marks all unread messages in the room.
   *
   * @param roomId - The ID of the room
   * @param userId - The ID of the user (from query parameter)
   * @param messageIds - Optional array of message IDs to mark as read
   * @returns Number of messages marked as read
   *
   * @example
   * ```typescript
   * // Mark all unread messages as read
   * PATCH /chat/rooms/room-id/mark-read?userId=user-id
   *
   * // Mark specific messages as read
   * PATCH /chat/rooms/room-id/mark-read?userId=user-id
   * Body: { messageIds: ["msg1", "msg2"] }
   * ```
   */
  @Patch(CHAT_ROUTES.MARK_READ)
  @ApiOperation({
    summary: 'Mark messages as read',
    description:
      'Marks messages in a room as read. If messageIds are not provided, marks all unread messages.',
  })
  @ApiParam({
    name: 'roomId',
    description: 'The ID of the chat room',
    type: String,
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'The ID of the user',
    type: String,
  })
  async markAsRead(
    @Param('roomId') roomId: string,
    @Query('userId') userId: string,
    @Res() res: Response,
    @Body() body?: { messageIds?: string[] },
  ) {
    const response = await this.chatService.markAsRead(
      roomId,
      userId,
      body?.messageIds,
    );
    return res.status(response.status).json(response);
  }

  /**
   * Mark all messages as read if the last message is already read
   *
   * This endpoint is useful when a user opens a chat. If the last message
   * is already read by the user, it marks all previous unread messages as read.
   *
   * @param roomId - The ID of the room
   * @param userId - The ID of the user (from query parameter)
   * @returns Number of messages marked as read
   *
   * @example
   * ```typescript
   * PATCH /chat/rooms/room-id/mark-all-read-if-last-read?userId=user-id
   * ```
   */
  @Patch(CHAT_ROUTES.MARK_ALL_READ_IF_LAST_READ)
  @ApiOperation({
    summary: 'Mark all as read if last message is read',
    description:
      'If the last message in the room is already read by the user, marks all previous unread messages as read. Useful when opening a chat.',
  })
  @ApiParam({
    name: 'roomId',
    description: 'The ID of the chat room',
    type: String,
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'The ID of the user',
    type: String,
  })
  async markAllAsReadIfLastRead(
    @Param('roomId') roomId: string,
    @Query('userId') userId: string,
    @Res() res: Response,
  ) {
    const response = await this.chatService.markAllAsReadIfLastRead(
      roomId,
      userId,
    );
    return res.status(response.status).json(response);
  }

  /**
   * Get unread message count for a room
   *
   * Returns the count of unread messages for a user in a specific room.
   *
   * @param roomId - The ID of the room
   * @param userId - The ID of the user (from query parameter)
   * @returns Unread message count
   *
   * @example
   * ```typescript
   * GET /chat/rooms/room-id/unread-count?userId=user-id
   * ```
   */
  @Get(CHAT_ROUTES.UNREAD_COUNT)
  @ApiOperation({
    summary: 'Get unread message count',
    description:
      'Returns the count of unread messages for a user in a specific room',
  })
  @ApiParam({
    name: 'roomId',
    description: 'The ID of the chat room',
    type: String,
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'The ID of the user',
    type: String,
  })
  async getUnreadCount(
    @Param('roomId') roomId: string,
    @Query('userId') userId: string,
    @Res() res: Response,
  ) {
    const response = await this.chatService.getUnreadCount(roomId, userId);
    return res.status(response.status).json(response);
  }

  /**
   * Delete a room (soft delete)
   *
   * Marks a room as deleted but preserves the data.
   *
   * @param roomId - The ID of the room
   * @param userId - The ID of the user (from query parameter)
   * @returns Success response
   *
   * @example
   * ```typescript
   * DELETE /chat/rooms/room-id?userId=user-id
   * ```
   */
  @Delete(CHAT_ROUTES.ROOM_BY_ID)
  @ApiOperation({
    summary: 'Delete a room',
    description:
      'Soft deletes a chat room (marks as deleted but preserves data)',
  })
  @ApiParam({
    name: 'roomId',
    description: 'The ID of the chat room',
    type: String,
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'The ID of the user',
    type: String,
  })
  async deleteRoom(
    @Param('roomId') roomId: string,
    @Query('userId') userId: string,
    @Res() res: Response,
  ) {
    const response = await this.chatService.deleteRoom(roomId, userId);
    return res.status(response.status).json(response);
  }
}
