import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import { StaffFormDialog } from './StaffFormDialog';
import { uploadProfileImage } from '@/lib/staffApi';

const inviteMutate = vi.fn();
const updateMutate = vi.fn();

vi.mock('@/hooks/useApi', () => ({
  useInviteStaff: () => ({ mutate: inviteMutate, isPending: false }),
  useUpdateStaff: () => ({ mutate: updateMutate, isPending: false }),
}));

vi.mock('@/lib/staffApi', () => ({
  uploadProfileImage: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('StaffFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue('blob:avatar'),
    });
  });

  it('includes uploaded profile image key in staff invites', async () => {
    vi.mocked(uploadProfileImage).mockResolvedValue({
      id: 'file-1',
      key: 'uploads/avatar.png',
    });
    render(
      <StaffFormDialog
        open
        onOpenChange={vi.fn()}
        mode="invite"
        member={null}
      />,
    );

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Staff' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/employee id/i), {
      target: { value: 'EMP-1' },
    });
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, {
      target: {
        files: [new File(['img'], 'avatar.png', { type: 'image/png' })],
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /send invitation/i }));

    await waitFor(() => expect(uploadProfileImage).toHaveBeenCalled());
    expect(inviteMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Jane Staff',
        email: 'jane@example.com',
        employeeId: 'EMP-1',
        profileImage: 'uploads/avatar.png',
      }),
      expect.anything(),
    );
  });

  it('stops submission and shows upload error when photo upload fails', async () => {
    vi.mocked(uploadProfileImage).mockRejectedValue(new Error('S3 down'));
    render(
      <StaffFormDialog
        open
        onOpenChange={vi.fn()}
        mode="invite"
        member={null}
      />,
    );

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Staff' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/employee id/i), {
      target: { value: 'EMP-1' },
    });
    fireEvent.change(document.querySelector('input[type="file"]')!, {
      target: {
        files: [new File(['img'], 'avatar.png', { type: 'image/png' })],
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /send invitation/i }));

    await waitFor(() => expect(uploadProfileImage).toHaveBeenCalled());
    expect(inviteMutate).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('S3 down');
  });

  it('blocks submission and surfaces Yup errors when fields are empty', async () => {
    render(
      <StaffFormDialog
        open
        onOpenChange={vi.fn()}
        mode="invite"
        member={null}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /send invitation/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/employee id is required/i)).toBeInTheDocument();
    expect(inviteMutate).not.toHaveBeenCalled();
  });

  it('flags invalid email format via the Yup schema', async () => {
    render(
      <StaffFormDialog
        open
        onOpenChange={vi.fn()}
        mode="invite"
        member={null}
      />,
    );

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Staff' },
    });
    const emailField = screen.getByLabelText(/^email$/i);
    fireEvent.change(emailField, { target: { value: 'not-an-email' } });
    fireEvent.blur(emailField);
    fireEvent.change(screen.getByLabelText(/employee id/i), {
      target: { value: 'EMP-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send invitation/i }));

    expect(
      await screen.findByText(/invalid email address/i, undefined, {
        timeout: 3000,
      }),
    ).toBeInTheDocument();
    expect(inviteMutate).not.toHaveBeenCalled();
  });

  it('maps server-side duplicate-email error onto the email field', async () => {
    inviteMutate.mockImplementation((_payload, opts) => {
      opts.onError?.({
        response: { data: { message: 'Email already registered' } },
      });
    });
    render(
      <StaffFormDialog
        open
        onOpenChange={vi.fn()}
        mode="invite"
        member={null}
      />,
    );

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Staff' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/employee id/i), {
      target: { value: 'EMP-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send invitation/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/email already registered/i),
      ).toBeInTheDocument();
    });
  });

  it('hides email + employeeId fields in edit mode', () => {
    render(
      <StaffFormDialog
        open
        onOpenChange={vi.fn()}
        mode="edit"
        member={{
          _id: 'u1',
          name: 'Existing Jane',
          email: 'jane@example.com',
          employeeId: 'EMP-1',
          role: 'staff',
          isActive: true,
          invitationStatus: 'accepted',
        }}
      />,
    );

    expect(screen.queryByLabelText(/^email$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/employee id/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Existing Jane');
  });
});
