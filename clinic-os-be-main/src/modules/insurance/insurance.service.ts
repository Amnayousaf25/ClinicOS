import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  InsuranceProvider,
  InsuranceProviderDocument,
} from './schemas/insurance-provider.schema';
import {
  CreateInsuranceProviderDto,
  UpdateInsuranceProviderDto,
} from './dto/create-insurance-provider.dto';

@Injectable()
export class InsuranceService {
  constructor(
    @InjectModel(InsuranceProvider.name)
    private insuranceModel: Model<InsuranceProviderDocument>,
  ) {}

  async findAllByOrg(orgId: string): Promise<InsuranceProviderDocument[]> {
    return this.insuranceModel
      .find({ orgId: new Types.ObjectId(orgId) })
      .sort({ name: 1 })
      .exec();
  }

  async findById(
    orgId: string,
    id: string,
  ): Promise<InsuranceProviderDocument> {
    const doc = await this.insuranceModel.findOne({
      _id: id,
      orgId: new Types.ObjectId(orgId),
    });
    if (!doc) throw new NotFoundException('Insurance provider not found');
    return doc;
  }

  async create(
    orgId: string,
    dto: CreateInsuranceProviderDto,
  ): Promise<InsuranceProviderDocument> {
    const oid = new Types.ObjectId(orgId);
    try {
      return await this.insuranceModel.create({ orgId: oid, ...dto });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new ConflictException(
          'Insurance provider with this name already exists',
        );
      }
      throw error;
    }
  }

  async update(
    orgId: string,
    id: string,
    dto: UpdateInsuranceProviderDto,
  ): Promise<InsuranceProviderDocument> {
    const doc = await this.findById(orgId, id);
    Object.assign(doc, dto);
    try {
      return await doc.save();
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new ConflictException(
          'Insurance provider with this name already exists',
        );
      }
      throw error;
    }
  }

  async remove(orgId: string, id: string): Promise<void> {
    const doc = await this.findById(orgId, id);
    await doc.deleteOne();
  }
}
