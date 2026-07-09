import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

/**
 * DTO for creating or getting a 1-on-1 chat room
 *
 * This DTO is used when a user wants to start a conversation with another user.
 * The system will either return an existing room or create a new one.
 *
 * Usage Example:
 * ```typescript
 * // GET /chat/rooms/user/:userId
 * const room = await chatService.getOrCreateRoom(currentUserId, otherUserId);
 * ```
 */
export class CreateRoomDto {
  /**
   * The ID of the other user to create a room with
   * Must be a valid MongoDB ObjectId
   *
   * @example "507f1f77bcf86cd799439011"
   */
  @ApiProperty({
    description: 'The ID of the user to create a chat room with',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'User ID is required' })
  @IsMongoId({ message: 'Invalid user ID format' })
  userId: string;
}
