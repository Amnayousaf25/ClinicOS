import * as crypto from 'crypto';
import { Model } from 'mongoose';
import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { User } from 'src/modules/user/user.schema';
import { SerializeHttpResponse } from 'src/utils/serializer';
import { AUTH_ERRORS } from 'src/modules/auth/constants/auth.response';
import {
  CONFIG,
  ACCESS_TOKEN_VALIDITY,
  REFRESH_TOKEN_VALIDITY,
} from '../constants/auth.config';
import { TOKEN_TYPES } from 'src/modules/auth/constants/auth.constant';

import { RefreshToken } from '../schemas/refresh-token.schema';
import { addUtcDays } from 'src/common/utils/date.util';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate a secure random refresh token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Generate access token (JWT)
   */
  private generateAccessToken(userId: string, email: string): string {
    const payload = {
      sub: userId,
      email,
      type: TOKEN_TYPES.SIGNIN_TOKEN,
    };
    const secret = this.configService.get<string>(CONFIG.JWT_SECRET);

    return this.jwtService.sign(payload, {
      secret,
      expiresIn: ACCESS_TOKEN_VALIDITY,
    });
  }

  /**
   * Create and store a new refresh token
   */
  async createRefreshToken(
    userId: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<string> {
    const token = this.generateSecureToken();
    const expiresAt = addUtcDays(new Date(), 60);

    await this.refreshTokenModel.create({
      userId,
      token,
      expiresAt,
      deviceInfo,
      ipAddress,
      isRevoked: false,
    });

    return token;
  }

  /**
   * Generate both access and refresh tokens
   */
  async generateTokens(
    userId: string,
    email: string,
    deviceInfo?: string,
    ipAddress?: string,
  ) {
    const accessToken = this.generateAccessToken(userId, email);
    const refreshToken = await this.createRefreshToken(
      userId,
      deviceInfo,
      ipAddress,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_VALIDITY,
      refreshExpiresIn: REFRESH_TOKEN_VALIDITY,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string) {
    try {
      // Find the refresh token in database
      const storedToken = await this.refreshTokenModel.findOne({
        token: refreshToken,
      });

      if (!storedToken) {
        return SerializeHttpResponse(
          null,
          HttpStatus.UNAUTHORIZED,
          AUTH_ERRORS.INVALID_TOKEN,
        );
      }

      // Check if token is revoked
      if (storedToken.isRevoked) {
        return SerializeHttpResponse(
          null,
          HttpStatus.UNAUTHORIZED,
          'Refresh token has been revoked',
        );
      }

      // Check if token is expired
      if (new Date() > storedToken.expiresAt) {
        return SerializeHttpResponse(
          null,
          HttpStatus.UNAUTHORIZED,
          'Refresh token has expired',
        );
      }

      // Find the user
      const user = await this.userModel.findById(storedToken.userId);

      if (!user) {
        return SerializeHttpResponse(
          null,
          HttpStatus.NOT_FOUND,
          AUTH_ERRORS.USER_NOT_FOUND,
        );
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(
        user._id.toString(),
        user.email,
      );

      return SerializeHttpResponse(
        {
          accessToken,
          expiresIn: ACCESS_TOKEN_VALIDITY,
          user: user.toJSON(),
        },
        HttpStatus.OK,
        'Access token refreshed successfully',
      );
    } catch (error) {
      console.error('Refresh Token Error:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        AUTH_ERRORS.ACCOUNT_LOGIN,
      );
    }
  }

  /**
   * Revoke a refresh token (for logout)
   */
  async revokeRefreshToken(refreshToken: string) {
    try {
      const result = await this.refreshTokenModel.findOneAndUpdate(
        { token: refreshToken },
        { isRevoked: true },
        { new: true },
      );

      if (!result) {
        return SerializeHttpResponse(
          null,
          HttpStatus.NOT_FOUND,
          'Refresh token not found',
        );
      }

      return SerializeHttpResponse(
        null,
        HttpStatus.OK,
        'Refresh token revoked successfully',
      );
    } catch (error) {
      console.error('Revoke Token Error:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'An error occurred while revoking the token',
      );
    }
  }

  /**
   * Revoke all refresh tokens for a user (for logout from all devices)
   */
  async revokeAllUserTokens(userId: string) {
    try {
      await this.refreshTokenModel.updateMany(
        { userId, isRevoked: false },
        { isRevoked: true },
      );

      return SerializeHttpResponse(
        null,
        HttpStatus.OK,
        'All refresh tokens revoked successfully',
      );
    } catch (error) {
      console.error('Revoke All Tokens Error:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'An error occurred while revoking tokens',
      );
    }
  }

  /**
   * Get all active refresh tokens for a user
   */
  async getUserActiveTokens(userId: string) {
    try {
      const tokens = await this.refreshTokenModel
        .find({
          userId,
          isRevoked: false,
          expiresAt: { $gt: new Date() },
        })
        .select('deviceInfo ipAddress createdAt expiresAt')
        .sort({ createdAt: -1 });

      return SerializeHttpResponse(
        tokens,
        HttpStatus.OK,
        'Active sessions retrieved successfully',
      );
    } catch (error) {
      console.error('Get Active Tokens Error:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'An error occurred while fetching active sessions',
      );
    }
  }

  /**
   * Clean up expired tokens (can be called by a cron job)
   */
  async cleanupExpiredTokens() {
    try {
      const result = await this.refreshTokenModel.deleteMany({
        expiresAt: { $lt: new Date() },
      });

      console.log(`Cleaned up ${result.deletedCount} expired refresh tokens`);
      return result.deletedCount;
    } catch (error) {
      console.error('Cleanup Expired Tokens Error:', error);
      return 0;
    }
  }
}
