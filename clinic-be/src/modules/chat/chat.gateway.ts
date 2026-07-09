import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  HttpStatus,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CHAT_EVENTS } from './constants/events';
import {
  JoinRoomPayload,
  SendMessagePayload,
  MarkAsReadPayload,
  MessageReceivedEvent,
  MessagesReadEvent,
  ErrorEvent,
} from './types/chat.types';
import { Types } from 'mongoose';

/**
 * Chat Gateway
 *
 * This gateway handles all Socket.IO real-time communication for the chat module.
 *
 * Key Features:
 * - Manages socket connections and disconnections
 * - Handles room joining/leaving
 * - Processes message sending
 * - Handles read receipt updates
 * - Emits real-time events to connected clients
 *
 * Connection Setup:
 * Clients should connect with userId in query parameter:
 * ```typescript
 * const socket = io('http://localhost:8080', {
 *   query: { userId: 'user-id-here' }
 * });
 * ```
 *
 * Usage Example:
 * ```typescript
 * // Client joins a room
 * socket.emit('join-room', { roomId: 'room-id' });
 *
 * // Client sends a message
 * socket.emit('send-message', { roomId: 'room-id', content: 'Hello!' });
 *
 * // Client marks messages as read
 * socket.emit('mark-as-read', { roomId: 'room-id' });
 * ```
 */
@WebSocketGateway({
  cors: {
    origin: '*', // Configure CORS as needed for your frontend
    credentials: true,
  },
  namespace: '/chat', // Optional: namespace for chat-specific connections
})
@Injectable()
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  /**
   * Map to store active socket connections
   * Key: userId (string)
   * Value: Set of socket IDs for that user (allows multiple connections per user)
   */
  private readonly userSockets = new Map<string, Set<string>>();

  /**
   * Map to store socket to user mapping
   * Key: socketId (string)
   * Value: userId (string)
   */
  private readonly socketToUser = new Map<string, string>();

  constructor(private readonly chatService: ChatService) {}

  /**
   * Handle client connection
   *
   * This method is called when a client connects to the Socket.IO server.
   * It extracts the userId from the query parameters and stores the connection.
   *
   * Connection Requirements:
   * - Client must provide userId in query parameter: ?userId=user-id-here
   * - userId must be a valid MongoDB ObjectId
   *
   * @param client - The Socket.IO client instance
   *
   * @example
   * ```typescript
   * // Client connection
   * const socket = io('http://localhost:8080/chat', {
   *   query: { userId: '507f1f77bcf86cd799439011' }
   * });
   * ```
   */
  handleConnection(client: Socket) {
    try {
      // Extract userId from query parameters
      const userId = (client.handshake.query.userId as string) || '';

      // Validate userId
      if (!userId || !Types.ObjectId.isValid(userId)) {
        this.logger.warn(
          `Invalid userId provided: ${userId} for socket ${client.id}`,
        );
        client.emit(CHAT_EVENTS.ERROR, {
          message:
            'Invalid user ID. Please provide a valid userId in query parameters.',
          code: 'INVALID_USER_ID',
        } as ErrorEvent);
        client.disconnect();
        return;
      }

      // Store socket connection
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      this.socketToUser.set(client.id, userId);

      // Store userId in socket data for later use
      client.data.userId = userId;

      this.logger.log(`User ${userId} connected with socket ${client.id}`);

      // Emit connection confirmation
      client.emit(CHAT_EVENTS.CONNECTED, {
        userId,
        socketId: client.id,
      });
    } catch (error) {
      this.logger.error(`Error handling connection: ${error}`);
      client.emit(CHAT_EVENTS.ERROR, {
        message: 'Connection error occurred',
        code: 'CONNECTION_ERROR',
      } as ErrorEvent);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   *
   * This method is called when a client disconnects from the Socket.IO server.
   * It cleans up the connection mappings.
   *
   * @param client - The Socket.IO client instance
   */
  handleDisconnect(client: Socket) {
    try {
      const userId = client.data.userId || this.socketToUser.get(client.id);

      if (userId) {
        // Remove socket from user's socket set
        const userSockets = this.userSockets.get(userId);
        if (userSockets) {
          userSockets.delete(client.id);
          if (userSockets.size === 0) {
            this.userSockets.delete(userId);
          }
        }
      }

      // Remove socket to user mapping
      this.socketToUser.delete(client.id);

      this.logger.log(
        `User ${userId || 'unknown'} disconnected (socket ${client.id})`,
      );
    } catch (error) {
      this.logger.error(`Error handling disconnection: ${error}`);
    }
  }

  /**
   * Handle join-room event
   *
   * Allows a client to join a specific chat room.
   * The client will receive messages from this room.
   *
   * Event: 'join-room'
   * Payload: { roomId: string }
   *
   * @param client - The Socket.IO client instance
   * @param payload - Join room payload containing roomId
   *
   * @example
   * ```typescript
   * // Client side
   * socket.emit('join-room', { roomId: 'room-id-here' });
   * ```
   */
  @SubscribeMessage(CHAT_EVENTS.JOIN_ROOM)
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    try {
      const userId = client.data.userId;

      if (!userId) {
        client.emit(CHAT_EVENTS.ERROR, {
          message: 'User not authenticated',
          code: 'UNAUTHORIZED',
        } as ErrorEvent);
        return;
      }

      // Validate roomId
      if (!payload.roomId || !Types.ObjectId.isValid(payload.roomId)) {
        client.emit(CHAT_EVENTS.ERROR, {
          message: 'Invalid room ID',
          code: 'INVALID_ROOM_ID',
        } as ErrorEvent);
        return;
      }

      // Verify user is a participant in the room
      const roomResult = await this.chatService.getRoomById(
        payload.roomId,
        userId,
      );

      if (roomResult.status !== HttpStatus.OK) {
        client.emit(CHAT_EVENTS.ERROR, {
          message: roomResult.message,
          code: 'ROOM_NOT_FOUND',
        } as ErrorEvent);
        return;
      }

      // Join the socket room (Socket.IO room, not chat room)
      // This allows us to emit messages to all clients in this room
      const socketRoom = `room:${payload.roomId}`;
      await client.join(socketRoom);

      this.logger.log(
        `User ${userId} joined room ${payload.roomId} (socket ${client.id})`,
      );

      // Emit confirmation (optional)
      client.emit('room-joined', {
        roomId: payload.roomId,
      });
    } catch (error) {
      this.logger.error(`Error in handleJoinRoom: ${error}`);
      client.emit(CHAT_EVENTS.ERROR, {
        message: 'Failed to join room',
        code: 'JOIN_ROOM_ERROR',
      } as ErrorEvent);
    }
  }

  /**
   * Handle send-message event
   *
   * Processes a message sent by a client and broadcasts it to all participants in the room.
   *
   * Event: 'send-message'
   * Payload: { roomId: string, content: string }
   *
   * Emits: 'message-received' to all clients in the room
   *
   * @param client - The Socket.IO client instance
   * @param payload - Send message payload containing roomId and content
   *
   * @example
   * ```typescript
   * // Client side
   * socket.emit('send-message', {
   *   roomId: 'room-id-here',
   *   content: 'Hello, how are you?'
   * });
   *
   * // Listen for message received
   * socket.on('message-received', (data) => {
   *   console.log('New message:', data.message);
   * });
   * ```
   */
  @SubscribeMessage(CHAT_EVENTS.SEND_MESSAGE)
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    try {
      const userId = client.data.userId;

      if (!userId) {
        client.emit(CHAT_EVENTS.ERROR, {
          message: 'User not authenticated',
          code: 'UNAUTHORIZED',
        } as ErrorEvent);
        return;
      }

      // Validate payload
      if (!payload.roomId || !payload.content) {
        client.emit(CHAT_EVENTS.ERROR, {
          message: 'Room ID and content are required',
          code: 'INVALID_PAYLOAD',
        } as ErrorEvent);
        return;
      }

      // Validate roomId
      if (!Types.ObjectId.isValid(payload.roomId)) {
        client.emit(CHAT_EVENTS.ERROR, {
          message: 'Invalid room ID',
          code: 'INVALID_ROOM_ID',
        } as ErrorEvent);
        return;
      }

      // Validate content length
      if (payload.content.trim().length === 0) {
        client.emit(CHAT_EVENTS.ERROR, {
          message: 'Message content cannot be empty',
          code: 'INVALID_CONTENT',
        } as ErrorEvent);
        return;
      }

      if (payload.content.length > 5000) {
        client.emit(CHAT_EVENTS.ERROR, {
          message: 'Message content must not exceed 5000 characters',
          code: 'CONTENT_TOO_LONG',
        } as ErrorEvent);
        return;
      }

      // Send message via service (saves to database)
      const result = await this.chatService.sendMessage(
        payload.roomId,
        userId,
        payload.content,
      );

      if (result.status !== HttpStatus.CREATED) {
        client.emit(CHAT_EVENTS.ERROR, {
          message: result.message,
          code: 'MESSAGE_SEND_FAILED',
        } as ErrorEvent);
        return;
      }

      // Prepare message event data
      // Type assertion needed because SerializeHttpResponse returns unknown type for data
      const messageData = result.data as any;
      const messageEvent: MessageReceivedEvent = {
        message: {
          _id: messageData._id.toString(),
          roomId: messageData.roomId.toString(),
          senderId: messageData.senderId.toString(),
          content: messageData.content,
          messageType: messageData.messageType,
          readBy: (messageData.readBy || []).map((id: Types.ObjectId) =>
            id.toString(),
          ),
          createdAt: messageData.createdAt,
          updatedAt: messageData.updatedAt,
        },
      };

      // Emit message to all clients in the room (including sender)
      const socketRoom = `room:${payload.roomId}`;
      this.server
        .to(socketRoom)
        .emit(CHAT_EVENTS.MESSAGE_RECEIVED, messageEvent);

      this.logger.log(
        `Message sent by user ${userId} in room ${payload.roomId}`,
      );
    } catch (error) {
      this.logger.error(`Error in handleSendMessage: ${error}`);
      client.emit(CHAT_EVENTS.ERROR, {
        message: 'Failed to send message',
        code: 'SEND_MESSAGE_ERROR',
      } as ErrorEvent);
    }
  }

  /**
   * Handle mark-as-read event
   *
   * Marks messages as read by a user and notifies other participants.
   *
   * Event: 'mark-as-read'
   * Payload: { roomId: string, messageIds?: string[] }
   *
   * Emits: 'messages-read' to all clients in the room
   *
   * @param client - The Socket.IO client instance
   * @param payload - Mark as read payload containing roomId and optional messageIds
   *
   * @example
   * ```typescript
   * // Client side - Mark all unread messages as read
   * socket.emit('mark-as-read', { roomId: 'room-id-here' });
   *
   * // Client side - Mark specific messages as read
   * socket.emit('mark-as-read', {
   *   roomId: 'room-id-here',
   *   messageIds: ['msg1', 'msg2']
   * });
   *
   * // Listen for messages read event
   * socket.on('messages-read', (data) => {
   *   console.log('Messages marked as read:', data.messageIds);
   * });
   * ```
   */
  @SubscribeMessage(CHAT_EVENTS.MARK_AS_READ)
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MarkAsReadPayload,
  ) {
    try {
      const userId = client.data.userId;

      if (!userId) {
        client.emit(CHAT_EVENTS.ERROR, {
          message: 'User not authenticated',
          code: 'UNAUTHORIZED',
        } as ErrorEvent);
        return;
      }

      // Validate payload
      if (!payload.roomId) {
        client.emit(CHAT_EVENTS.ERROR, {
          message: 'Room ID is required',
          code: 'INVALID_PAYLOAD',
        } as ErrorEvent);
        return;
      }

      // Validate roomId
      if (!Types.ObjectId.isValid(payload.roomId)) {
        client.emit(CHAT_EVENTS.ERROR, {
          message: 'Invalid room ID',
          code: 'INVALID_ROOM_ID',
        } as ErrorEvent);
        return;
      }

      // Mark messages as read via service
      const result = await this.chatService.markAsRead(
        payload.roomId,
        userId,
        payload.messageIds,
      );

      if (result.status !== HttpStatus.OK) {
        client.emit(CHAT_EVENTS.ERROR, {
          message: result.message,
          code: 'MARK_READ_FAILED',
        } as ErrorEvent);
        return;
      }

      // Prepare messages read event data
      // Type assertion needed because SerializeHttpResponse returns unknown type for data
      const markReadData = result.data as {
        modifiedCount: number;
        messageIds?: string[];
      };
      const messagesReadEvent: MessagesReadEvent = {
        roomId: payload.roomId,
        messageIds: markReadData.messageIds || [], // If no specific messageIds, empty array (all messages marked)
        readBy: userId,
      };

      // Emit to all clients in the room
      const socketRoom = `room:${payload.roomId}`;
      this.server
        .to(socketRoom)
        .emit(CHAT_EVENTS.MESSAGES_READ, messagesReadEvent);

      this.logger.log(
        `Messages marked as read by user ${userId} in room ${payload.roomId}`,
      );
    } catch (error) {
      this.logger.error(`Error in handleMarkAsRead: ${error}`);
      client.emit(CHAT_EVENTS.ERROR, {
        message: 'Failed to mark messages as read',
        code: 'MARK_READ_ERROR',
      } as ErrorEvent);
    }
  }

  /**
   * Get all socket IDs for a user
   *
   * Helper method to get all active socket connections for a specific user.
   * Useful for sending messages to a specific user across all their connections.
   *
   * @param userId - The user ID
   * @returns Array of socket IDs for the user
   */
  getUserSockets(userId: string): string[] {
    const sockets = this.userSockets.get(userId);
    return sockets ? Array.from(sockets) : [];
  }

  /**
   * Check if a user is online
   *
   * Helper method to check if a user has any active socket connections.
   *
   * @param userId - The user ID
   * @returns True if user has active connections, false otherwise
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets ? sockets.size > 0 : false;
  }

  /**
   * Cleanup on module destroy
   * Called when the module is being destroyed
   */
  onModuleDestroy() {
    this.userSockets.clear();
    this.socketToUser.clear();
    this.logger.log('Chat gateway cleaned up');
  }
}
