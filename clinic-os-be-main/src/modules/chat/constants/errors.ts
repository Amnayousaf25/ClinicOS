/**
 * Chat Module Error Message Constants
 *
 * This file contains all error messages used in the chat module.
 * Following the project's pattern of using enums for error messages.
 */
export enum CHAT_ERRORS {
  ROOM_CREATION_FAILED = 'Failed to create chat room',
  ROOM_NOT_FOUND = 'Chat room not found',
  ROOMS_RETRIEVE_FAILED = 'Failed to retrieve chat rooms',
  MESSAGE_SEND_FAILED = 'Failed to send message',
  MESSAGES_RETRIEVE_FAILED = 'Failed to retrieve messages',
  MARK_READ_FAILED = 'Failed to mark messages as read',
  UNREAD_COUNT_FAILED = 'Failed to retrieve unread count',
  INVALID_USER_ID = 'Invalid user ID',
  INVALID_ROOM_ID = 'Invalid room ID',
  USER_NOT_PARTICIPANT = 'User is not a participant of this room',
  ROOM_DELETE_FAILED = 'Failed to delete chat room',
}
