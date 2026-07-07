import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { AvatarUpload } from './AvatarUpload';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('AvatarUpload', () => {
  it('rejects non-image files before calling onChange', () => {
    const onChange = vi.fn();
    const { container } = render(
      <AvatarUpload
        value={null}
        initial="A"
        colorClass="from-primary to-secondary"
        onChange={onChange}
      />,
    );

    const input = container.querySelector('input[type="file"]')!;
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onChange).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Please select an image file');
  });

  it('rejects images over five megabytes', () => {
    const onChange = vi.fn();
    const { container } = render(
      <AvatarUpload
        value={null}
        initial="A"
        colorClass="from-primary to-secondary"
        onChange={onChange}
      />,
    );

    const input = container.querySelector('input[type="file"]')!;
    const file = new File(['x'.repeat(5 * 1024 * 1024 + 1)], 'large.png', {
      type: 'image/png',
    });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onChange).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Image must be under 5 MB');
  });

  it('passes valid images with a preview URL', () => {
    const onChange = vi.fn();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue('blob:preview'),
    });
    const { container } = render(
      <AvatarUpload
        value={null}
        initial="A"
        colorClass="from-primary to-secondary"
        onChange={onChange}
      />,
    );

    const input = container.querySelector('input[type="file"]')!;
    const file = new File(['img'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onChange).toHaveBeenCalledWith({
      file,
      previewUrl: 'blob:preview',
    });
  });

  it('renders the selected preview image', () => {
    const file = new File(['img'], 'avatar.png', { type: 'image/png' });
    render(
      <AvatarUpload
        value={{ file, previewUrl: 'blob:preview' }}
        initial="A"
        colorClass="from-primary to-secondary"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByAltText('Profile preview')).toHaveAttribute(
      'src',
      'blob:preview',
    );
  });
});
