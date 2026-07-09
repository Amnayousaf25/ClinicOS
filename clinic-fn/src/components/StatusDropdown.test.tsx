import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusDropdown } from './StatusDropdown';
import type { Appointment } from '@/types';

vi.mock('@/hooks/useApi', () => ({
  useUpdateStatus: () => ({ mutate: vi.fn(), isPending: false }),
  useReschedule: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useClinicSettings: () => ({ data: undefined }),
  useProviders: () => ({ data: [] }),
}));

const base: Appointment = {
  _id: 'a1',
  patientId: {
    _id: 'p1',
    name: 'Jane Doe',
    phone: '+10000000000',
    email: '',
    mrn: 'P-000001',
  },
  serviceId: {
    _id: 's1',
    name: 'Consultation',
  },
  date: '2099-04-17',
  time: '10:00',
  status: 'confirmed',
  intakeStatus: 'not-sent',
  smsReminders: [],
};

const renderWith = (a: Appointment) => {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <StatusDropdown appointment={a} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('StatusDropdown', () => {
  it('keeps the trigger enabled when intake is not submitted and status is not terminal', () => {
    renderWith(base);
    const trigger = screen.getByRole('combobox');
    expect(trigger).not.toBeDisabled();
    expect(trigger.getAttribute('title')).toBeNull();
  });

  it('locks the trigger once intake is confirmed', () => {
    renderWith({ ...base, intakeStatus: 'confirmed' });
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
    expect(trigger.getAttribute('title')).toContain('intake submitted');
  });

  it.each<Appointment['status']>(['arrived', 'cancelled', 'no-show'])(
    'locks the trigger for terminal status %s',
    (status) => {
      renderWith({ ...base, status });
      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeDisabled();
    },
  );
});
