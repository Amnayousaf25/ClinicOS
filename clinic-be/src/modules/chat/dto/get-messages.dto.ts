import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for getting messages from a chat room with pagination
 *
 * This DTO is used to retrieve messages from a room with pagination support.
 *
 * Usage Example:
 * ```typescript
 * // GET /chat/rooms/:roomId/messages?page=1&limit=20
 * const messages = await chatService.getRoomMessages(roomId, dto.page, dto.limit);
 * ```
 */
export class GetMessagesDto {
  /**
   * Page number for pagination
   * Minimum: 1
   * Default: 1
   *
   * @example 1
   */
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  /**
   * Number of items per page
   * Minimum: 1
   * Maximum: 100
   * Default: 20
   *
   * @example 20
   */
  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  limit?: number = 20;
}
