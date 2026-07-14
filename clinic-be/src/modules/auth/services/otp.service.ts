import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';

import { SerializeHttpResponse } from 'src/utils/serializer';

import { ITemplates } from 'src/modules/email/types/templates.type';
import { User } from 'src/modules/user/user.schema';
import { EmailService } from 'src/modules/email/services/email-service';
import { SmsService } from 'src/modules/sms/sms.service';

import { OTP_TYPE } from '../types/otp.type';
import { EMAIL_SUBJECT } from '../types/email.type';
import {
  ACCESS_TOKEN_VALIDITY,
  CONFIG,
  EMAIL_TOKEN_VALIDITY,
  OTP_EXPIRY_MINUTES,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  USE_TOTP,
} from '../constants/auth.config';
import { OTP_ERROR, OTP_SUCCESS } from '../constants/otp.response';
import {
  generateSecureOTP,
  generateTOTP,
  generateTOTPSecret,
  verifyTOTP,
} from '../utils/auth.util';
import { AUTH_ERRORS } from '../constants/auth.response';
import { TOKEN_TYPES } from '../constants/auth.constant';
import { Otp } from '../schemas/otp.schema';
import { UserEmailDto } from '../dto/forgot-password.dto';
import { OtpDto } from '../dto/otp.dto';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Otp.name) private readonly otpModel: Model<Otp>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
  ) {}

  async generateOTP(
    userInput: UserEmailDto,
    accessType: OTP_TYPE,
    subject: EMAIL_SUBJECT,
  ) {
    const user = await this.userModel.findOne({ email: userInput.email });

    if (!user) {
      return SerializeHttpResponse(
        null,
        HttpStatus.NOT_FOUND,
        AUTH_ERRORS.USER_NOT_FOUND,
      );
    }

    // Check for recent OTP to prevent spam
    const recentOtp = await this.otpModel.findOne({
      email: userInput.email,
      accessType,
      isVerified: false,
      createdAt: {
        $gte: new Date(Date.now() - OTP_RESEND_COOLDOWN_SECONDS * 1000),
      },
    });

    if (recentOtp) {
      return SerializeHttpResponse(
        null,
        HttpStatus.TOO_MANY_REQUESTS,
        `Please wait ${OTP_RESEND_COOLDOWN_SECONDS} seconds before requesting a new OTP`,
      );
    }

    // Generate OTP based on configuration
    let otp: string;
    let secret: string | undefined;

    if (USE_TOTP) {
      // Use TOTP (Time-based OTP) - more secure
      secret = generateTOTPSecret();
      otp = generateTOTP(secret);
    } else {
      // Use cryptographically secure random OTP
      otp = generateSecureOTP(OTP_LENGTH);
    }

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Mark old OTPs as verified (invalidate them)
    await this.otpModel.updateMany(
      {
        email: userInput.email,
        accessType,
        isVerified: false,
      },
      { isVerified: true },
    );

    // Create new OTP record
    await this.otpModel.create({
      otp,
      accessType,
      isVerified: false,
      email: userInput.email,
      secret,
      expiresAt,
      attempts: 0,
    });

    // Send OTP via email
    const emailData = { otp, name: user.name, email: user.email };
    const template = this.emailService.loadTemplate(ITemplates.OTP, emailData);

    const isDev = this.configService.get<string>('NODE_ENV') === 'dev';
    if (isDev) {
      this.logger.log(`[DEV ONLY] Generated OTP for ${user.email}: ${otp}`);
    }

    try {
      await this.emailService.sendEmail(user.email, subject, template);
    } catch (emailError: any) {
      this.logger.warn(
        `Failed to send OTP email to ${user.email}: ${emailError.message || emailError}. Attempting SMS fallback...`,
      );
      if (user.phone) {
        try {
          const smsBody = `Your ClinicOS verification code is: ${otp}. Valid for 10 minutes.`;
          await this.smsService.sendSms(user.phone, smsBody);
          this.logger.log(`OTP verification code successfully sent via SMS to ${user.phone}`);
        } catch (smsError: any) {
          this.logger.error(
            `SMS fallback also failed for ${user.phone}: ${smsError.message || smsError}`,
          );
          throw new Error(`Failed to send OTP via Email or SMS: ${emailError.message}`);
        }
      } else {
        this.logger.error(`Email failed and no phone number registered for ${user.email}`);
        throw emailError;
      }
    }
    return SerializeHttpResponse(true, HttpStatus.OK, OTP_SUCCESS.GENERATE_OTP);
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

  async validateOTP(userInput: OtpDto, accessType: OTP_TYPE) {
    const otpRecord = await this.otpModel.findOne({
      email: userInput.email,
      accessType: accessType,
      isVerified: false,
    });

    if (!otpRecord) {
      return SerializeHttpResponse(
        null,
        HttpStatus.FORBIDDEN,
        OTP_ERROR.OTP_NOT_VERIFIED,
      );
    }

    // Check if OTP has expired
    if (otpRecord.expiresAt && new Date() > otpRecord.expiresAt) {
      return SerializeHttpResponse(
        null,
        HttpStatus.FORBIDDEN,
        OTP_ERROR.OTP_EXPIRED,
      );
    }

    // Check max attempts
    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      otpRecord.isVerified = true;
      await otpRecord.save();
      return SerializeHttpResponse(
        null,
        HttpStatus.FORBIDDEN,
        'Maximum OTP verification attempts exceeded. Please request a new OTP.',
      );
    }

    // Verify OTP
    let isValid = false;

    if (USE_TOTP && otpRecord.secret) {
      // Verify TOTP
      isValid = verifyTOTP(userInput.otp, otpRecord.secret);
    } else {
      // Verify simple OTP
      isValid = otpRecord.otp === userInput.otp;
    }

    // Update attempts
    otpRecord.attempts += 1;
    otpRecord.lastAttemptAt = new Date();

    if (!isValid) {
      await otpRecord.save();
      const remainingAttempts = OTP_MAX_ATTEMPTS - otpRecord.attempts;
      return SerializeHttpResponse(
        null,
        HttpStatus.FORBIDDEN,
        `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
      );
    }

    // OTP is valid
    otpRecord.isVerified = true;
    await otpRecord.save();

    const resetToken = this.generateToken(
      userInput.email,
      userInput.email,
      EMAIL_TOKEN_VALIDITY,
      TOKEN_TYPES.RESET_PASSWORD_TOKEN,
    );

    return SerializeHttpResponse(
      { resetToken },
      HttpStatus.OK,
      OTP_SUCCESS.VERIFIED_OTP,
    );
  }

  async verifySignupOtp(userInput: OtpDto) {
    const otpRecord = await this.otpModel.findOne({
      email: userInput.email,
      accessType: OTP_TYPE.SIGNUP,
      isVerified: false,
    });

    if (!otpRecord) {
      return SerializeHttpResponse(
        null,
        HttpStatus.FORBIDDEN,
        OTP_ERROR.OTP_NOT_VERIFIED,
      );
    }

    // Check if OTP has expired
    if (otpRecord.expiresAt && new Date() > otpRecord.expiresAt) {
      return SerializeHttpResponse(
        null,
        HttpStatus.FORBIDDEN,
        OTP_ERROR.OTP_EXPIRED,
      );
    }

    // Check max attempts
    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      otpRecord.isVerified = true;
      await otpRecord.save();
      return SerializeHttpResponse(
        null,
        HttpStatus.FORBIDDEN,
        'Maximum OTP verification attempts exceeded. Please request a new OTP.',
      );
    }

    // Verify OTP
    let isValid = false;

    if (USE_TOTP && otpRecord.secret) {
      isValid = verifyTOTP(userInput.otp, otpRecord.secret);
    } else {
      isValid = otpRecord.otp === userInput.otp;
    }

    // Update attempts
    otpRecord.attempts += 1;
    otpRecord.lastAttemptAt = new Date();

    if (!isValid) {
      await otpRecord.save();
      const remainingAttempts = OTP_MAX_ATTEMPTS - otpRecord.attempts;
      return SerializeHttpResponse(
        null,
        HttpStatus.FORBIDDEN,
        `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
      );
    }

    // OTP is valid
    otpRecord.isVerified = true;
    await otpRecord.save();

    await this.userModel.findOneAndUpdate(
      { email: userInput.email.toLowerCase() },
      { emailVerified: true },
    );

    return SerializeHttpResponse(true, HttpStatus.OK, OTP_SUCCESS.VERIFIED_OTP);
  }
}
