import type { Page, Route } from '@playwright/test';
import dayjs from 'dayjs';

const today = dayjs().format('YYYY-MM-DD');

export const services = [
  { _id: 'svc-1', name: 'Consultation', duration: 30, price: 75, category: 'General' },
];

export const providers = [
  { _id: 'prov-1', name: 'Dr Smith', title: 'Physician', serviceId: 'svc-1' },
];

export const patients = [
  {
    _id: 'pat-1',
    mrn: 'P-000001',
    name: 'Jane Patient',
    phone: '+61400000000',
    email: 'jane@example.com',
    dob: '1990-01-15',
    address: '1 Clinic Way',
  },
];

export const appointments = [
  {
    _id: 'apt-1',
    patientId: patients[0],
    serviceId: services[0],
    providerId: providers[0],
    patientName: 'Jane Patient',
    patientPhone: '+61400000000',
    patientEmail: 'jane@example.com',
    service: 'Consultation',
    provider: 'Dr Smith',
    date: today,
    time: '09:00',
    status: 'confirmed',
    intakeStatus: 'submitted',
  },
  {
    _id: 'apt-2',
    patientId: patients[0],
    serviceId: services[0],
    providerId: providers[0],
    patientName: 'Pending Patient',
    patientPhone: '+61411111111',
    patientEmail: 'pending@example.com',
    service: 'Consultation',
    provider: 'Dr Smith',
    date: today,
    time: '10:00',
    status: 'pending',
    intakeStatus: 'pending',
  },
];

export const reminderConfigs = [
  { _id: 'rc-1', type: 'confirmation', label: 'Confirmation', enabled: true, message: 'Hi {name}, your appt on {date} at {time} is confirmed.' },
  { _id: 'rc-2', type: '24h', label: '24h Reminder', enabled: true, message: 'Reminder: your appt is tomorrow at {time}.' },
  { _id: 'rc-3', type: '2h', label: '2h Reminder', enabled: false, message: 'Your appt is in 2 hours. See you soon!' },
];

export const reminderLog = [
  { _id: 'log-1', appointmentId: 'apt-1', patientName: 'Jane Patient', patientPhone: '+61400000000', type: 'confirmation', body: 'Hi Jane, your appt on 2026-07-01 at 09:00 is confirmed.', status: 'sent', sentAt: '2026-07-01T01:00:00Z', reply: 'YES' },
  { _id: 'log-2', appointmentId: 'apt-2', patientName: 'Pending Patient', patientPhone: '+61411111111', type: '24h', body: 'Reminder: your appt is tomorrow at 10:00.', status: 'scheduled', scheduledFor: '2026-06-30T02:00:00Z' },
];

const settings = {
  clinicName: 'Clinic',
  workingHours: { start: '00:00', end: '23:59' },
  workingDays: [1, 2, 3, 4, 5],
  slotDuration: 30,
  timeFormat: '24',
  blockedSlots: [{ _id: 'block-1', date: today, time: '10:30' }],
  smsTemplates: { confirmation: '', reminder24h: '', reminder2h: '' },
  enabledReminders: { confirmation: true, reminder24h: true, reminder2h: true },
};

const json = (route: Route, data: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ data }),
  });

export async function mockAuthedApi(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('clinicos_token', 'e2e-token');
  });

  await page.route('**/api/v1/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace('/api/v1', '');
    const method = req.method();

    if (path === '/auth/me') {
      return json(route, {
        user: {
          _id: 'u-admin',
          name: 'Admin',
          email: 'admin@example.com',
          role: 'admin',
          orgId: 'org-1',
        },
      });
    }
    if (path === '/clinic-settings' && method === 'GET') return json(route, settings);
    if (path === '/clinic-settings' && method === 'PATCH') return json(route, settings);
    if (path === '/clinic-settings/block-slot') return json(route, {});
    if (path === '/services' && method === 'GET') return json(route, services);
    if (path === '/services' && method === 'POST') return json(route, services[0]);
    if (path.startsWith('/services/')) return json(route, services[0]);
    if (path === '/providers' && method === 'GET') return json(route, providers);
    if (path === '/providers' && method === 'POST') return json(route, providers[0]);
    if (path.startsWith('/providers/')) return json(route, providers[0]);
    if (path === '/insurance-providers' && method === 'GET') {
      return json(route, [{ _id: 'ins-1', name: 'Aetna' }]);
    }
    if (path === '/insurance-providers' && method === 'POST') {
      return json(route, { _id: 'ins-2', name: 'Blue Cross' });
    }
    if (path.startsWith('/insurance-providers/')) return json(route, {});
    if (path === '/appointments' && method === 'GET') return json(route, appointments);
    if (path === '/appointments' && method === 'POST') return json(route, appointments[1]);
    if (path === '/patients/search') return json(route, patients);
    if (path === '/patients' && method === 'POST') return json(route, patients[0]);
    if (path === '/patients/pat-1') return json(route, patients[0]);
    if (path.startsWith('/patients/')) return json(route, patients[0]);
    if (path === '/users') {
      return json(route, [
        {
          _id: 'u-admin',
          name: 'Admin',
          email: 'admin@example.com',
          employeeId: 'EMP-001',
          role: 'admin',
          isActive: true,
        },
        {
          _id: 'u-staff',
          name: 'Staff User',
          email: 'staff@example.com',
          employeeId: 'EMP-002',
          role: 'staff',
          isActive: false,
        },
      ]);
    }
    if (path === '/users/invite') return json(route, {});
    if (path.startsWith('/users/')) return json(route, {});
    if (path === '/media/upload') return json(route, { id: 'm-1', key: 'staff/photo.png' });
    if (path === '/intake/apt-1') {
      return json(route, {
        appointmentId: 'apt-1',
        patientName: 'Jane Patient',
        patientPhone: '+61400000000',
        patientEmail: 'jane@example.com',
        service: 'Consultation',
        date: today,
        time: '09:00',
        clinicName: 'Clinic',
        intakeFormSubmitted: false,
        insuranceProviders: ['Aetna', 'Blue Cross'],
      });
    }
    if (path === '/intake/apt-1/submission') {
      return json(route, {
        _id: 'intake-1',
        appointmentId: 'apt-1',
        name: 'Jane Patient',
        dob: '1990-01-15',
        phone: '+61400000000',
        email: 'jane@example.com',
        reasonForVisit: 'Checkup',
        consent: true,
        insuranceProvider: 'Aetna',
      });
    }
    if (path === '/intake') return json(route, { _id: 'intake-2', appointmentId: 'apt-2' });
    if (path.endsWith('/submission')) return json(route, {});
    if (path === '/reminders/configs' && method === 'GET') return json(route, reminderConfigs);
    if (path.match(/^\/reminders\/configs\/.+/) && method === 'PATCH') {
      const id = path.split('/').pop()!;
      const body = JSON.parse(req.postData() || '{}');
      return json(route, { ...reminderConfigs.find((c) => c._id === id), ...body });
    }
    if (path === '/reminders/log' && method === 'GET') return json(route, { data: reminderLog, total: reminderLog.length });

    return json(route, {});
  });
}
