import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DatePickerField from './DatePickerField';

describe('DatePickerField', () => {
  it('keeps the trigger text truncatable for narrow screens', () => {
    render(
      <DatePickerField
        value="1990-01-02"
        onChange={vi.fn()}
        showYearDropdown
      />,
    );

    expect(screen.getByText('January 2, 1990')).toHaveClass('truncate');
  });

  it('shows month and year dropdowns when requested', () => {
    render(
      <DatePickerField value="" onChange={vi.fn()} showYearDropdown />,
    );

    fireEvent.click(screen.getByRole('button', { name: /select date/i }));

    expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(2);
  });
});
