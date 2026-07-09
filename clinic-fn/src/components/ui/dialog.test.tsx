import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Dialog, DialogContent, DialogTitle } from './dialog';

describe('DialogContent', () => {
  it('renders a mobile-sized close button that stays inside the dialog', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Details</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    const close = screen.getByRole('button', { name: /close/i });
    expect(close).toHaveClass('h-8', 'w-8', 'right-2', 'top-2');
  });
});
