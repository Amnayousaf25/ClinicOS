import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Pull initials from a name like "John Smith" → "JS". Defensive against
 * undefined/null/empty inputs — used in row avatars where a missing
 * patientName from legacy data would otherwise crash the page.
 */
export function getInitials(name: string | null | undefined, fallback = '?') {
  if (!name) return fallback;
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .toUpperCase();
  return initials || fallback;
}

import * as Yup from 'yup';

export const phoneYupValidation = (required: boolean = true) => {
  let schema = Yup.string();
  if (required) {
    schema = schema.required('Phone is required');
  }
  return schema.test('is-valid-phone', 'Invalid phone number length for the selected country', (value) => {
    if (!value) return !required;
    const clean = value.replace(/[\s()-]/g, '');
    if (clean.startsWith('+92')) {
      return clean.length === 13 && /^\+92\d{10}$/.test(clean);
    }
    if (clean.startsWith('+61')) {
      return clean.length === 12 && /^\+61\d{9}$/.test(clean);
    }
    if (clean.startsWith('+1')) {
      return clean.length === 12 && /^\+1\d{10}$/.test(clean);
    }
    if (clean.startsWith('+44')) {
      return clean.length === 13 && /^\+44\d{10}$/.test(clean);
    }
    return /^\+?\d{7,15}$/.test(clean);
  });
};

