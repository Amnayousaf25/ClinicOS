import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from './schemas/user.schema';
import { Organization } from 'src/modules/organizations/schemas/organization.schema';
import { EmailService } from 'src/modules/email/services/email-service';
import { ITemplates } from 'src/modules/email/types/templates.type';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import {
  resolveEffectivePermissions,
  getRoleDefaults,
  IUserForPermissions,
} from 'src/common/permissions';

// Management hierarchy
const ROLE_HIERARCHY: Record<string, number> = {
  employee: 0,
  manager: 1,
  admin: 2,
  superadmin: 3,
};

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Organization.name) private orgModel: Model<Organization>,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    await this.ensureSoftDeleteAwareUniqueIndexes();
  }

  private async ensureSoftDeleteAwareUniqueIndexes() {
    const specs = [
      {
        name: 'orgId_1_email_1',
        key: { orgId: 1, email: 1 },
      },
      {
        name: 'orgId_1_employeeId_1',
        key: { orgId: 1, employeeId: 1 },
      },
    ] as const;

    for (const spec of specs) {
      const indexes = await this.userModel.collection.indexes();
      const existing = indexes.find((idx) => idx.name === spec.name);
      if (
        existing?.unique &&
        JSON.stringify(existing.partialFilterExpression) !==
          JSON.stringify({ deletedAt: null })
      ) {
        await this.userModel.collection.dropIndex(spec.name);
      }
      await this.userModel.collection.createIndex(spec.key, {
        unique: true,
        partialFilterExpression: { deletedAt: null },
        name: spec.name,
      });
    }
  }

  /**
   * Is the given user the owner of their organization? The org's
   * `ownerId` field is the single source of truth. One owner per org.
   */
  private async isOrgOwner(userId: any, orgId: any): Promise<boolean> {
    if (!userId || !orgId) return false;
    const org = await this.orgModel
      .findById(orgId)
      .select({ ownerId: 1 })
      .lean();
    if (!org?.ownerId) return false;
    return String(org.ownerId) === String(userId);
  }

  /**
   * Hierarchy check between an acting user and a target user.
   *
   * Rules, in order of precedence:
   *   1. Acting on yourself is always allowed.
   *   2. Superadmin bypasses everything (cross-tenant ops).
   *   3. Non-superadmin actions are restricted to the same org.
   *   4. The org owner cannot be touched by anyone else — even other admins.
   *   5. Admin can manage any other admin in their own org (except the
   *      owner, covered by #4), and anyone below admin.
   *   6. Otherwise you must strictly outrank the target.
   */
  async enforceHierarchy(actor: any, targetUserId: string) {
    const target = await this.userModel.findById(targetUserId);
    if (!target) throw new NotFoundException('User not found');

    const actorId = String(actor?._id ?? actor?.id ?? '');
    if (actorId && actorId === String(target._id)) return;

    const actorRole = (actor?.role || '').toLowerCase();
    if (actorRole === 'superadmin') return;

    const actorOrgId = String(actor?.orgId ?? actor?.organizationId ?? '');
    const targetOrgId = String(target?.orgId ?? '');
    if (!actorOrgId || actorOrgId !== targetOrgId) {
      throw new ForbiddenException(
        'You cannot modify users outside your organization',
      );
    }

    // Rule 4: owner is untouchable except by themselves (handled above).
    if (await this.isOrgOwner(target._id, target.orgId)) {
      throw new ForbiddenException(
        'The organization owner can only be modified by themselves',
      );
    }

    // Rule 5: admin ↔ admin is allowed (owner already filtered out).
    if (actorRole === 'admin' && String(target.role).toLowerCase() === 'admin')
      return;

    const actorLevel = ROLE_HIERARCHY[actorRole] ?? 0;
    const targetLevel = ROLE_HIERARCHY[target.role] ?? 0;
    if (targetLevel >= actorLevel) {
      throw new ForbiddenException(
        'You cannot modify a user with equal or higher role',
      );
    }
  }

  async inviteUser(
    orgId: string,
    inviterRole: string,
    dto: InviteUserDto,
    inviterId?: string,
  ) {
    // Admin ↔ admin is allowed because admins can manage other admins
    // under the new hierarchy rules (owner protection handled separately
    // on the edit path). Only block inviting someone strictly above you.
    const inviterLevel = ROLE_HIERARCHY[inviterRole] ?? 0;
    const targetLevel = ROLE_HIERARCHY[dto.role] ?? 0;
    const sameRankButNotAdmin =
      targetLevel === inviterLevel && inviterRole !== 'admin';
    if (targetLevel > inviterLevel || sameRankButNotAdmin) {
      throw new ForbiddenException(
        'You can only invite users at your level (admin) or below',
      );
    }

    // Soft-deleted users (deletedAt set) shouldn't block re-invites — the
    // email has effectively been freed up.
    const existing = await this.userModel.findOne({
      orgId,
      email: dto.email,
      deletedAt: null,
    });
    if (existing) throw new BadRequestException('Email already registered');
    const token = crypto.randomBytes(32).toString('hex');
    const user = await this.userModel.create({
      ...dto,
      orgId,
      createdBy: inviterId ? new Types.ObjectId(inviterId) : null,
      password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
      invitationToken: token,
      invitationStatus: 'pending',
      isActive: false,
    });

    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      process.env.APP_URL ||
      'http://localhost:8080';
    const inviteLink = `${frontendUrl.replace(/\/$/, '')}/invite/${token}`;
    this.logger.log(`[INVITATION LINK] ${inviteLink}`);
    const roleLabel =
      String(dto.role || 'staff')
        .charAt(0)
        .toUpperCase() + String(dto.role || 'staff').slice(1);

    const html = this.emailService.loadTemplate(ITemplates.INVITE_USER, {
      name: dto.name,
      roleLabel,
      inviteLink,
      email: dto.email,
    });

    try {
      await this.emailService.sendEmail(dto.email, 'ClinicOS invitation', html);
    } catch (error: any) {
      this.logger.error(
        `Failed to send invitation email to ${dto.email}`,
        error,
      );
      if (process.env.NODE_ENV === 'dev') {
        this.logger.warn(
          `[DEV ONLY] Bypassing invitation email failure. Invitation token is: ${token}`,
        );
        return { userId: user._id, invitationToken: token };
      }
      await this.userModel.deleteOne({ _id: user._id });
      throw new BadRequestException(
        `Failed to send invitation email: ${error.message || 'unknown error'}`,
      );
    }

    return { userId: user._id, invitationToken: token };
  }

  async findAll(
    orgId: string,
    filters: { department?: string; role?: string; includeInactive?: boolean },
  ) {
    const query: any = {
      orgId,
      deletedAt: null,
      role: { $ne: 'superadmin' },
    };
    // Default behavior keeps the original "active only" filter for any
    // caller that doesn't opt in. The staff dashboard sets
    // includeInactive=true so admins can see deactivated users.
    if (!filters.includeInactive) {
      query.$or = [{ isActive: true }, { status: 'ACTIVE' }];
    }
    if (filters.department) query.department = filters.department;
    if (filters.role) query.role = filters.role;

    const [results, org] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password -invitationToken')
        .populate('department', 'name')
        .lean(),
      this.orgModel.findById(orgId).select({ ownerId: 1 }).lean(),
    ]);

    const ownerId = org?.ownerId ? String(org.ownerId) : null;
    return results.map((user: any) => ({
      ...user,
      isOrgOwner: ownerId !== null && String(user._id) === ownerId,
    }));
  }

  async findOne(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('-password -invitationToken')
      .populate('department')
      .lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email, deletedAt: null });
  }

  async findByInvitationToken(token: string) {
    return this.userModel.findOne({ invitationToken: token });
  }

  async update(id: string, dto: any) {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .select('-password -invitationToken');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updatePermissions(
    id: string,
    dto: UpdatePermissionsDto,
    actorId?: string,
  ) {
    const before = await this.userModel
      .findById(id)
      .select('permissionOverrides role');
    if (!before) throw new NotFoundException('User not found');

    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .select('-password -invitationToken');
    if (!user) throw new NotFoundException('User not found');

    this.logger.log(
      `[audit] permission.update actor=${actorId ?? 'unknown'} target=${id} role=${before.role} before=${JSON.stringify(before.permissionOverrides ?? {})} after=${JSON.stringify(dto.permissionOverrides ?? {})}`,
    );

    return user;
  }

  /**
   * Get user's permission configuration
   * Returns: role, roleDefaults, permissionOverrides, effectivePermissions
   */
  async getPermissions(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('-password -invitationToken');
    if (!user) throw new NotFoundException('User not found');

    const roleDefaults = getRoleDefaults(user.role);
    const effective = resolveEffectivePermissions({
      id: user._id.toString(),
      role: user.role,
      isActive: user.isActive,
      invitationStatus: user.invitationStatus,
      permissionOverrides: user.permissionOverrides,
    } as IUserForPermissions);

    return {
      role: user.role,
      roleDefaults,
      permissionOverrides: user.permissionOverrides ?? {},
      effectivePermissions: effective,
    };
  }

  /**
   * Reset user's permission overrides to role defaults
   */
  async resetPermissions(id: string, actorId?: string) {
    const before = await this.userModel
      .findById(id)
      .select('permissionOverrides role');
    if (!before) throw new NotFoundException('User not found');

    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { permissionOverrides: {} } },
        { new: true },
      )
      .select('-password -invitationToken');
    if (!user) throw new NotFoundException('User not found');

    this.logger.log(
      `[audit] permission.reset actor=${actorId ?? 'unknown'} target=${id} role=${before.role} cleared=${JSON.stringify(before.permissionOverrides ?? {})}`,
    );

    // Return updated permission config
    const roleDefaults = getRoleDefaults(user.role);
    const effective = resolveEffectivePermissions({
      id: user._id.toString(),
      role: user.role,
      isActive: user.isActive,
      invitationStatus: user.invitationStatus,
      permissionOverrides: {},
    } as IUserForPermissions);

    return {
      role: user.role,
      roleDefaults,
      permissionOverrides: {},
      effectivePermissions: effective,
    };
  }

  async softDelete(id: string) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { deletedAt: new Date(), isActive: false },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async restore(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (!user.deletedAt) throw new BadRequestException('User is not deleted');
    if ((Date.now() - user.deletedAt.getTime()) / 86400000 > 15)
      throw new BadRequestException('15-day recovery window expired');
    user.deletedAt = null as any;
    user.isActive = true;
    await user.save();
    return user;
  }

  async exportData(id: string) {
    const user = await this.userModel.findById(id).lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
