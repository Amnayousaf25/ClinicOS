/**
 * Chat Module TypeScript Types and Interfaces
 *
 * This file contains all TypeScript type definitions used in the chat module.
 * These types ensure type safety across the module.
 */

/**
 * Message type enum
 * Currently only supports text messages, but can be extended for future features
 */
export enum MESSAGE_TYPE {
  TEXT = 'text',
}

/**
 * Interface for socket connection data
 * Stores user information associated with a socket connection
 */
export interface SocketConnectionData {
  userId: string;
  socketId: string;
}

/**
 * Interface for join room payload
 * Sent by client when joining a chat room
 */
export interface JoinRoomPayload {
  roomId: string;
}

/**
 * Interface for send message payload
 * Sent by client when sending a message
 */
export interface SendMessagePayload {
  roomId: string;
  content: string;
}

/**
 * Interface for mark as read payload
 * Sent by client when marking messages as read
 */
export interface MarkAsReadPayload {
  roomId: string;
  messageIds?: string[]; // Optional: if not provided, marks all unread messages in the room
}

/**
 * Interface for message received event
 * Emitted by server when a new message is received
 */
export interface MessageReceivedEvent {
  message: {
    _id: string;
    roomId: string;
    senderId: string;
    content: string;
    messageType: MESSAGE_TYPE;
    readBy: string[];
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Interface for messages read event
 * Emitted by server when messages are marked as read
 */
export interface MessagesReadEvent {
  roomId: string;
  messageIds: string[];
  readBy: string;
}

/**
 * Interface for error event
 * Emitted by server when an error occurs
 */
export interface ErrorEvent {
  message: string;
  code?: string;
}

/**
 * Interface for pagination metadata
 * Used in API responses for paginated data
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
