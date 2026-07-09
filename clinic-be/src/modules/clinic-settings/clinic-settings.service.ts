import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  normalizeTimeKey,
  normalizeUtcDateKey,
} from 'src/common/utils/date.util';
import {
  ClinicSettings,
  ClinicSettingsDocument,
} from './schemas/clinic-settings.schema';
import { UpdateClinicSettingsDto } from './dto/update-settings.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { BlockSlotDto } from './dto/block-slot.dto';

@Injectable()
export class ClinicSettingsService {
  constructor(
    @InjectModel(ClinicSettings.name)
    private settingsModel: Model<ClinicSettingsDocument>,
  ) {}

  async getOrCreate(
    orgId: string | Types.ObjectId,
  ): Promise<ClinicSettingsDocument> {
    const oid = new Types.ObjectId(orgId);
    let settings = await this.settingsModel.findOne({ orgId: oid });
    if (!settings) {
      settings = await this.settingsModel.create({ orgId: oid });
    }
    return settings;
  }

  async getPublic(orgId: string | Types.ObjectId) {
    const settings = await this.getOrCreate(orgId);
    return {
      clinicName: settings.clinicName,
      phone: settings.phone,
      email: settings.email,
      address: settings.address,
      logoUrl: settings.logoUrl,
    };
  }

  async update(
    orgId: string,
    dto: UpdateClinicSettingsDto,
  ): Promise<ClinicSettingsDocument> {
    const settings = await this.getOrCreate(orgId);
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        settings[key] = value;
      }
    }
    return settings.save();
  }

  async updateAvailability(
    orgId: string,
    dto: UpdateAvailabilityDto,
  ): Promise<ClinicSettingsDocument> {
    const settings = await this.getOrCreate(orgId);
    const current = settings.availability || {};
    for (const [day, schedule] of Object.entries(dto)) {
      if (schedule) {
        current[day] = schedule;
      }
    }
    settings.availability = current;
    settings.markModified('availability');
    return settings.save();
  }

  async blockSlot(
    orgId: string,
    dto: BlockSlotDto,
  ): Promise<ClinicSettingsDocument> {
    const settings = await this.getOrCreate(orgId);

    const normalizedDate = normalizeUtcDateKey(dto.date);
    const normalizedTime = normalizeTimeKey(dto.time);
    if (!normalizedDate || !normalizedTime) {
      throw new BadRequestException('Invalid date or time format');
    }

    const exists = settings.blockedSlots.some(
      (s) => s.date === normalizedDate && s.time === normalizedTime,
    );
    if (!exists) {
      settings.blockedSlots.push({
        date: normalizedDate,
        time: normalizedTime,
      });
      settings.markModified('blockedSlots');
      await settings.save();
    }
    return settings;
  }

  async unblockSlot(
    orgId: string,
    dto: BlockSlotDto,
  ): Promise<ClinicSettingsDocument> {
    const settings = await this.getOrCreate(orgId);

    const normalizedDate = normalizeUtcDateKey(dto.date);
    const normalizedTime = normalizeTimeKey(dto.time);
    if (!normalizedDate || !normalizedTime) {
      throw new BadRequestException('Invalid date or time format');
    }

    settings.blockedSlots = settings.blockedSlots.filter(
      (s) => !(s.date === normalizedDate && s.time === normalizedTime),
    );
    settings.markModified('blockedSlots');
    return settings.save();
  }
}
