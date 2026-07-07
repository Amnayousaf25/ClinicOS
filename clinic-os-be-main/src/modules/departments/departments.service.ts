import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department } from './schemas/department.schema';
import { CreateDepartmentDto } from './dto/create-department.dto';
import {
  DEFAULT_DEPARTMENT_NAMES,
  RETIRED_DEPARTMENT_NAMES,
} from './constants/department.constants';

@Injectable()
export class DepartmentsService implements OnModuleInit {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(
    @InjectModel(Department.name) private departmentModel: Model<Department>,
  ) {}

  async onModuleInit() {
    try {
      const ops = DEFAULT_DEPARTMENT_NAMES.map((name) => ({
        updateOne: {
          filter: { name },
          update: { $setOnInsert: { name, managers: [], isActive: true } },
          upsert: true,
        },
      }));
      const result = await this.departmentModel.bulkWrite(ops);
      const inserted = result.upsertedCount ?? 0;
      if (inserted > 0) {
        this.logger.log(`Seeded ${inserted} default department(s)`);
      }

      if (RETIRED_DEPARTMENT_NAMES.length > 0) {
        const retired = await this.departmentModel.updateMany(
          { name: { $in: RETIRED_DEPARTMENT_NAMES }, isActive: true },
          { $set: { isActive: false } },
        );
        if (retired.modifiedCount > 0) {
          this.logger.log(
            `Retired ${retired.modifiedCount} deprecated department(s): ${RETIRED_DEPARTMENT_NAMES.join(', ')}`,
          );
        }
      }
    } catch (err: any) {
      this.logger.warn(`Department seed skipped: ${err?.message || err}`);
    }
  }

  async findAll(orgId: string) {
    return this.departmentModel
      .find({ orgId, isActive: true })
      .sort({ name: 1 })
      .lean();
  }

  async create(orgId: string, dto: CreateDepartmentDto) {
    if (await this.departmentModel.findOne({ orgId, name: dto.name }))
      throw new BadRequestException('Department name already exists');
    return this.departmentModel.create({ orgId, ...dto });
  }

  async update(orgId: string, id: string, dto: CreateDepartmentDto) {
    const d = await this.departmentModel.findOneAndUpdate(
      { _id: id, orgId },
      dto,
      { new: true },
    );
    if (!d) throw new NotFoundException('Department not found');
    return d;
  }

  async remove(orgId: string, id: string) {
    const d = await this.departmentModel.findOneAndUpdate(
      { _id: id, orgId },
      { isActive: false },
      { new: true },
    );
    if (!d) throw new NotFoundException('Department not found');
    return d;
  }
}
