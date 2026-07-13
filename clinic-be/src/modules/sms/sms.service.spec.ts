import { SmsService } from './sms.service';

describe('SmsService', () => {
  const lifetime = {
    isConfigured: true,
    send: jest.fn().mockResolvedValue({ success: true, sid: 'life-1' }),
  };
  const telnyx = {
    isConfigured: true,
    send: jest.fn().mockResolvedValue({ success: true, sid: 'tel-1' }),
    schedule: jest.fn().mockResolvedValue({ success: true, sid: 'tel-sch-1' }),
    cancelScheduled: jest.fn(),
  };
  const config = {
    get: jest.fn().mockReturnValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes Pakistan local mobile numbers through LifetimeSMS as E.164', async () => {
    const service = new SmsService(lifetime as any, telnyx as any, config as any);

    await service.sendSms('0300 1234567', 'hello');

    expect(lifetime.send).toHaveBeenCalledWith('+923001234567', 'hello');
    expect(telnyx.send).not.toHaveBeenCalled();
  });

  it('routes Pakistan numbers without plus through LifetimeSMS', async () => {
    const service = new SmsService(lifetime as any, telnyx as any, config as any);

    await service.sendSms('923001234567', 'hello');

    expect(lifetime.send).toHaveBeenCalledWith('+923001234567', 'hello');
    expect(telnyx.send).not.toHaveBeenCalled();
  });

  it('normalizes 00-prefixed numbers before sending through Telnyx', async () => {
    const service = new SmsService(lifetime as any, telnyx as any, config as any);

    await service.sendSms('0061400111222', 'hello');

    expect(telnyx.send).toHaveBeenCalledWith('+61400111222', 'hello');
  });

  it('does not fall back to Telnyx for Pakistan numbers when LifetimeSMS is missing', async () => {
    const service = new SmsService(
      { ...lifetime, isConfigured: false } as any,
      telnyx as any,
      config as any,
    );

    const result = await service.sendSms('+923001234567', 'hello');

    expect(result).toEqual({
      success: false,
      error: 'lifetime_not_configured',
    });
    expect(telnyx.send).not.toHaveBeenCalled();
  });

  it('routes non-Pakistan numbers through Telnyx', async () => {
    const service = new SmsService(lifetime as any, telnyx as any, config as any);

    await service.sendSms('61400111222', 'hello');

    expect(telnyx.send).toHaveBeenCalledWith('61400111222', 'hello');
    expect(lifetime.send).not.toHaveBeenCalled();
  });

  it('does not schedule Pakistan local mobile numbers through Telnyx', async () => {
    const service = new SmsService(lifetime as any, telnyx as any, config as any);
    const sendAt = new Date(Date.now() + 10 * 60 * 1000);

    const result = await service.scheduleSms('03001234567', 'hello', sendAt);

    expect(result).toEqual({
      success: false,
      scheduled: false,
      error: 'no_scheduling_for_pk',
    });
    expect(telnyx.schedule).not.toHaveBeenCalled();
  });
});
