import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SubmitIntakeDto } from './submit-intake.dto';

describe('SubmitIntakeDto', () => {
  const validPayload = {
    name: 'Jane Doe',
    dob: '1990-01-01',
    phone: '+14155552671',
    email: 'jane@example.com',
    reasonForVisit: 'Consultation about recurring migraines',
    consent: true,
  };

  it('should reject consent=false', async () => {
    const dto = plainToInstance(SubmitIntakeDto, {
      ...validPayload,
      consent: false,
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const consentError = errors.find((error) => error.property === 'consent');
    expect(consentError?.constraints?.equals).toBe('Consent must be given');
  });

  it('should pass validation when consent=true', async () => {
    const dto = plainToInstance(SubmitIntakeDto, validPayload);

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
