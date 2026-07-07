import * as Yup from 'yup';

const emailRule = Yup.string()
  .email('Invalid email address')
  .required('Email is required');

const nameRule = Yup.string()
  .trim()
  .min(2, 'Name is too short')
  .required('Name is required');

const employeeIdRule = Yup.string()
  .trim()
  .required('Employee ID is required');

const roleRule = Yup.mixed<'admin' | 'staff'>()
  .oneOf(['admin', 'staff'])
  .required('Role is required');

// Avatar is optional; when present it must be an actual File pulled
// from `<input type="file">`. We don't validate size/type here — the
// `AvatarUpload` component already guards both.
const avatarRule = Yup.mixed<{ file: File; previewUrl: string }>().nullable();

/** Invite mode — requires full identity (email + employeeId). */
export const inviteStaffSchema = Yup.object({
  name: nameRule,
  email: emailRule,
  employeeId: employeeIdRule,
  role: roleRule,
  avatar: avatarRule,
});

/**
 * Edit mode — email + employeeId are read-only once invited, so the
 * schema only validates the editable fields (name + role + optional
 * avatar).
 */
export const editStaffSchema = Yup.object({
  name: nameRule,
  role: roleRule,
  avatar: avatarRule,
});
