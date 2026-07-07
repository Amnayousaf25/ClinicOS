/**
 * Chat Module Socket.IO Event Constants
 *
 * This file contains all Socket.IO event names used in the chat module.
 * These constants ensure consistency between client and server event names.
 *
 * Usage:
 * - Client → Server: Events that clients emit to the server
 * - Server → Client: Events that server emits to clients
 */
export enum CHAT_EVENTS {
  // Client → Server Events
  JOIN_ROOM = 'join-room',
  SEND_MESSAGE = 'send-message',
  MARK_AS_READ = 'mark-as-read',

  // Server → Client Events
  MESSAGE_RECEIVED = 'message-received',
  MESSAGES_READ = 'messages-read',
  ERROR = 'error',
  CONNECTED = 'connected',
}
