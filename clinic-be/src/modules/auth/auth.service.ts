import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/modules/users/users.service';
import { EmailService } from 'src/modules/email/services/email-service';
import { ITemplates } from 'src/modules/email/types/templates.type';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { UserRole, InvitationStatus } from 'src/modules/users/types/user.types';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import {
  UserEmailDto,
  VerifyResetPasswordDto,
} from './dto/forgot-password.dto';
import { OtpDto } from './dto/otp.dto';
import { Otp } from './schemas/otp.schema';
import { OTP_TYPE } from './types/otp.type';
import { EMAIL_SUBJECT } from './types/email.type';
import { TOKEN_TYPES } from './constants/auth.constant';
import { CONFIG } from 'src/common/constants/config.constants';
import {
  CONFIG as AUTH_CONFIG,
  EMAIL_TOKEN_VALIDITY,
  OTP_EXPIRY_MINUTES,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  USE_TOTP,
} from './constants/auth.config';

import { resolveEffectivePermissions } from 'src/common/permissions';
import { IUserForPermissions } from 'src/common/permissions/permission-resolver';
import { Organization } from 'src/modules/organizations/schemas/organization.schema';
import { User } from 'src/modules/users/schemas/user.schema';
import {
  generateSecureOTP,
  generateTOTP,
  generateTOTPSecret,
  verifyTOTP,
} from './utils/auth.util';

const PASSWORD_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Organization.name)
    private readonly orgModel: Model<Organization>,
    @InjectModel(Otp.name)
    private readonly otpModel: Model<Otp>,
  ) {}

  async signup(dto: SignupDto) {
    // 1. Get or create the default organization
    let org = await this.orgModel.findOne({ slug: 'demo-clinic' });
    if (!org) {
      org = await this.orgModel.create({
        name: 'ClinicOS Demo Clinic',
        slug: 'demo-clinic',
        plan: 'trial',
        maxUsers: 50,
        isActive: true,
      });
    }

    // 2. Check if user already exists
    const existingUser = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
      deletedAt: null,
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // 3. Generate a unique employeeId under the organization
    let employeeId = '';
    let exists = true;
    while (exists) {
      employeeId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      const existingEmp = await this.userModel.findOne({
        orgId: org._id,
        employeeId,
        deletedAt: null,
      });
      if (!existingEmp) {
        exists = false;
      }
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);

    // 5. Create user
    const userRole = dto.role || UserRole.Staff;
    const user = await this.userModel.create({
      orgId: org._id,
      name: dto.name,
      email: dto.email.toLowerCase(),
      phone: dto.phone,
      password: hashedPassword,
      role: userRole,
      isActive: true,
      invitationStatus: InvitationStatus.Accepted,
      employeeId,
    });

    // If it's the first admin of the organization and the owner is not set, make them owner
    if (userRole === UserRole.Admin && !org.ownerId) {
      org.ownerId = user._id as any;
      await org.save();
    }

    // 6. Generate and return tokens
    const tokens = await this.generateTokens(user);
    return {
      authenticated: true,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Both checks happen AFTER credentials match — we never reveal that
    // an account exists to a wrong-password attempt. Two distinct cases:
    //
    //   deletedAt set → account was removed; recovery requires admin
    //                   action OR re-registration if past the soft-delete
    //                   grace window.
    //   isActive false → account is intact but admin disabled it. Can
    //                   be reactivated without re-registration.
    //
    // Order matters: check deleted before isActive (soft-delete also
    // sets isActive=false, see usersService.softDelete).
    if (user.deletedAt) {
      throw new UnauthorizedException(
        'This account has been removed. Please contact your administrator if this is a mistake.',
      );
    }
    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account is currently deactivated. Please contact your administrator to reactivate it.',
      );
    }
    return this.generateTokens(user, dto.rememberMe);
  }

  async changePassword(
    userId: string,
    dto: { currentPassword: string; newPassword: string },
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch)
      throw new UnauthorizedException('Current password is incorrect');

    user.password = await bcrypt.hash(dto.newPassword, PASSWORD_SALT_ROUNDS);
    await user.save();
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get(CONFIG.JWT_REFRESH_SECRET),
      });
      const user = await this.usersService.findByEmail(payload.email);
      if (!user) throw new UnauthorizedException();
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  logout() {
    return { success: true };
  }

  async validateInviteToken(token: string) {
    const user = await this.usersService.findByInvitationToken(token);
    if (!user) throw new BadRequestException('Invalid or expired invitation');
    return { email: user.email, name: user.name };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const user = await this.usersService.findByInvitationToken(dto.token);
    if (!user || user.email !== dto.email)
      throw new BadRequestException('Invalid invitation');
    user.password = await bcrypt.hash(dto.password, 10);
    user.invitationStatus = 'accepted' as any;
    user.invitationToken = null as any;
    user.isActive = true;
    await user.save();
    return this.generateTokens(user);
  }

  async forgotPassword(dto: UserEmailDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');

    // Check for recent OTP to prevent spam
    const recentOtp = await this.otpModel.findOne({
      email: dto.email.toLowerCase(),
      accessType: OTP_TYPE.FORGOT_PASSWORD,
      isVerified: false,
      createdAt: {
        $gte: new Date(Date.now() - OTP_RESEND_COOLDOWN_SECONDS * 1000),
      },
    });
    if (recentOtp) {
      throw new HttpException(
        `Please wait ${OTP_RESEND_COOLDOWN_SECONDS} seconds before requesting a new OTP`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    let otp: string;
    let secret: string | undefined;
    if (USE_TOTP) {
      secret = generateTOTPSecret();
      otp = generateTOTP(secret);
    } else {
      otp = generateSecureOTP(OTP_LENGTH);
    }

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate old OTPs
    await this.otpModel.updateMany(
      {
        email: dto.email.toLowerCase(),
        accessType: OTP_TYPE.FORGOT_PASSWORD,
        isVerified: false,
      },
      { isVerified: true },
    );

    await this.otpModel.create({
      otp,
      accessType: OTP_TYPE.FORGOT_PASSWORD,
      isVerified: false,
      email: dto.email.toLowerCase(),
      secret,
      expiresAt,
      attempts: 0,
    });

    const template = this.emailService.loadTemplate(ITemplates.OTP, {
      otp,
      name: user.name,
      email: user.email,
    });
    try {
      await this.emailService.sendEmail(
        user.email,
        EMAIL_SUBJECT.FORGOT_PASSWORD_OTP,
        template,
      );
    } catch (emailError: any) {
      throw new BadRequestException(
        `Failed to send OTP email: ${emailError.message || 'unknown error'}`,
      );
    }

    return { message: 'OTP has been sent to your email' };
  }

  async verifyForgotPasswordOtp(dto: OtpDto) {
    const otpRecord = await this.otpModel.findOne({
      email: dto.email.toLowerCase(),
      accessType: OTP_TYPE.FORGOT_PASSWORD,
      isVerified: false,
    });

    if (!otpRecord) throw new ForbiddenException('OTP verification failed');
    if (otpRecord.expiresAt && new Date() > otpRecord.expiresAt) {
      throw new ForbiddenException('OTP has expired');
    }
    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      otpRecord.isVerified = true;
      await otpRecord.save();
      throw new ForbiddenException(
        'Maximum OTP attempts exceeded. Please request a new OTP.',
      );
    }

    let isValid = false;
    if (USE_TOTP && otpRecord.secret) {
      isValid = verifyTOTP(dto.otp, otpRecord.secret);
    } else {
      isValid = otpRecord.otp === dto.otp;
    }

    otpRecord.attempts += 1;
    otpRecord.lastAttemptAt = new Date();

    if (!isValid) {
      await otpRecord.save();
      const remaining = OTP_MAX_ATTEMPTS - otpRecord.attempts;
      throw new ForbiddenException(
        `Invalid OTP. ${remaining} attempt(s) remaining.`,
      );
    }

    otpRecord.isVerified = true;
    await otpRecord.save();

    const resetToken = this.jwtService.sign(
      {
        sub: dto.email,
        email: dto.email,
        type: TOKEN_TYPES.RESET_PASSWORD_TOKEN,
      },
      {
        secret: this.config.get(AUTH_CONFIG.JWT_SECRET),
        expiresIn: EMAIL_TOKEN_VALIDITY,
      },
    );

    return { token: resetToken, message: 'OTP verified successfully' };
  }

  async verifyResetPassword(dto: VerifyResetPasswordDto) {
    try {
      const payload = this.jwtService.verify(dto.token, {
        secret: this.config.get(AUTH_CONFIG.JWT_SECRET),
      });
      if (payload.type !== TOKEN_TYPES.RESET_PASSWORD_TOKEN) {
        throw new ForbiddenException('Invalid reset token');
      }
    } catch {
      throw new ForbiddenException('Invalid or expired reset token');
    }

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');

    user.password = await bcrypt.hash(dto.password, 10);
    await user.save();

    return { message: 'Password has been reset successfully' };
  }

  private async generateTokens(user: any, rememberMe?: boolean) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      orgId: user.orgId?.toString() || null,
    };

    // Fetch org-level role overrides so effectivePermissions returned at login
    // already accounts for them.
    let orgRoleDefaults: Record<string, Record<string, boolean>> = {};
    if (user.orgId) {
      const org = await this.orgModel
        .findById(user.orgId)
        .select({ roleDefaultOverrides: 1 })
        .lean();
      if (org?.roleDefaultOverrides) {
        orgRoleDefaults = org.roleDefaultOverrides;
      }
    }

    const effectivePermissions = resolveEffectivePermissions({
      id: user._id.toString(),
      role: user.role,
      isActive: user.isActive,
      invitationStatus: user.invitationStatus,
      permissionOverrides: user.permissionOverrides,
      orgRoleDefaults,
    } as IUserForPermissions);

    const refreshTokenExpiresIn = rememberMe
      ? this.config.get(CONFIG.JWT_REFRESH_EXPIRES_IN) || '7d'
      : '1d';

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(
        { ...payload, type: 'refresh' },
        {
          secret: this.config.get(CONFIG.JWT_REFRESH_SECRET),
          expiresIn: refreshTokenExpiresIn,
        },
      ),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
      },
      effectivePermissions,
    };
  }
}
