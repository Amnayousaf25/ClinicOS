import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, HttpStatus, OnModuleDestroy } from '@nestjs/common';
import { SerializeHttpResponse } from 'src/utils/serializer';

import { ChatRoom, ChatRoomDocument } from './schemas/chat-room.schema';
import {
  ChatMessage,
  ChatMessageDocument,
} from './schemas/chat-message.schema';
import {
  ChatUnreadCount,
  ChatUnreadCountDocument,
} from './schemas/chat-unread-count.schema';
import { CHAT_SUCCESS } from './constants/success';
import { CHAT_ERRORS } from './constants/errors';
import { MESSAGE_TYPE } from './types/chat.types';
import { PaginationMeta } from './types/chat.types';

/**
 * Chat Service
 *
 * This service handles all business logic for the chat module.
 * It manages chat rooms, messages, and read receipts.
 *
 * Key Features:
 * - Create/get 1-on-1 chat rooms
 * - Send and retrieve messages
 * - Mark messages as read
 * - Get unread message counts
 * - Manage room lifecycle
 *
 * Usage Example:
 * ```typescript
 * // Get or create a room between two users
 * const room = await chatService.getOrCreateRoom(userId1, userId2);
 *
 * // Send a message
 * const message = await chatService.sendMessage(roomId, senderId, 'Hello!');
 *
 * // Get messages with pagination
 * const result = await chatService.getRoomMessages(roomId, 1, 20);
 * ```
 */
@Injectable()
export class ChatService implements OnModuleDestroy {
  constructor(
    @InjectModel(ChatRoom.name)
    private readonly chatRoomModel: Model<ChatRoomDocument>,
    @InjectModel(ChatMessage.name)
    private readonly chatMessageModel: Model<ChatMessageDocument>,
    @InjectModel(ChatUnreadCount.name)
    private readonly chatUnreadCountModel: Model<ChatUnreadCountDocument>,
  ) {}

  /**
   * Get or create a 1-on-1 chat room between two users
   *
   * This method ensures that only one room exists between any two users.
   * If a room already exists, it returns that room. Otherwise, it creates a new one.
   *
   * @param userId1 - The ID of the first user
   * @param userId2 - The ID of the second user
   * @returns Serialized response with the chat room
   *
   * @example
   * ```typescript
   * const result = await chatService.getOrCreateRoom('user1', 'user2');
   * ```
   */
  async getOrCreateRoom(userId1: string, userId2: string) {
    try {
      // Validate user IDs
      if (
        !Types.ObjectId.isValid(userId1) ||
        !Types.ObjectId.isValid(userId2)
      ) {
        return SerializeHttpResponse(
          null,
          HttpStatus.BAD_REQUEST,
          CHAT_ERRORS.INVALID_USER_ID,
        );
      }

      // Prevent user from creating room with themselves
      if (userId1 === userId2) {
        return SerializeHttpResponse(
          null,
          HttpStatus.BAD_REQUEST,
          CHAT_ERRORS.INVALID_USER_ID,
        );
      }

      // Create sorted array of participants for consistent lookup
      const participants = [
        new Types.ObjectId(userId1),
        new Types.ObjectId(userId2),
      ].sort((a, b) => a.toString().localeCompare(b.toString()));

      // Try to find existing room
      let room = await this.chatRoomModel.findOne({
        participants: { $all: participants },
        isDeleted: false,
      });

      // If room doesn't exist, create a new one
      if (!room) {
        room = await this.chatRoomModel.create({
          participants,
        });

        // Initialize unread counts for both participants (count: 0)
        await this.initializeUnreadCounts(room._id.toString(), participants);
      }

      return SerializeHttpResponse(
        room,
        HttpStatus.OK,
        CHAT_SUCCESS.ROOM_RETRIEVED,
      );
    } catch (error) {
      console.error('Error in getOrCreateRoom:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        CHAT_ERRORS.ROOM_CREATION_FAILED,
      );
    }
  }

  /**
   * Initiate a chat between two users
   *
   * Creates or gets a chat room between sender and receiver, and optionally sends an initial message.
   * This is a convenience method that combines room creation and message sending.
   *
   * @param senderId - The ID of the user initiating the chat
   * @param receiverId - The ID of the user to start a chat with
   * @param content - Optional initial message content
   * @returns Serialized response with the room and optionally the created message
   *
   * @example
   * ```typescript
   * // Initiate chat without initial message
   * const result = await chatService.initiateChat('senderId', 'receiverId');
   *
   * // Initiate chat with initial message
   * const result = await chatService.initiateChat('senderId', 'receiverId', 'Hello!');
   * ```
   */
  async initiateChat(senderId: string, receiverId: string, content?: string) {
    try {
      // Get or create the room
      const roomResponse = await this.getOrCreateRoom(senderId, receiverId);

      // If room creation failed, return the error
      if (roomResponse.status !== HttpStatus.OK) {
        return roomResponse;
      }

      const room = roomResponse.data;

      // If content is provided, send the initial message
      if (content && content.trim()) {
        const messageResponse = await this.sendMessage(
          room._id.toString(),
          senderId,
          content.trim(),
        );

        // If message sending failed, still return the room but with a warning
        if (messageResponse.status !== HttpStatus.CREATED) {
          return SerializeHttpResponse(
            {
              room,
              message: null,
              messageError: messageResponse.message,
            },
            HttpStatus.OK,
            CHAT_SUCCESS.ROOM_RETRIEVED,
          );
        }

        return SerializeHttpResponse(
          {
            room,
            message: messageResponse.data,
          },
          HttpStatus.CREATED,
          CHAT_SUCCESS.ROOM_RETRIEVED,
        );
      }

      // Return just the room if no content provided
      return SerializeHttpResponse(
        {
          room,
          message: null,
        },
        HttpStatus.CREATED,
        CHAT_SUCCESS.ROOM_RETRIEVED,
      );
    } catch (error) {
      console.error('Error in initiateChat:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        CHAT_ERRORS.ROOM_CREATION_FAILED,
      );
    }
  }

  /**
   * Get all chat rooms for a user with pagination
   *
   * Returns all rooms where the user is a participant, sorted by last message time.
   *
   * @param userId - The ID of the user
   * @param page - Page number (default: 1)
   * @param limit - Number of items per page (default: 20, max: 100)
   * @returns Serialized response with rooms and pagination metadata
   *
   * @example
   * ```typescript
   * const result = await chatService.getUserRooms('userId', 1, 20);
   * ```
   */
  async getUserRooms(userId: string, page: number = 1, limit: number = 20) {
    try {
      // Validate user ID
      if (!Types.ObjectId.isValid(userId)) {
        return SerializeHttpResponse(
          null,
          HttpStatus.BAD_REQUEST,
          CHAT_ERRORS.INVALID_USER_ID,
        );
      }

      // Validate pagination parameters
      const skip = (page - 1) * limit;
      const validLimit = Math.min(limit, 100); // Max 100 items per page

      // Find all rooms where user is a participant
      const rooms = await this.chatRoomModel
        .find({
          participants: new Types.ObjectId(userId),
          isDeleted: false,
        })
        .sort({ lastMessageAt: -1, updatedAt: -1 }) // Sort by last message time
        .skip(skip)
        .limit(validLimit)
        .populate('participants', 'name email avatar')
        .populate('lastMessage')
        .lean();

      // Get total count for pagination
      const totalCount = await this.chatRoomModel.countDocuments({
        participants: new Types.ObjectId(userId),
        isDeleted: false,
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / validLimit);
      const pagination: PaginationMeta = {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: validLimit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };

      return SerializeHttpResponse(
        {
          rooms,
          pagination,
        },
        HttpStatus.OK,
        CHAT_SUCCESS.ROOMS_RETRIEVED,
      );
    } catch (error) {
      console.error('Error in getUserRooms:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        CHAT_ERRORS.ROOMS_RETRIEVE_FAILED,
      );
    }
  }

  /**
   * Get room details by ID
   *
   * @param roomId - The ID of the room
   * @param userId - The ID of the user requesting (for validation)
   * @returns Serialized response with room details
   *
   * @example
   * ```typescript
   * const result = await chatService.getRoomById('roomId', 'userId');
   * ```
   */
  async getRoomById(roomId: string, userId: string) {
    try {
      // Validate room ID
      if (!Types.ObjectId.isValid(roomId)) {
        return SerializeHttpResponse(
          null,
          HttpStatus.BAD_REQUEST,
          CHAT_ERRORS.INVALID_ROOM_ID,
        );
      }

      // Find room and verify user is a participant
      const room = await this.chatRoomModel
        .findOne({
          _id: new Types.ObjectId(roomId),
          participants: new Types.ObjectId(userId),
          isDeleted: false,
        })
        .populate('participants', 'name email avatar')
        .populate('lastMessage')
        .lean();

      if (!room) {
        return SerializeHttpResponse(
          null,
          HttpStatus.NOT_FOUND,
          CHAT_ERRORS.ROOM_NOT_FOUND,
        );
      }

      return SerializeHttpResponse(
        room,
        HttpStatus.OK,
        CHAT_SUCCESS.ROOM_RETRIEVED,
      );
    } catch (error) {
      console.error('Error in getRoomById:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        CHAT_ERRORS.ROOMS_RETRIEVE_FAILED,
      );
    }
  }

  /**
   * Get messages for a room with pagination
   *
   * Returns messages sorted by creation time (newest first).
   *
   * @param roomId - The ID of the room
   * @param userId - The ID of the user requesting (for validation)
   * @param page - Page number (default: 1)
   * @param limit - Number of items per page (default: 20, max: 100)
   * @returns Serialized response with messages and pagination metadata
   *
   * @example
   * ```typescript
   * const result = await chatService.getRoomMessages('roomId', 'userId', 1, 20);
   * ```
   */
  async getRoomMessages(
    roomId: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    try {
      // Validate room ID
      if (!Types.ObjectId.isValid(roomId)) {
        return SerializeHttpResponse(
          null,
          HttpStatus.BAD_REQUEST,
          CHAT_ERRORS.INVALID_ROOM_ID,
        );
      }

      // Verify user is a participant
      const room = await this.chatRoomModel.findOne({
        _id: new Types.ObjectId(roomId),
        participants: new Types.ObjectId(userId),
        isDeleted: false,
      });

      if (!room) {
        return SerializeHttpResponse(
          null,
          HttpStatus.NOT_FOUND,
          CHAT_ERRORS.ROOM_NOT_FOUND,
        );
      }

      // Validate pagination parameters
      const skip = (page - 1) * limit;
      const validLimit = Math.min(limit, 100); // Max 100 items per page

      // Get messages
      const messages = await this.chatMessageModel
        .find({
          roomId: new Types.ObjectId(roomId),
          isDeleted: false,
        })
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(validLimit)
        .populate('senderId', 'name email avatar')
        .lean();

      // Reverse to show oldest first (for chat UI)
      messages.reverse();

      // Get total count for pagination
      const totalCount = await this.chatMessageModel.countDocuments({
        roomId: new Types.ObjectId(roomId),
        isDeleted: false,
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / validLimit);
      const pagination: PaginationMeta = {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: validLimit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };

      return SerializeHttpResponse(
        {
          messages,
          pagination,
        },
        HttpStatus.OK,
        CHAT_SUCCESS.MESSAGES_RETRIEVED,
      );
    } catch (error) {
      console.error('Error in getRoomMessages:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        CHAT_ERRORS.MESSAGES_RETRIEVE_FAILED,
      );
    }
  }

  /**
   * Send a message to a room
   *
   * Creates a new message and updates the room's lastMessage reference.
   *
   * @param roomId - The ID of the room
   * @param senderId - The ID of the user sending the message
   * @param content - The message content
   * @returns Serialized response with the created message
   *
   * @example
   * ```typescript
   * const result = await chatService.sendMessage('roomId', 'senderId', 'Hello!');
   * ```
   */
  async sendMessage(roomId: string, senderId: string, content: string) {
    try {
      // Validate room ID
      if (!Types.ObjectId.isValid(roomId)) {
        return SerializeHttpResponse(
          null,
          HttpStatus.BAD_REQUEST,
          CHAT_ERRORS.INVALID_ROOM_ID,
        );
      }

      // Verify user is a participant
      const room = await this.chatRoomModel.findOne({
        _id: new Types.ObjectId(roomId),
        participants: new Types.ObjectId(senderId),
        isDeleted: false,
      });

      if (!room) {
        return SerializeHttpResponse(
          null,
          HttpStatus.NOT_FOUND,
          CHAT_ERRORS.ROOM_NOT_FOUND,
        );
      }

      // Create message
      const message = await this.chatMessageModel.create({
        roomId: new Types.ObjectId(roomId),
        senderId: new Types.ObjectId(senderId),
        content: content.trim(),
        messageType: MESSAGE_TYPE.TEXT,
        readBy: [], // Initially unread by all except sender
      });

      // Update room's last message reference
      await this.chatRoomModel.findByIdAndUpdate(roomId, {
        lastMessage: message._id,
        lastMessageAt: new Date(),
      });

      // Get the other participant (not the sender)
      const otherParticipant = room.participants.find(
        (participantId) => participantId.toString() !== senderId,
      );

      // Increment unread count for the other participant
      if (otherParticipant) {
        await this.incrementUnreadCount(roomId, otherParticipant.toString(), 1);
      }

      // Populate sender information
      await message.populate('senderId', 'name email avatar');

      return SerializeHttpResponse(
        message,
        HttpStatus.CREATED,
        CHAT_SUCCESS.MESSAGE_SENT,
      );
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        CHAT_ERRORS.MESSAGE_SEND_FAILED,
      );
    }
  }

  /**
   * Mark messages as read by a user
   *
   * Marks specific messages or all unread messages in a room as read.
   *
   * @param roomId - The ID of the room
   * @param userId - The ID of the user marking messages as read
   * @param messageIds - Optional array of specific message IDs to mark as read. If not provided, marks all unread messages in the room.
   * @returns Serialized response with the number of messages marked as read
   *
   * @example
   * ```typescript
   * // Mark all unread messages as read
   * const result = await chatService.markAsRead('roomId', 'userId');
   *
   * // Mark specific messages as read
   * const result = await chatService.markAsRead('roomId', 'userId', ['msg1', 'msg2']);
   * ```
   */
  async markAsRead(roomId: string, userId: string, messageIds?: string[]) {
    try {
      // Validate room ID
      if (!Types.ObjectId.isValid(roomId)) {
        return SerializeHttpResponse(
          null,
          HttpStatus.BAD_REQUEST,
          CHAT_ERRORS.INVALID_ROOM_ID,
        );
      }

      // Verify user is a participant
      const room = await this.chatRoomModel.findOne({
        _id: new Types.ObjectId(roomId),
        participants: new Types.ObjectId(userId),
        isDeleted: false,
      });

      if (!room) {
        return SerializeHttpResponse(
          null,
          HttpStatus.NOT_FOUND,
          CHAT_ERRORS.ROOM_NOT_FOUND,
        );
      }

      const userIdObjectId = new Types.ObjectId(userId);

      // If specific message IDs provided, mark only those
      if (messageIds && messageIds.length > 0) {
        const validMessageIds = messageIds
          .filter((id) => Types.ObjectId.isValid(id))
          .map((id) => new Types.ObjectId(id));

        // Ensure sender cannot mark their own messages as read
        // Filter out messages where senderId matches userId
        const messagesToMark = await this.chatMessageModel.find({
          _id: { $in: validMessageIds },
          roomId: new Types.ObjectId(roomId),
          senderId: { $ne: userIdObjectId }, // Exclude sender's own messages
        });

        const filteredMessageIds = messagesToMark.map((msg) => msg._id);

        if (filteredMessageIds.length === 0) {
          return SerializeHttpResponse(
            {
              modifiedCount: 0,
              messageIds: [],
            },
            HttpStatus.OK,
            CHAT_SUCCESS.MESSAGES_MARKED_AS_READ,
          );
        }

        const result = await this.chatMessageModel.updateMany(
          {
            _id: { $in: filteredMessageIds },
            readBy: { $ne: userIdObjectId }, // Only update if not already read
          },
          {
            $addToSet: { readBy: userIdObjectId }, // Add user to readBy array
          },
        );

        // Decrement unread count by the number of messages marked as read
        if (result.modifiedCount > 0) {
          await this.decrementUnreadCount(roomId, userId, result.modifiedCount);
        }

        return SerializeHttpResponse(
          {
            modifiedCount: result.modifiedCount,
            messageIds: filteredMessageIds.map((id) => id.toString()),
          },
          HttpStatus.OK,
          CHAT_SUCCESS.MESSAGES_MARKED_AS_READ,
        );
      } else {
        // Mark all unread messages in the room as read
        // Exclude sender's own messages (sender cannot mark their own messages as read)
        const result = await this.chatMessageModel.updateMany(
          {
            roomId: new Types.ObjectId(roomId),
            senderId: { $ne: userIdObjectId }, // Don't mark sender's own messages
            readBy: { $ne: userIdObjectId }, // Only update if not already read
          },
          {
            $addToSet: { readBy: userIdObjectId }, // Add user to readBy array
          },
        );

        // Decrement unread count by the number of messages marked as read
        // If all messages are read, reset count to 0
        if (result.modifiedCount > 0) {
          await this.decrementUnreadCount(roomId, userId, result.modifiedCount);
        }

        return SerializeHttpResponse(
          {
            modifiedCount: result.modifiedCount,
          },
          HttpStatus.OK,
          CHAT_SUCCESS.MESSAGES_MARKED_AS_READ,
        );
      }
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        CHAT_ERRORS.MARK_READ_FAILED,
      );
    }
  }

  /**
   * Mark all unread messages as read in a room
   *
   * This method marks all unread messages in the room as read by the user.
   * Useful when a user opens a chat and wants to mark all messages as read.
   *
   * Note: Sender cannot mark their own messages as read (only receiver can).
   *
   * @param roomId - The ID of the room
   * @param userId - The ID of the user
   * @returns Serialized response with the number of messages marked as read
   *
   * @example
   * ```typescript
   * const result = await chatService.markAllAsReadIfLastRead('roomId', 'userId');
   * ```
   */
  async markAllAsReadIfLastRead(roomId: string, userId: string) {
    try {
      // Validate room ID
      if (!Types.ObjectId.isValid(roomId)) {
        return SerializeHttpResponse(
          null,
          HttpStatus.BAD_REQUEST,
          CHAT_ERRORS.INVALID_ROOM_ID,
        );
      }

      // Verify user is a participant
      const room = await this.chatRoomModel.findOne({
        _id: new Types.ObjectId(roomId),
        participants: new Types.ObjectId(userId),
        isDeleted: false,
      });

      if (!room) {
        return SerializeHttpResponse(
          null,
          HttpStatus.NOT_FOUND,
          CHAT_ERRORS.ROOM_NOT_FOUND,
        );
      }

      const userIdObjectId = new Types.ObjectId(userId);

      // Mark all unread messages in the room as read
      // Exclude sender's own messages (sender cannot mark their own messages as read)
      const result = await this.chatMessageModel.updateMany(
        {
          roomId: new Types.ObjectId(roomId),
          senderId: { $ne: userIdObjectId }, // Don't mark sender's own messages
          readBy: { $ne: userIdObjectId }, // Only update if not already read
        },
        {
          $addToSet: { readBy: userIdObjectId }, // Add user to readBy array
        },
      );

      // Decrement unread count by the number of messages marked as read
      // This ensures accurate count management
      if (result.modifiedCount > 0) {
        await this.decrementUnreadCount(roomId, userId, result.modifiedCount);
      }

      return SerializeHttpResponse(
        {
          modifiedCount: result.modifiedCount,
          allMarkedAsRead: true,
        },
        HttpStatus.OK,
        CHAT_SUCCESS.MESSAGES_MARKED_AS_READ,
      );
    } catch (error) {
      console.error('Error in markAllAsReadIfLastRead:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        CHAT_ERRORS.MARK_READ_FAILED,
      );
    }
  }

  /**
   * Get unread message count for a room
   *
   * @param roomId - The ID of the room
   * @param userId - The ID of the user
   * @returns Serialized response with unread count
   *
   * @example
   * ```typescript
   * const result = await chatService.getUnreadCount('roomId', 'userId');
   * ```
   */
  async getUnreadCount(roomId: string, userId: string) {
    try {
      // Validate room ID
      if (!Types.ObjectId.isValid(roomId)) {
        return SerializeHttpResponse(
          null,
          HttpStatus.BAD_REQUEST,
          CHAT_ERRORS.INVALID_ROOM_ID,
        );
      }

      // Verify user is a participant
      const room = await this.chatRoomModel.findOne({
        _id: new Types.ObjectId(roomId),
        participants: new Types.ObjectId(userId),
        isDeleted: false,
      });

      if (!room) {
        return SerializeHttpResponse(
          null,
          HttpStatus.NOT_FOUND,
          CHAT_ERRORS.ROOM_NOT_FOUND,
        );
      }

      // Get unread count from dedicated schema (much faster than counting messages)
      const unreadCount = await this.chatUnreadCountModel.findOne({
        roomId: new Types.ObjectId(roomId),
        userId: new Types.ObjectId(userId),
      });

      // Return count from schema, default to 0 if record doesn't exist
      const count = unreadCount?.count || 0;

      return SerializeHttpResponse(
        {
          roomId,
          userId,
          unreadCount: count,
        },
        HttpStatus.OK,
        CHAT_SUCCESS.UNREAD_COUNT_RETRIEVED,
      );
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        CHAT_ERRORS.UNREAD_COUNT_FAILED,
      );
    }
  }

  /**
   * Delete a room (soft delete)
   *
   * Marks the room as deleted but preserves the data.
   *
   * @param roomId - The ID of the room
   * @param userId - The ID of the user requesting deletion
   * @returns Serialized response
   *
   * @example
   * ```typescript
   * const result = await chatService.deleteRoom('roomId', 'userId');
   * ```
   */
  async deleteRoom(roomId: string, userId: string) {
    try {
      // Validate room ID
      if (!Types.ObjectId.isValid(roomId)) {
        return SerializeHttpResponse(
          null,
          HttpStatus.BAD_REQUEST,
          CHAT_ERRORS.INVALID_ROOM_ID,
        );
      }

      // Verify user is a participant
      const room = await this.chatRoomModel.findOne({
        _id: new Types.ObjectId(roomId),
        participants: new Types.ObjectId(userId),
        isDeleted: false,
      });

      if (!room) {
        return SerializeHttpResponse(
          null,
          HttpStatus.NOT_FOUND,
          CHAT_ERRORS.ROOM_NOT_FOUND,
        );
      }

      // Soft delete
      await this.chatRoomModel.findByIdAndUpdate(roomId, {
        isDeleted: true,
      });

      return SerializeHttpResponse(
        null,
        HttpStatus.OK,
        CHAT_SUCCESS.ROOM_DELETED,
      );
    } catch (error) {
      console.error('Error in deleteRoom:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        CHAT_ERRORS.ROOM_DELETE_FAILED,
      );
    }
  }

  /**
   * Get or create unread count record
   *
   * Gets existing unread count record or creates a new one with count 0.
   * Used internally to ensure count record exists before incrementing/decrementing.
   *
   * @param roomId - The ID of the room
   * @param userId - The ID of the user
   * @returns Unread count record
   *
   * @private
   */
  private async getOrCreateUnreadCount(
    roomId: string,
    userId: string,
  ): Promise<ChatUnreadCountDocument> {
    const unreadCount = await this.chatUnreadCountModel.findOne({
      roomId: new Types.ObjectId(roomId),
      userId: new Types.ObjectId(userId),
    });

    if (unreadCount) {
      return unreadCount;
    }

    // Create new record with count 0
    return await this.chatUnreadCountModel.create({
      roomId: new Types.ObjectId(roomId),
      userId: new Types.ObjectId(userId),
      count: 0,
    });
  }

  /**
   * Increment unread count for a user in a room
   *
   * Atomically increments the unread count using MongoDB $inc operator.
   * Creates the record if it doesn't exist.
   *
   * @param roomId - The ID of the room
   * @param userId - The ID of the user
   * @param amount - Amount to increment (default: 1)
   *
   * @private
   */
  private async incrementUnreadCount(
    roomId: string,
    userId: string,
    amount: number = 1,
  ): Promise<void> {
    await this.chatUnreadCountModel.findOneAndUpdate(
      {
        roomId: new Types.ObjectId(roomId),
        userId: new Types.ObjectId(userId),
      },
      {
        $inc: { count: amount },
      },
      {
        upsert: true,
        new: true,
      },
    );
  }

  /**
   * Decrement unread count for a user in a room
   *
   * Atomically decrements the unread count using MongoDB $inc operator.
   * Ensures count never goes below 0.
   *
   * @param roomId - The ID of the room
   * @param userId - The ID of the user
   * @param amount - Amount to decrement (default: 1)
   *
   * @private
   */
  private async decrementUnreadCount(
    roomId: string,
    userId: string,
    amount: number = 1,
  ): Promise<void> {
    // First get current count
    const unreadCount = await this.getOrCreateUnreadCount(roomId, userId);
    const newCount = Math.max(0, unreadCount.count - amount);

    // Update count (ensure it doesn't go below 0)
    await this.chatUnreadCountModel.findOneAndUpdate(
      {
        roomId: new Types.ObjectId(roomId),
        userId: new Types.ObjectId(userId),
      },
      {
        $set: { count: newCount },
      },
      {
        upsert: true,
      },
    );
  }

  /**
   * Reset unread count to 0 for a user in a room
   *
   * Sets the unread count to 0. Creates record if it doesn't exist.
   *
   * @param roomId - The ID of the room
   * @param userId - The ID of the user
   *
   * @private
   */
  private async resetUnreadCount(
    roomId: string,
    userId: string,
  ): Promise<void> {
    await this.chatUnreadCountModel.findOneAndUpdate(
      {
        roomId: new Types.ObjectId(roomId),
        userId: new Types.ObjectId(userId),
      },
      {
        $set: { count: 0 },
      },
      {
        upsert: true,
      },
    );
  }

  /**
   * Initialize unread counts for both participants in a room
   *
   * Creates unread count records with count 0 for both users when room is created.
   *
   * @param roomId - The ID of the room
   * @param participants - Array of participant user IDs
   *
   * @private
   */
  private async initializeUnreadCounts(
    roomId: string,
    participants: Types.ObjectId[],
  ): Promise<void> {
    // Initialize count 0 for both participants
    for (const participantId of participants) {
      await this.chatUnreadCountModel.findOneAndUpdate(
        {
          roomId: new Types.ObjectId(roomId),
          userId: participantId,
        },
        {
          $setOnInsert: { count: 0 },
        },
        {
          upsert: true,
        },
      );
    }
  }

  /**
   * Cleanup on module destroy
   * Called when the module is being destroyed
   */
  onModuleDestroy() {
    // Cleanup logic if needed
  }
}
