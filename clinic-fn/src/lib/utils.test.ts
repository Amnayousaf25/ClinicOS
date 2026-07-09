import { describe, it, expect } from 'vitest';
import { getInitials } from './utils';

describe('getInitials', () => {
  it('returns initials for a normal full name', () => {
    expect(getInitials('John Smith')).toBe('JS');
  });

  it('uppercases lowercase names', () => {
    expect(getInitials('jane doe')).toBe('JD');
  });

  it('handles single names', () => {
    expect(getInitials('Plato')).toBe('P');
  });

  it('returns the fallback for undefined / null / empty', () => {
    expect(getInitials(undefined)).toBe('?');
    expect(getInitials(null)).toBe('?');
    expect(getInitials('')).toBe('?');
  });

  it('honors a custom fallback', () => {
    expect(getInitials(undefined, '—')).toBe('—');
  });

  it('skips empty segments from extra spaces', () => {
    expect(getInitials('  John   Smith  ')).toBe('JS');
  });
});
