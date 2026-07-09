import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatRoom, ChatRoomSchema } from './schemas/chat-room.schema';
import { ChatMessage, ChatMessageSchema } from './schemas/chat-message.schema';
import {
  ChatUnreadCount,
  ChatUnreadCountSchema,
} from './schemas/chat-unread-count.schema';

import { User, UserSchema } from 'src/modules/user/user.schema';

/**
 * Chat Module
 *
 * This module provides real-time chat functionality using Socket.IO and MongoDB.
 *
 * Features:
 * - 1-on-1 chat rooms
 * - Real-time messaging via Socket.IO
 * - Message persistence in MongoDB
 * - Read receipts
 * - REST API endpoints for chat management
 *
 * Module Structure:
 * - ChatService: Business logic for chat operations
 * - ChatGateway: Socket.IO real-time communication
 * - ChatController: REST API endpoints
 * - ChatRoom Schema: MongoDB schema for chat rooms
 * - ChatMessage Schema: MongoDB schema for messages
 *
 * Usage:
 * Import this module in your AppModule to enable chat functionality.
 *
 * @example
 * ```typescript
 * // app.module.ts
 * import { ChatModule } from './modules/chat/chat.module';
 *
 * @Module({
 *   imports: [
 *     // ... other modules
 *     ChatModule,
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [
    // Register MongoDB schemas
    MongooseModule.forFeature([
      { name: ChatRoom.name, schema: ChatRoomSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: ChatUnreadCount.name, schema: ChatUnreadCountSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService], // Export service for use in other modules if needed
})
export class ChatModule {}
