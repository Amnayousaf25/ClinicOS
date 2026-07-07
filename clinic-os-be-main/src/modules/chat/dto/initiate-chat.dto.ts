import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO for initiating a chat between two users
 *
 * This DTO is used when a user wants to start a new conversation with another user.
 * It creates a chat room and optionally sends an initial message.
 *
 * Usage Example:
 * ```typescript
 * // POST /chat/initiate
 * const result = await chatService.initiateChat(senderId, dto.receiverId, dto.content);
 * ```
 */
export class InitiateChatDto {
  /**
   * The ID of the receiver/user to start a chat with
   * Must be a valid MongoDB ObjectId
   *
   * @example "507f1f77bcf86cd799439011"
   */
  @ApiProperty({
    description: 'The ID of the user to start a chat with',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'Receiver ID is required' })
  @IsMongoId({ message: 'Invalid receiver ID format' })
  receiverId: string;

  /**
   * Optional initial message content
   * If provided, this message will be sent when the chat is initiated
   * Must be between 1 and 5000 characters if provided
   *
   * @example "Hello! How are you?"
   */
  @ApiPropertyOptional({
    description: 'Optional initial message to send when starting the chat',
    example: 'Hello! How are you?',
    minLength: 1,
    maxLength: 5000,
  })
  @IsOptional()
  @IsString({ message: 'Message content must be a string' })
  @MinLength(1, { message: 'Message content must be at least 1 character' })
  @MaxLength(5000, {
    message: 'Message content must not exceed 5000 characters',
  })
  content?: string;
}
