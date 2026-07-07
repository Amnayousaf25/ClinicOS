import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';

import { SerializeHttpResponse } from 'src/utils/serializer';
import { ITemplates } from 'src/modules/email/types/templates.type';
import {
  USER_ROLES,
  USER_STATUS,
} from 'src/modules/user/constants/user.constant';
import { EmailService } from 'src/modules/email/services/email-service';
import { User } from 'src/modules/user/user.schema';

import { AUTH_ERRORS, AUTH_SUCCESS } from '../constants/auth.response';
import {
  UserEmailDto,
  VerifyResetPasswordDto,
} from '../dto/forgot-password.dto';
import {
  ACCESS_TOKEN_VALIDITY,
  DEFAULT_TOKEN_VALIDITY,
  EMAIL_TOKEN_VALIDITY,
  USE_REFRESH_TOKEN,
  CONFIG,
} from '../constants/auth.config';
import { SignupDto } from '../dto/signup.dto';
import { AppleDto } from '../dto/apple.dto';
import { SignInDto } from '../dto/signin.dto';
import { OtpService } from './otp.service';

import { comparePassword, createHashPassword } from '../utils/auth.util';
import { TOKEN_TYPES } from '../constants/auth.constant';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { SocialAuthService } from './social-auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { OTP_TYPE } from '../types/otp.type';
import { EMAIL_SUBJECT } from '../types/email.type';
import { GoogleDto } from '../dto/google.dto';
import { AuthenticatedPayload } from '../types/request';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly socialAuthService: SocialAuthService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async verifyPassword(plainTextPassword: string, hashedPassword: string) {
    return await comparePassword(plainTextPassword, hashedPassword);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email });
    if (user && (await comparePassword(password, user.password))) {
      if (user.emailVerified) {
        throw new UnauthorizedException(AUTH_ERRORS.EMAIL_NOT_VERIFIED);
      }

      const result = user.toObject();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete result.password;
      return result;
    }
    return null;
  }

  verifyToken(token: string, type: TOKEN_TYPES) {
    try {
      const secret = this.configService.get<string>(CONFIG.JWT_SECRET);
      const response = this.jwtService.verify<
        AuthenticatedPayload & { type: TOKEN_TYPES }
      >(token, {
        secret,
      });
      if (response.type !== type) {
        return { success: false, msg: AUTH_ERRORS.INVALID_TOKEN };
      }
      return { success: true, msg: AUTH_SUCCESS.VALID_TOKEN };
    } catch {
      return { success: false, msg: AUTH_ERRORS.INVALID_TOKEN };
    }
  }

  generateToken(
    userId: string,
    email: string,
    expiresIn: typeof ACCESS_TOKEN_VALIDITY | typeof EMAIL_TOKEN_VALIDITY,
    type: TOKEN_TYPES,
  ) {
    const payload = { sub: userId, email, type };
    const secret = this.configService.get<string>(CONFIG.JWT_SECRET);

    return this.jwtService.sign(payload, {
      secret,
      expiresIn: expiresIn,
    });
  }

  // Admin will signup only!
  async signup(data: SignupDto) {
    const user = await this.userModel.findOne({
      email: data.email.toLowerCase(),
    });

    if (user) {
      return SerializeHttpResponse(
        null,
        HttpStatus.BAD_REQUEST,
        AUTH_ERRORS.DUPLICATE_EMAIL,
      );
    }

    const hashedPassword = await createHashPassword(data.password);

    // TODO: Need to have approval of ADMIN
    await this.userModel.create({
      ...data,
      password: hashedPassword,
      role: USER_ROLES.ADMIN,
    });

    const otpData = { email: data.email };

    await this.otpService.generateOTP(
      otpData,
      OTP_TYPE.SIGNUP,
      EMAIL_SUBJECT.SIGNUP_OTP,
    );

    return SerializeHttpResponse(
      true,
      HttpStatus.CREATED,
      AUTH_SUCCESS.ACCOUNT_CREATION,
    );
  }

  async signIn(data: SignInDto) {
    const user = await this.userModel.findOne({
      email: data.email.toLowerCase(),
    });

    if (!user) {
      return SerializeHttpResponse(
        null,
        HttpStatus.UNAUTHORIZED,
        AUTH_ERRORS.INCORRECT_CREDENTIALS,
      );
    }

    const verify = await this.verifyPassword(data.password, user.password);

    if (!verify) {
      return SerializeHttpResponse(
        null,
        HttpStatus.UNAUTHORIZED,
        AUTH_ERRORS.INCORRECT_CREDENTIALS,
      );
    }

    const LOGIN_NOT_ALLOWED = [USER_STATUS.UNAPPROVED, USER_STATUS.INACTIVE];

    if (LOGIN_NOT_ALLOWED.includes(user.status)) {
      return SerializeHttpResponse(
        null,
        HttpStatus.UNAUTHORIZED,
        AUTH_ERRORS.INCORRECT_CREDENTIALS,
      );
    }

    // Use refresh token feature if enabled, otherwise use old token flow
    if (USE_REFRESH_TOKEN) {
      const tokens = await this.refreshTokenService.generateTokens(
        user._id.toString(),
        user.email,
      );

      return SerializeHttpResponse(
        {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          refreshExpiresIn: tokens.refreshExpiresIn,
          user: user.toJSON(),
        },
        HttpStatus.OK,
        AUTH_SUCCESS.ACCOUNT_LOGIN,
      );
    } else {
      // Old token flow (backward compatible)
      const token = this.generateToken(
        user._id.toString(),
        user.email,
        DEFAULT_TOKEN_VALIDITY,
        TOKEN_TYPES.SIGNIN_TOKEN,
      );

      return SerializeHttpResponse(
        { token, user: user.toJSON() },
        HttpStatus.OK,
        AUTH_SUCCESS.ACCOUNT_LOGIN,
      );
    }
  }

  async forgotPassword(data: UserEmailDto) {
    const user = await this.userModel.findOne({
      email: data.email.toLowerCase(),
    });

    if (!user) {
      return SerializeHttpResponse(
        null,
        HttpStatus.NOT_FOUND,
        AUTH_ERRORS.USER_NOT_FOUND,
      );
    }

    const token = this.generateToken(
      user._id.toString(),
      user.email,
      EMAIL_TOKEN_VALIDITY,
      TOKEN_TYPES.RESET_PASSWORD_TOKEN,
    );

    const emailData = {
      name: user.name,
      email: data.email,
      token: token,
      url: this.configService.get<string>(CONFIG.FRONTEND_URL),
    };

    const template = this.emailService.loadTemplate(
      ITemplates.FORGOT_PASSWORD,
      emailData,
    );

    const subject = 'Forgot Password';
    await this.emailService.sendEmail(data.email, subject, template);

    return SerializeHttpResponse(
      null,
      HttpStatus.OK,
      AUTH_SUCCESS.FORGOT_PASSWORD,
    );
  }

  async verifyResetPassword(data: VerifyResetPasswordDto) {
    const verifiedToken = this.verifyToken(
      data.token,
      TOKEN_TYPES.RESET_PASSWORD_TOKEN,
    );

    if (!verifiedToken.success) {
      return SerializeHttpResponse(
        null,
        HttpStatus.FORBIDDEN,
        AUTH_ERRORS.INVALID_TOKEN,
      );
    }

    const hashedPassword = await createHashPassword(data.password);

    await this.userModel.findOneAndUpdate(
      { email: data.email.toLowerCase() },
      { password: hashedPassword },
    );

    return SerializeHttpResponse(
      null,
      HttpStatus.OK,
      AUTH_SUCCESS.RESET_PASSWORD,
    );
  }

  async changePassword(userId: string, data: ChangePasswordDto) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      return SerializeHttpResponse(
        null,
        HttpStatus.NOT_FOUND,
        AUTH_ERRORS.USER_NOT_FOUND,
      );
    }

    const isPasswordValid = await this.verifyPassword(
      data.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      return SerializeHttpResponse(
        null,
        HttpStatus.BAD_REQUEST,
        AUTH_ERRORS.INCORRECT_CURRENT_PASSWORD,
      );
    }

    const hashedPassword = await createHashPassword(data.newPassword);
    user.password = hashedPassword;
    await user.save();

    return SerializeHttpResponse(
      null,
      HttpStatus.OK,
      AUTH_SUCCESS.PASSWORD_CHANGED,
    );
  }

  async handleGoogleAuth(data: GoogleDto) {
    return await this.socialAuthService.verifyGoogleToken(data.token);
  }

  async handleAppleAuth(data: AppleDto) {
    return await this.socialAuthService.verifyAppleToken(data.idToken);
  }
}
