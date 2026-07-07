import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { Model } from 'mongoose';
import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { User, UserDocument } from 'src/modules/user/user.schema';
import { SerializeHttpResponse } from 'src/utils/serializer';
import {
  AUTH_ERRORS,
  AUTH_SUCCESS,
} from 'src/modules/auth/constants/auth.response';
import {
  AUTH_PROVIDER,
  TOKEN_TYPES,
} from 'src/modules/auth/constants/auth.constant';
import { USER_STATUS } from 'src/modules/user/constants/user.constant';

import {
  USE_REFRESH_TOKEN,
  DEFAULT_TOKEN_VALIDITY,
  CONFIG,
} from '../constants/auth.config';
import { createHashPassword, generateRandomString } from '../utils/auth.util';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class SocialAuthService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>(CONFIG.GOOGLE_CLIENT_ID),
      this.configService.get<string>(CONFIG.GOOGLE_CLIENT_SECRET),
    );
  }

  async verifyAppleToken(idToken: string) {
    try {
      console.log('Apple Auth: Starting verification');

      const decodedHeader = jwt.decode(idToken, { complete: true });
      if (!decodedHeader || typeof decodedHeader === 'string') {
        return SerializeHttpResponse(
          null,
          HttpStatus.BAD_REQUEST,
          AUTH_ERRORS.INVALID_APPLE_TOKEN,
        );
      }
      const kid = decodedHeader.header.kid;

      const client = jwksClient({
        jwksUri: 'https://appleid.apple.com/auth/keys',
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 600000, // 10 min
      });

      const key = await client.getSigningKey(kid);
      const publicKey = key.getPublicKey();

      let payload: {
        iss: string;
        aud: string;
        email: string;
        email_verified: boolean;
        name?: string;
      };
      try {
        payload = jwt.verify(idToken, publicKey, { algorithms: ['RS256'] }) as {
          iss: string;
          aud: string;
          email: string;
          email_verified: boolean;
          name?: string;
        };
      } catch (error) {
        console.error('Apple Auth: JWT verification failed', error);
        return SerializeHttpResponse(
          null,
          HttpStatus.BAD_REQUEST,
          AUTH_ERRORS.INVALID_APPLE_TOKEN,
        );
      }

      // Claims validation
      if (
        payload?.iss !== 'https://appleid.apple.com' ||
        payload?.aud !== 'org.reactjs.native.example.Zetreen'
      ) {
        console.error('Apple Auth: Invalid issuer or audience', payload);
        return SerializeHttpResponse(
          null,
          HttpStatus.BAD_REQUEST,
          AUTH_ERRORS.INVALID_APPLE_TOKEN,
        );
      }

      if (!payload.email || !payload.email_verified) {
        console.error('Apple Auth: Missing or unverified email', payload);
        return SerializeHttpResponse(
          null,
          HttpStatus.BAD_REQUEST,
          AUTH_ERRORS.INVALID_APPLE_TOKEN,
        );
      }

      const user = await this.userModel.findOne({ email: payload.email });
      if (user) {
        const loggedData = await this.loginUser(user);
        return SerializeHttpResponse(
          loggedData,
          HttpStatus.OK,
          AUTH_SUCCESS.ACCOUNT_LOGIN,
        );
      }

      const name = payload.name || payload.email.split('@')[0] || '';

      // TODO: Create new user according to your requirements
      const newUser = await this.userModel.create({
        email: payload.email,
        name,
        provider: AUTH_PROVIDER.APPLE,
        status: USER_STATUS.ACTIVE,
        emailVerified: true,
      });

      const loggedData = await this.loginUser(newUser);

      return SerializeHttpResponse(
        loggedData,
        HttpStatus.CREATED,
        AUTH_SUCCESS.APPLE_ACCOUNT_CREATION,
      );
    } catch (error) {
      console.error('Apple Auth Error:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        AUTH_ERRORS.ACCOUNT_LOGIN,
      );
    }
  }

  private async createNewUser(payload: TokenPayload): Promise<UserDocument> {
    const password = generateRandomString();
    const hashedPassword = await createHashPassword(password);

    const newUser = await this.userModel.create({
      name: payload.name || payload?.email?.split('@')[0] || 'User',
      email: payload?.email || 'user@example.com',
      password: hashedPassword,
      provider: AUTH_PROVIDER.GOOGLE,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });

    return newUser;
  }

  private async loginUser(user: UserDocument) {
    // Use refresh token feature if enabled, otherwise use old token flow
    if (USE_REFRESH_TOKEN) {
      const tokens = await this.refreshTokenService.generateTokens(
        user._id.toString(),
        user.email,
      );

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        refreshExpiresIn: tokens.refreshExpiresIn,
        user: user.toJSON(),
      };
    } else {
      // Old token flow (backward compatible)
      const token = this.jwtService.sign(
        {
          sub: user._id.toString(),
          email: user.email,
          type: TOKEN_TYPES.SIGNIN_TOKEN,
        },
        {
          secret: this.configService.get<string>(CONFIG.JWT_SECRET),
          expiresIn: DEFAULT_TOKEN_VALIDITY,
        },
      );

      return {
        token,
        user: user.toJSON(),
      };
    }
  }

  async verifyGoogleToken(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>(CONFIG.GOOGLE_CLIENT_ID),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return SerializeHttpResponse(
          null,
          HttpStatus.BAD_REQUEST,
          AUTH_ERRORS.INVALID_GOOGLE_TOKEN,
        );
      }

      const user = await this.userModel
        .findOne({ email: payload.email })
        .lean(false)
        .exec();

      if (!user) {
        const newUser = await this.createNewUser(payload);
        const loggedData = this.loginUser(newUser);

        return SerializeHttpResponse(
          loggedData,
          HttpStatus.CREATED,
          AUTH_SUCCESS.GOOGLE_ACCOUNT_CREATION,
        );
      } else {
        const loggedUser = this.loginUser(user);

        return SerializeHttpResponse(
          loggedUser,
          HttpStatus.OK,
          AUTH_SUCCESS.ACCOUNT_LOGIN,
        );
      }
    } catch (error: unknown) {
      console.error('Google Auth Error:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        AUTH_ERRORS.ACCOUNT_LOGIN,
      );
    }
  }
}
