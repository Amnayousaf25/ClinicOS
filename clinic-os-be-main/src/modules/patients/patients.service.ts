import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Patient, PatientDocument } from './schemas/patient.schema';
import { Counter, CounterDocument } from './schemas/counter.schema';
import {
  Appointment,
  AppointmentDocument,
} from 'src/modules/appointments/schemas/appointment.schema';

const MRN_PREFIX = 'P-';
const MRN_PAD = 6;
const MRN_SCOPE = 'patient';

export type CreatePatientInput = {
  orgId: Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  dob?: string;
  address?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  allergies?: string;
  medications?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
};

export type UpdatePatientInput = Partial<Omit<CreatePatientInput, 'orgId'>>;

@Injectable()
export class PatientsService implements OnModuleInit {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    @InjectModel(Patient.name)
    private patientModel: Model<PatientDocument>,
    @InjectModel(Counter.name)
    private counterModel: Model<CounterDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
  ) {}

  async onModuleInit() {
    try {
      await this.dropObsoletePatientIndexes();
    } catch (err) {
      this.logger.warn(`Patient index cleanup failed: ${String(err)}`);
    }
    try {
      const sanitized = await this.sanitizeLegacyRefs();
      if (sanitized.providerNullified || sanitized.serviceNullified) {
        this.logger.log(`Sanitized legacy refs: ${JSON.stringify(sanitized)}`);
      }
    } catch (err) {
      this.logger.warn(`Legacy ref sanitization failed: ${String(err)}`);
    }
  }

  /**
   * Drop indexes that the Mongoose schema no longer declares but Mongo
   * still has from earlier versions. Mongoose creates new indexes
   * automatically, but it never removes obsolete ones — over a schema
   * lifetime this leaves stale unique constraints that crash inserts.
   *
   * Specifically: phone was unique in the original schema, then we
   * intentionally relaxed that (phones change, and multiple patients can
   * legitimately share a number — couples, parent-child, roommates). The
   * schema is right; the DB just hasn't caught up.
   */
  private async dropObsoletePatientIndexes(): Promise<void> {
    const obsoleteNames = ['orgId_1_phone_1'];
    const indexes = await this.patientModel.collection.indexes();
    for (const obsolete of obsoleteNames) {
      const present = indexes.some((idx) => idx.name === obsolete);
      if (!present) continue;
      await this.patientModel.collection.dropIndex(obsolete);
      this.logger.log(
        `Dropped obsolete patients index: ${obsolete} (no longer in schema)`,
      );
    }
  }

  private async nextMrn(orgId: Types.ObjectId): Promise<string> {
    const c = await this.counterModel.findOneAndUpdate(
      { orgId, scope: MRN_SCOPE },
      { $inc: { seq: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return `${MRN_PREFIX}${String(c.seq).padStart(MRN_PAD, '0')}`;
  }

  /**
   * Create a brand-new patient and assign an MRN. Caller is responsible for
   * confirming the patient is genuinely new (i.e. ran a search and got no
   * acceptable match). Never call this on the silent-upsert path.
   *
   * Retries on E11000 against the {orgId, mrn} unique index — covers the
   * case where the counter drifted out of sync with existing patient rows
   * (counter wiped but patients kept, etc).
   */
  async createPatient(input: CreatePatientInput): Promise<PatientDocument> {
    if (!input.name || !input.name.trim()) {
      throw new BadRequestException('Patient name is required');
    }

    const baseDoc = {
      orgId: input.orgId,
      name: input.name.trim(),
      phone: input.phone?.trim() || '',
      email: input.email?.trim() || '',
      dob: input.dob || '',
      address: input.address || '',
      insuranceProvider: input.insuranceProvider || '',
      insuranceNumber: input.insuranceNumber || '',
      allergies: input.allergies || '',
      medications: input.medications || '',
      emergencyContact: input.emergencyContact || '',
      emergencyPhone: input.emergencyPhone || '',
      lastVisitAt: new Date(),
    };

    const MAX_ATTEMPTS = 5;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const mrn = await this.nextMrn(input.orgId);
      try {
        return await this.patientModel.create({ ...baseDoc, mrn });
      } catch (err: unknown) {
        const code = (err as { code?: number })?.code;
        if (code === 11000 && attempt < MAX_ATTEMPTS) {
          this.logger.warn(
            `MRN ${mrn} collided on insert (org ${String(input.orgId)}); retrying with next sequence (attempt ${attempt}/${MAX_ATTEMPTS})`,
          );
          continue;
        }
        throw err;
      }
    }
    throw new ConflictException(
      'Could not allocate a unique MRN after multiple attempts',
    );
  }

  /**
   * Update an existing patient. If `phone` differs from the current value,
   * the current value is appended to `phoneHistory` before overwriting.
   * Empty-string fields are ignored — they don't blank out existing values.
   */
  async updatePatient(
    orgId: Types.ObjectId,
    patientId: string | Types.ObjectId,
    patch: UpdatePatientInput,
  ): Promise<PatientDocument> {
    const id =
      typeof patientId === 'string' ? new Types.ObjectId(patientId) : patientId;
    const patient = await this.patientModel.findOne({ _id: id, orgId });
    if (!patient) throw new NotFoundException('Patient not found');

    const set: Record<string, unknown> = {};
    const setIfPresent: Array<keyof UpdatePatientInput> = [
      'name',
      'email',
      'dob',
      'address',
      'insuranceProvider',
      'insuranceNumber',
      'allergies',
      'medications',
      'emergencyContact',
      'emergencyPhone',
    ];
    for (const k of setIfPresent) {
      const v = patch[k];
      if (typeof v === 'string' && v.length > 0) {
        set[k] = v;
      }
    }

    const newPhone = patch.phone?.trim();
    const push: Record<string, unknown> = {};
    if (newPhone && newPhone !== patient.phone) {
      if (patient.phone) {
        push.phoneHistory = { phone: patient.phone, changedAt: new Date() };
      }
      set.phone = newPhone;
    }

    set.lastVisitAt = new Date();

    const update: Record<string, unknown> = { $set: set };
    if (Object.keys(push).length) update.$push = push;

    const updated = await this.patientModel.findOneAndUpdate(
      { _id: id, orgId },
      update,
      { new: true },
    );
    return updated as PatientDocument;
  }

  /**
   * Find-by-phone-AND-name or create. Used only on flows that have no
   * disambiguation UI (public booking). Matching on phone alone is
   * incorrect — one phone can legitimately belong to many patients
   * (a parent booking for multiple children, couples sharing a number).
   *
   * The combined phone + name (case-insensitive, trimmed) match catches
   * the "same person booking again" case without merging different family
   * members onto the same patient record. If only the phone matches but
   * the name differs, we treat it as a new patient — a fresh MRN.
   *
   * Authenticated flows should prefer the explicit createPatient /
   * updatePatient pair driven by user choice in the UI.
   */
  async findByPhoneAndNameOrCreate(
    input: CreatePatientInput,
  ): Promise<PatientDocument> {
    const phone = input.phone?.trim();
    const name = input.name?.trim();
    if (phone && name) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await this.patientModel.findOne({
        orgId: input.orgId,
        phone,
        name: { $regex: `^${escaped}$`, $options: 'i' },
      });
      if (existing) return existing;
    }
    return this.createPatient(input);
  }

  async search(orgId: string, query: string, limit = 10) {
    const oid = new Types.ObjectId(orgId);
    const q = (query || '').trim();
    if (!q) return [];

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(escaped, 'i');

    return this.patientModel
      .find({
        orgId: oid,
        $or: [
          { mrn: rx },
          { name: rx },
          { phone: rx },
          { 'phoneHistory.phone': rx },
          { email: rx },
        ],
      })
      .sort({ lastVisitAt: -1, updatedAt: -1 })
      .limit(limit)
      .exec();
  }

  async findById(orgId: string, id: string): Promise<PatientDocument> {
    const p = await this.patientModel.findOne({
      _id: id,
      orgId: new Types.ObjectId(orgId),
    });
    if (!p) throw new NotFoundException('Patient not found');
    return p;
  }

  async findByPhone(
    orgId: string | Types.ObjectId,
    phone: string,
  ): Promise<PatientDocument | null> {
    const oid = typeof orgId === 'string' ? new Types.ObjectId(orgId) : orgId;
    return this.patientModel.findOne({ orgId: oid, phone });
  }

  /**
   * One-time backfill: assign MRNs to any patients missing one (legacy
   * rows from before MRN existed). Idempotent.
   */
  async backfillMrns(): Promise<{ assigned: number }> {
    const cursor = this.patientModel
      .find({ $or: [{ mrn: { $exists: false } }, { mrn: '' }] })
      .cursor();
    let assigned = 0;
    for await (const p of cursor) {
      const mrn = await this.nextMrn(p.orgId);
      p.mrn = mrn;
      await p.save();
      assigned += 1;
    }
    return { assigned };
  }

  /**
   * Sanitize legacy appointments where providerId or serviceId is a
   * non-ObjectId string (e.g. seed values like "p2"). Sets them to null
   * so the schema's ref: 'Provider' / 'Service' doesn't crash on cast.
   * Idempotent.
   */
  async sanitizeLegacyRefs(): Promise<{
    providerNullified: number;
    serviceNullified: number;
  }> {
    const isObjectIdLike = /^[a-f0-9]{24}$/i;
    const cursor = this.appointmentModel.collection.find({});
    let providerNullified = 0;
    let serviceNullified = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) continue;
      const update: Record<string, unknown> = {};
      const provider = doc.providerId;
      if (
        provider !== null &&
        provider !== undefined &&
        typeof provider === 'string' &&
        !isObjectIdLike.test(provider)
      ) {
        update.providerId = null;
        providerNullified += 1;
      }
      const service = doc.serviceId;
      if (
        service !== null &&
        service !== undefined &&
        typeof service === 'string' &&
        !isObjectIdLike.test(service)
      ) {
        update.serviceId = null;
        serviceNullified += 1;
      }
      if (Object.keys(update).length > 0) {
        await this.appointmentModel.collection.updateOne(
          { _id: doc._id },
          { $set: update },
        );
      }
    }
    return { providerNullified, serviceNullified };
  }

  /**
   * Backfill Patient records from legacy appointments that still carry
   * inline patientName/Phone/Email but no patientId. Idempotent.
   * Runs by phone deduplication — appointments sharing a phone get the
   * same Patient row and MRN.
   */
  async backfillFromAppointments(): Promise<{
    scanned: number;
    created: number;
    linked: number;
  }> {
    const cursor = this.appointmentModel
      .find({ patientId: null })
      .lean<{
        _id: Types.ObjectId;
        orgId: Types.ObjectId;
        patientName?: string;
        patientPhone?: string;
        patientEmail?: string;
      }>()
      .cursor();

    let scanned = 0;
    let created = 0;
    let linked = 0;

    for await (const apt of cursor) {
      scanned += 1;
      const phone = (apt.patientPhone || '').trim();
      const name = apt.patientName;
      if (!phone || !name) continue;

      const existing = await this.patientModel.findOne({
        orgId: apt.orgId,
        phone,
      });
      const patient: PatientDocument =
        existing ??
        (await this.createPatient({
          orgId: apt.orgId,
          phone,
          name,
          email: apt.patientEmail || '',
        }));
      if (!existing) created += 1;

      await this.appointmentModel.updateOne(
        { _id: apt._id },
        { $set: { patientId: patient._id } },
      );
      linked += 1;
    }

    return { scanned, created, linked };
  }
}
