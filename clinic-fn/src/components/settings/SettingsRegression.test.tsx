import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClinicTab } from './ClinicTab';
import { ServiceDialog } from './ServiceDialog';
import { InsuranceTab } from './InsuranceTab';
import { BlockedSlotsTab } from './BlockedSlotsTab';
import { ProviderDialog } from './ProviderDialog';

const mutate = vi.fn();

vi.mock('@/hooks/useApi', () => {
  const settings = {
      clinicName: 'Clinic',
      workingHours: { start: '08:00', end: '17:00' },
      slotDuration: 30,
      timeFormat: '24',
    };
  return {
  useClinicSettings: () => ({ data: settings }),
  useUpdateSettings: () => ({ mutate, isPending: false }),
  useAddService: () => ({ mutate, isPending: false }),
  useUpdateService: () => ({ mutate, isPending: false }),
  useInsuranceProviders: () => ({ data: [], isLoading: false }),
  useAddInsuranceProvider: () => ({ mutate, isPending: false }),
  useRemoveInsuranceProvider: () => ({ mutate, isPending: false }),
  useBlockedSlots: () => ({ data: [], isLoading: false }),
  useBlockSlot: () => ({ mutate, isPending: false }),
  useUnblockSlot: () => ({ mutate, isPending: false }),
  useServices: () => ({ data: [], isLoading: false }),
  useAddProvider: () => ({ mutate, isPending: false }),
  useUpdateProvider: () => ({ mutate, isPending: false }),
  };
});

describe('settings regressions', () => {
  it('clamps slot duration to at least one minute', () => {
    render(<ClinicTab />);

    const input = screen.getByDisplayValue(30);
    fireEvent.change(input, { target: { value: '-5' } });

    expect(input).toHaveValue(1);
  });

  it('clamps service duration and price so they cannot go negative', () => {
    render(
      <ServiceDialog
        draft={{
          _id: '',
          name: 'Consult',
          duration: 30,
          price: 10,
          category: 'General',
        }}
        onClose={vi.fn()}
      />,
    );

    const [duration, price] = screen.getAllByRole('spinbutton');
    fireEvent.change(duration, { target: { value: '-2' } });
    fireEvent.change(price, { target: { value: '-7' } });

    expect(duration).toHaveValue(1);
    expect(price).toHaveValue(0);
  });

  it('keeps Add Insurance Provider button on the primary blue style', () => {
    render(<InsuranceTab />);

    expect(screen.getByRole('button', { name: /add/i })).toHaveClass(
      'bg-primary',
      'hover:bg-primary/90',
    );
  });

  it('keeps Block Slot button on the primary blue style', () => {
    render(<BlockedSlotsTab />);

    expect(screen.getByRole('button', { name: /block slot/i })).toHaveClass(
      'bg-primary',
      'hover:bg-primary/90',
    );
  });

  it('blocks Block Slot submission when date or time is empty', async () => {
    render(<BlockedSlotsTab />);

    fireEvent.click(screen.getByRole('button', { name: /block slot/i }));

    expect(
      await screen.findByText(/date is required/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/time is required/i)).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('blocks Add Insurance Provider when name is empty', async () => {
    render(<InsuranceTab />);

    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(
      await screen.findByText(/provider name is required/i),
    ).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('blocks ServiceDialog submission when fields are missing', async () => {
    render(
      <ServiceDialog
        draft={{
          _id: '',
          name: '',
          duration: 30,
          price: 0,
          category: '',
        }}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    expect(
      await screen.findByText(/service name is required/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/category is required/i),
    ).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('blocks ProviderDialog submission when name is missing', async () => {
    render(
      <ProviderDialog
        draft={{ _id: '', name: '', title: '', serviceId: '' }}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    expect(
      await screen.findByText(/provider name is required/i),
    ).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });
});
