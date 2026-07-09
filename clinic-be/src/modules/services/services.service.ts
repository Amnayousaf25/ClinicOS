import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Service, ServiceDocument } from './schemas/service.schema';
import { CreateServiceDto, UpdateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
  ) {}

  async findAllByOrg(
    orgId: string | Types.ObjectId,
  ): Promise<ServiceDocument[]> {
    return this.serviceModel
      .find({ orgId: new Types.ObjectId(orgId) })
      .sort({ name: 1 })
      .exec();
  }

  async findActiveByOrg(
    orgId: string | Types.ObjectId,
  ): Promise<ServiceDocument[]> {
    return this.serviceModel
      .find({ orgId: new Types.ObjectId(orgId), isActive: true })
      .sort({ name: 1 })
      .exec();
  }

  async findById(orgId: string, id: string): Promise<ServiceDocument> {
    const service = await this.serviceModel.findOne({
      _id: id,
      orgId: new Types.ObjectId(orgId),
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async create(orgId: string, dto: CreateServiceDto): Promise<ServiceDocument> {
    const oid = new Types.ObjectId(orgId);
    const existing = await this.serviceModel.findOne({
      orgId: oid,
      name: dto.name,
    });
    if (existing)
      throw new ConflictException('Service with this name already exists');

    try {
      return await this.serviceModel.create({ orgId: oid, ...dto });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new ConflictException('Service with this name already exists');
      }
      throw error;
    }
  }

  async update(
    orgId: string,
    id: string,
    dto: UpdateServiceDto,
  ): Promise<ServiceDocument> {
    const service = await this.findById(orgId, id);
    if (dto.name && dto.name !== service.name) {
      const existing = await this.serviceModel.findOne({
        orgId: service.orgId,
        name: dto.name,
        _id: { $ne: service._id },
      });
      if (existing)
        throw new ConflictException('Service with this name already exists');
    }
    Object.assign(service, dto);
    try {
      return await service.save();
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new ConflictException('Service with this name already exists');
      }
      throw error;
    }
  }

  async remove(orgId: string, id: string): Promise<void> {
    const service = await this.findById(orgId, id);
    await service.deleteOne();
  }
}
