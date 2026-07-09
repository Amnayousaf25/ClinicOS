import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from 'src/modules/users/users.service';
import { CONFIG } from 'src/common/constants/config.constants';
import { JwtPayload } from 'src/common/types/jwt-payload.types';
import { Organization } from 'src/modules/organizations/schemas/organization.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private usersService: UsersService,
    @InjectModel(Organization.name)
    private readonly orgModel: Model<Organization>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get(CONFIG.JWT_SECRET) || '',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findByEmail(payload.email);
    if (!user || !user.isActive) throw new UnauthorizedException();

    // Attach the org's role-default overrides so the permission resolver can
    // merge them between code defaults and user overrides on every request.
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

    return Object.assign(user, { orgRoleDefaults });
  }
}
