/**
 * Chat Module API Route Constants
 *
 * This file contains all the route constants used in the chat module.
 * Following the project's pattern of using enums for route definitions.
 */
export enum CHAT_ROUTES {
  BASE = 'chat',
  INITIATE = 'initiate',
  ROOMS = 'rooms',
  ROOM_BY_ID = 'rooms/:roomId',
  ROOM_BY_USER = 'rooms/user/:otherUserId',
  MESSAGES = 'rooms/:roomId/messages',
  MARK_READ = 'rooms/:roomId/mark-read',
  MARK_ALL_READ_IF_LAST_READ = 'rooms/:roomId/mark-all-read-if-last-read',
  UNREAD_COUNT = 'rooms/:roomId/unread-count',
}
