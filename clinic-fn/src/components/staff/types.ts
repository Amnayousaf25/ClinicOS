export const avatarColors = [
  'from-primary/80 to-secondary/60',
  'from-success/70 to-accent/60',
  'from-warning/70 to-destructive/40',
  'from-secondary/70 to-primary/50',
  'from-accent/70 to-success/50',
];

export const roleLabel = (role: string) => (role === 'admin' ? 'Admin' : 'Staff');

export type StatusFilter = 'all' | 'active' | 'inactive';
export type FormMode = 'invite' | 'edit';

/**
 * In-memory avatar selection. The Patient/Staff form keeps both the
 * raw File (uploaded to S3 on submit) and the blob URL (rendered in
 * the preview thumbnail) as a single unit so callers can't drift one
 * out of sync with the other.
 */
export interface AvatarDraft {
  file: File;
  previewUrl: string;
}

export interface FormState {
  name: string;
  email: string;
  employeeId: string;
  role: 'admin' | 'staff';
  avatar: AvatarDraft | null;
}

export const emptyForm: FormState = {
  name: '',
  email: '',
  employeeId: '',
  role: 'staff',
  avatar: null,
};
