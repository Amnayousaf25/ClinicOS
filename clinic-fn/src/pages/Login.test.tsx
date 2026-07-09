import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './Login';
import { loginApi } from '@/lib/authApi';

vi.mock('@/lib/authApi', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/authApi')>('@/lib/authApi');
  return {
    ...actual,
    loginApi: vi.fn(),
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const renderLogin = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </QueryClientProvider>,
  );
};

describe('Login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('blocks submission and shows Yup errors for empty fields', async () => {
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByText(/email is required/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/password is required/i),
    ).toBeInTheDocument();
    expect(loginApi).not.toHaveBeenCalled();
  });

  it('flags invalid email format', async () => {
    renderLogin();

    const email = screen.getByLabelText(/email address/i);
    fireEvent.change(email, { target: { value: 'not-an-email' } });
    fireEvent.blur(email);
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'somepass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByText(/invalid email address/i),
    ).toBeInTheDocument();
    expect(loginApi).not.toHaveBeenCalled();
  });

  it('shows a visible error when login credentials are invalid', async () => {
    vi.mocked(loginApi).mockRejectedValue(new Error('Invalid credentials'));
    renderLogin();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'somepass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid credentials/i);
  });

  it('prefills the seeded admin credentials by default', () => {
    renderLogin();

    expect(screen.getByLabelText(/email address/i)).toHaveValue(
      'tahir+a@geeksofkolachi.com',
    );
    expect(screen.getByLabelText(/password/i)).toHaveValue('Test1234$');
  });

  it('calls loginApi when fields are valid', async () => {
    vi.mocked(loginApi).mockResolvedValue({
      email: 'jane@example.com',
      role: 'staff',
    });
    renderLogin();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'somepass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await vi.waitFor(() =>
      expect(loginApi).toHaveBeenCalledWith('jane@example.com', 'somepass'),
    );
  });
});
