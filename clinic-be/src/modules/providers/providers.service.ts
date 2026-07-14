import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Provider, ProviderDocument } from './schemas/provider.schema';
import {
  CreateProviderDto,
  UpdateProviderDto,
} from './dto/create-provider.dto';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectModel(Provider.name)
    private providerModel: Model<ProviderDocument>,
  ) {}

  async findAllByOrg(orgId: string, serviceId?: string): Promise<ProviderDocument[]> {
    const filter: any = { orgId: new Types.ObjectId(orgId) };
    if (serviceId && serviceId !== 'all') {
      if (Types.ObjectId.isValid(serviceId)) {
        filter.serviceId = new Types.ObjectId(serviceId);
      }
    }
    return this.providerModel
      .find(filter)
      .populate('serviceId', 'name')
      .sort({ name: 1 })
      .exec();
  }

  async findById(orgId: string, id: string): Promise<ProviderDocument> {
    const provider = await this.providerModel.findOne({
      _id: id,
      orgId: new Types.ObjectId(orgId),
    });
    if (!provider) throw new NotFoundException('Provider not found');
    return provider;
  }

  async create(
    orgId: string,
    dto: CreateProviderDto,
  ): Promise<ProviderDocument> {
    const oid = new Types.ObjectId(orgId);
    try {
      return await this.providerModel.create({ orgId: oid, ...dto });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new ConflictException('Provider with this name already exists');
      }
      throw error;
    }
  }

  async update(
    orgId: string,
    id: string,
    dto: UpdateProviderDto,
  ): Promise<ProviderDocument> {
    const provider = await this.findById(orgId, id);
    Object.assign(provider, dto);
    try {
      return await provider.save();
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new ConflictException('Provider with this name already exists');
      }
      throw error;
    }
  }

  async remove(orgId: string, id: string): Promise<void> {
    const provider = await this.findById(orgId, id);
    await provider.deleteOne();
  }
}
