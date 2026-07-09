import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ForgotPasswordDialog } from './ForgotPasswordDialog';
import * as authApi from '@/lib/authApi';

vi.mock('@/lib/authApi', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/authApi')>('@/lib/authApi');
  return {
    ...actual,
    forgotPasswordApi: vi.fn(),
    verifyForgotPasswordOtpApi: vi.fn(),
    resetPasswordApi: vi.fn(),
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('ForgotPasswordDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('flags invalid email at the start of the OTP wizard', async () => {
    render(<ForgotPasswordDialog open onOpenChange={vi.fn()} />);

    const email = screen.getByLabelText(/email address/i);
    fireEvent.change(email, { target: { value: 'not-an-email' } });
    fireEvent.blur(email);
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    expect(
      await screen.findByText(/invalid email address/i),
    ).toBeInTheDocument();
    expect(authApi.forgotPasswordApi).not.toHaveBeenCalled();
  });

  it('advances to the OTP step on a valid email', async () => {
    vi.mocked(authApi.forgotPasswordApi).mockResolvedValue(undefined);
    render(<ForgotPasswordDialog open onOpenChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    expect(
      await screen.findByLabelText(/verification code/i),
    ).toBeInTheDocument();
    expect(authApi.forgotPasswordApi).toHaveBeenCalledWith('jane@example.com');
  });

  it('rejects mismatched passwords on the reset step', async () => {
    vi.mocked(authApi.forgotPasswordApi).mockResolvedValue(undefined);
    vi.mocked(authApi.verifyForgotPasswordOtpApi).mockResolvedValue(
      'reset.token',
    );
    render(<ForgotPasswordDialog open onOpenChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    const otp = await screen.findByLabelText(/verification code/i);
    fireEvent.change(otp, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /verify code/i }));

    const newPassword = await screen.findByLabelText(/new password/i);
    fireEvent.change(newPassword, { target: { value: 'Password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'WrongMatch' },
    });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(
      await screen.findByText(/passwords do not match/i),
    ).toBeInTheDocument();
    expect(authApi.resetPasswordApi).not.toHaveBeenCalled();
  });
});
