import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  Organization,
  OrganizationDocument,
} from './schemas/organization.schema';
import { User } from 'src/modules/users/schemas/user.schema';
import { Department } from 'src/modules/departments/schemas/department.schema';
import { UserRole, InvitationStatus } from 'src/modules/users/types/user.types';
import { DEFAULT_DEPARTMENTS } from 'src/seeds/default-departments';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateFirstAdminDto } from './dto/create-first-admin.dto';
import { PERMISSIONS, getRoleDefaults } from 'src/common/permissions';

const EDITABLE_ROLE_IDS = ['admin', 'manager', 'employee', 'staff'] as const;

const PERMISSION_KEYS = new Set<string>(Object.values(PERMISSIONS));

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private orgModel: Model<OrganizationDocument>,
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Department.name)
    private departmentModel: Model<Department>,
  ) {}

  async create(dto: CreateOrganizationDto): Promise<OrganizationDocument> {
    const existing = await this.orgModel.findOne({ slug: dto.slug });
    if (existing)
      throw new ConflictException('Organization slug already exists');
    const org = await this.orgModel.create(dto);

    await this.seedDefaultDepartments(org._id.toString());

    return org;
  }

  async seedDefaultDepartments(orgId: string): Promise<number> {
    const docs = DEFAULT_DEPARTMENTS.map((name) => ({
      orgId: new Types.ObjectId(orgId),
      name,
      managers: [],
      isActive: true,
    }));
    try {
      const result = await this.departmentModel.insertMany(docs, {
        ordered: false,
      });
      return result.length;
    } catch (err: any) {
      if (err?.code === 11000 || err?.writeErrors) {
        return err?.insertedDocs?.length ?? 0;
      }
      throw err;
    }
  }

  async findAll(): Promise<
    Array<Record<string, unknown> & { userCount: number }>
  > {
    const orgs = await this.orgModel.find().sort({ createdAt: -1 }).lean();
    const results = await Promise.all(
      orgs.map(async (org) => {
        const userCount = await this.userModel.countDocuments({
          orgId: org._id,
          deletedAt: null,
        });
        return { ...org, userCount };
      }),
    );
    return results;
  }

  async findById(id: string): Promise<OrganizationDocument> {
    const org = await this.orgModel.findById(id);
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findBySlug(slug: string): Promise<OrganizationDocument> {
    const org = await this.orgModel.findOne({ slug });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationDocument> {
    const org = await this.orgModel.findByIdAndUpdate(id, dto, { new: true });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async deactivate(id: string): Promise<OrganizationDocument> {
    return this.update(id, { isActive: false });
  }

  async createFirstAdmin(orgId: string, dto: CreateFirstAdminDto) {
    const org = await this.orgModel.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found');

    const oid = new Types.ObjectId(orgId);
    const existing = await this.userModel.findOne({
      orgId: oid,
      email: dto.email,
    });
    if (existing)
      throw new ConflictException(
        'Email already registered in this organization',
      );

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      orgId: oid,
      name: dto.name,
      email: dto.email,
      employeeId: dto.employeeId,
      password: hashedPassword,
      role: (dto as any).role || UserRole.Admin,
      invitationStatus: InvitationStatus.Accepted,
      isActive: true,
    });

    const obj = (user as any).toObject();
    delete obj.password;
    return obj;
  }

  async getOrgUsers(orgId: string) {
    const org = await this.orgModel.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found');

    const oid = new Types.ObjectId(orgId);
    return this.userModel
      .find({ orgId: oid, deletedAt: null })
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getOrgStats(orgId: string) {
    const org = await this.orgModel.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found');

    const oid = new Types.ObjectId(orgId);
    const userCount = await this.userModel.countDocuments({
      orgId: oid,
      deletedAt: null,
    });

    return { userCount };
  }

  async getRoleDefaults(orgId: string) {
    const org = await this.orgModel
      .findById(orgId)
      .select({ roleDefaultOverrides: 1 })
      .lean();
    if (!org) throw new NotFoundException('Organization not found');

    const overrides = (org.roleDefaultOverrides ?? {}) as Record<
      string,
      Record<string, boolean>
    >;

    const effective: Record<string, Record<string, boolean>> = {};
    for (const role of EDITABLE_ROLE_IDS) {
      effective[role] = {
        ...getRoleDefaults(role),
        ...(overrides[role] ?? {}),
      };
    }

    return {
      editableRoles: [...EDITABLE_ROLE_IDS],
      overrides: Object.fromEntries(
        EDITABLE_ROLE_IDS.map((role) => [role, overrides[role] ?? {}]),
      ),
      effective,
    };
  }

  async updateRoleDefaults(
    orgId: string,
    next: Record<string, Record<string, boolean>>,
  ) {
    const sanitized: Record<string, Record<string, boolean>> = {};
    for (const role of EDITABLE_ROLE_IDS) {
      const incoming = next?.[role];
      if (!incoming || typeof incoming !== 'object') continue;
      const cleanEntries: [string, boolean][] = [];
      for (const [key, value] of Object.entries(incoming)) {
        if (!PERMISSION_KEYS.has(key)) continue;
        if (typeof value !== 'boolean') continue;
        cleanEntries.push([key, value]);
      }
      if (cleanEntries.length > 0) {
        sanitized[role] = Object.fromEntries(cleanEntries);
      }
    }

    const org = await this.orgModel.findByIdAndUpdate(
      orgId,
      { $set: { roleDefaultOverrides: sanitized } },
      { new: true },
    );
    if (!org) throw new NotFoundException('Organization not found');

    return this.getRoleDefaults(orgId);
  }
}
