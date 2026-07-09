import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * DTO for sending a message in a chat room
 *
 * This DTO is used when sending a message via REST API.
 * For Socket.IO, use the SendMessagePayload interface from types.
 *
 * Usage Example:
 * ```typescript
 * // POST /chat/rooms/:roomId/messages
 * const message = await chatService.sendMessage(roomId, senderId, dto.content);
 * ```
 */
export class SendMessageDto {
  /**
   * The message content/text
   * Must be between 1 and 5000 characters
   *
   * @example "Hello! How are you?"
   */
  @ApiProperty({
    description: 'The message content',
    example: 'Hello! How are you?',
    minLength: 1,
    maxLength: 5000,
  })
  @IsNotEmpty({ message: 'Message content is required' })
  @IsString({ message: 'Message content must be a string' })
  @MinLength(1, { message: 'Message content must be at least 1 character' })
  @MaxLength(5000, {
    message: 'Message content must not exceed 5000 characters',
  })
  content: string;
}
