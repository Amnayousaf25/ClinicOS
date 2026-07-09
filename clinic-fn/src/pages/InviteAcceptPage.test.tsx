import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InviteAcceptPage from './InviteAcceptPage';
import * as authApi from '@/lib/authApi';

vi.mock('@/lib/authApi', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/authApi')>('@/lib/authApi');
  return {
    ...actual,
    validateInviteApi: vi.fn(),
    acceptInviteApi: vi.fn(),
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const renderInvite = () =>
  render(
    <MemoryRouter initialEntries={['/invite/abc-token']}>
      <Routes>
        <Route path="/invite/:token" element={<InviteAcceptPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('InviteAcceptPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects passwords shorter than 8 characters', async () => {
    vi.mocked(authApi.validateInviteApi).mockResolvedValue({
      email: 'jane@example.com',
      name: 'Jane',
    });
    renderInvite();

    const password = await screen.findByLabelText(/new password/i);
    fireEvent.change(password, { target: { value: 'short' } });
    fireEvent.blur(password);
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'short' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /activate account/i }),
    );

    expect(
      await screen.findByText(/at least 8 characters/i),
    ).toBeInTheDocument();
    expect(authApi.acceptInviteApi).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords', async () => {
    vi.mocked(authApi.validateInviteApi).mockResolvedValue({
      email: 'jane@example.com',
      name: 'Jane',
    });
    renderInvite();

    const password = await screen.findByLabelText(/new password/i);
    fireEvent.change(password, { target: { value: 'longenough1' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'different1' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /activate account/i }),
    );

    expect(
      await screen.findByText(/passwords do not match/i),
    ).toBeInTheDocument();
    expect(authApi.acceptInviteApi).not.toHaveBeenCalled();
  });

  it('submits when both password fields match and meet the length rule', async () => {
    vi.mocked(authApi.validateInviteApi).mockResolvedValue({
      email: 'jane@example.com',
      name: 'Jane',
    });
    vi.mocked(authApi.acceptInviteApi).mockResolvedValue({
      _id: 'u1',
      email: 'jane@example.com',
      role: 'staff',
    });
    renderInvite();

    const password = await screen.findByLabelText(/new password/i);
    fireEvent.change(password, { target: { value: 'longenough1' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'longenough1' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /activate account/i }),
    );

    await vi.waitFor(() =>
      expect(authApi.acceptInviteApi).toHaveBeenCalledWith(
        'abc-token',
        'jane@example.com',
        'longenough1',
      ),
    );
  });
});
