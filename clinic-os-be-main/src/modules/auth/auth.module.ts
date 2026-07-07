import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from 'src/modules/users/users.module';
import { EmailModule } from 'src/modules/email/email.module';
import {
  Organization,
  OrganizationSchema,
} from 'src/modules/organizations/schemas/organization.schema';
import { User, UserSchema } from 'src/modules/users/schemas/user.schema';
import { Otp, OtpSchema } from './schemas/otp.schema';
import { CONFIG } from 'src/common/constants/config.constants';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    EmailModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Otp.name, schema: OtpSchema },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        secret: c.get(CONFIG.JWT_SECRET),
        signOptions: { expiresIn: c.get(CONFIG.JWT_EXPIRES_IN) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, JwtModule],
})
export class AuthModule {}
