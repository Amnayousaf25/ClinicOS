import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  UserEmailDto,
  VerifyResetPasswordDto,
} from './dto/forgot-password.dto';
import { OtpDto } from './dto/otp.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RESPONSE } from 'src/common/constants/response.constants';
import { resolveEffectivePermissions } from 'src/common/permissions';
import { IUserForPermissions } from 'src/common/permissions/permission-resolver';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return {
      message: RESPONSE.AUTH.LOGIN_SUCCESS,
      data: await this.authService.login(dto),
    };
  }

  @Post('register')
  async register(@Body() dto: SignupDto) {
    return {
      message: RESPONSE.AUTH.REGISTER_SUCCESS,
      data: await this.authService.signup(dto),
    };
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return {
      message: RESPONSE.AUTH.TOKEN_REFRESHED,
      data: await this.authService.refreshToken(dto.refreshToken),
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout() {
    this.authService.logout();
    return { message: RESPONSE.AUTH.LOGOUT_SUCCESS };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getAuthenticatedUser(@Request() req) {
    const user = req.user;

    // If admin deactivated or removed the user mid-session, kill the
    // session here. Frontend useAuth will see the 401 and redirect.
    // Distinct messages mirror the login path so the UI can render the
    // right "contact admin" guidance.
    if (user.deletedAt) {
      throw new UnauthorizedException(
        'This account has been removed. Please contact your administrator.',
      );
    }
    if (user.isActive === false) {
      throw new UnauthorizedException(
        'Your account is currently deactivated. Please contact your administrator.',
      );
    }

    const effectivePermissions = resolveEffectivePermissions({
      id: user.id,
      role: user.role,
      isActive: user.isActive,
      invitationStatus: user.invitationStatus,
      permissionOverrides: user.permissionOverrides,
      orgRoleDefaults: user.orgRoleDefaults,
    } as IUserForPermissions);

    return {
      message: 'User retrieved successfully',
      data: {
        user: {
          _id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.orgId,
        },
        effectivePermissions,
      },
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return await this.authService.changePassword(req.user.id, dto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: UserEmailDto) {
    return {
      message: 'OTP sent',
      data: await this.authService.forgotPassword(dto),
    };
  }

  @Post('verify-forgot-password-otp')
  async verifyForgotPasswordOtp(@Body() dto: OtpDto) {
    return {
      message: 'OTP verified',
      data: await this.authService.verifyForgotPasswordOtp(dto),
    };
  }

  @Post('verify-reset-password')
  async verifyResetPassword(@Body() dto: VerifyResetPasswordDto) {
    return {
      message: 'Password reset',
      data: await this.authService.verifyResetPassword(dto),
    };
  }

  @Get('invite/:token')
  async validateInvite(@Param('token') token: string) {
    return {
      message: RESPONSE.AUTH.INVITE_VALID,
      data: await this.authService.validateInviteToken(token),
    };
  }

  @Post('invite/accept')
  async acceptInvite(@Body() dto: AcceptInviteDto) {
    return {
      message: RESPONSE.AUTH.INVITE_ACCEPTED,
      data: await this.authService.acceptInvite(dto),
    };
  }
}
