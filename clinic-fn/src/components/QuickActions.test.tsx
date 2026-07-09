import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QuickActions } from './QuickActions';
import type { Appointment } from '@/types';

const sendMutate = vi.fn();
vi.mock('@/hooks/useApi', () => ({
  useSendAppointmentSms: () => ({
    isPending: false,
    variables: undefined,
    mutate: sendMutate,
  }),
}));

const baseAppt: Appointment = {
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

const renderWith = (appointment: Appointment) => {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <QuickActions appointment={appointment} />
      </TooltipProvider>
    </QueryClientProvider>,
  );
};

describe('QuickActions', () => {
  beforeEach(() => {
    sendMutate.mockClear();
  });

  it('enables SMS for an active confirmed appointment with no intake', () => {
    renderWith(baseAppt);
    const btn = screen.getByRole('button', { name: /Send appointment SMS/i });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(sendMutate).toHaveBeenCalledWith('a1');
  });

  it('disables SMS once intake is confirmed', () => {
    renderWith({ ...baseAppt, intakeStatus: 'confirmed' });
    const btn = screen.getByRole('button', { name: /Send appointment SMS/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(sendMutate).not.toHaveBeenCalled();
  });

  it.each<Appointment['status']>(['arrived', 'cancelled', 'no-show'])(
    'disables SMS for terminal status %s',
    (status) => {
      renderWith({ ...baseAppt, status });
      const btn = screen.getByRole('button', { name: /Send appointment SMS/i });
      expect(btn).toBeDisabled();
    },
  );
});
