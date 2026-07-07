import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

class ResizeObserverMock {
  observe() { }
  unobserve() { }
  disconnect() { }
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Register from './Register';
import { registerApi } from '@/lib/authApi';

vi.mock('@/lib/authApi', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/authApi')>('@/lib/authApi');
  return {
    ...actual,
    registerApi: vi.fn(),
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const renderRegister = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    </QueryClientProvider>,
  );
};

describe('Register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('blocks submission and shows required-field validation', async () => {
    renderRegister();

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/phone number is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(screen.getByText(/please accept the terms and conditions/i)).toBeInTheDocument();
    expect(registerApi).not.toHaveBeenCalled();
  });

  it('shows a password mismatch validation error', async () => {
    renderRegister();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: '+61400000000' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Different123!' },
    });
    fireEvent.click(screen.getByLabelText(/i agree to the terms/i));
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(registerApi).not.toHaveBeenCalled();
  });

  it('calls registerApi when the form is valid', async () => {
    vi.mocked(registerApi).mockResolvedValue({ authenticated: false });
    renderRegister();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: '+61400000000' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.click(screen.getByLabelText(/i agree to the terms/i));
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await vi.waitFor(() =>
      expect(registerApi).toHaveBeenCalledWith({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+61400000000',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'staff',
        termsAccepted: true,
      }),
    );
  });
});
