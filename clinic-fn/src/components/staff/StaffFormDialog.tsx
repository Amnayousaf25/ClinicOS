import { useFormik } from 'formik';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/Spinner';
import { FormikFieldError } from '@/components/FormikFieldError';
import { useInviteStaff, useUpdateStaff } from '@/hooks/useApi';
import { uploadProfileImage } from '@/lib/staffApi';
import { getApiErrorMessage } from '@/lib/api';
import {
  editStaffSchema,
  inviteStaffSchema,
} from '@/lib/staffValidation';
import { toast } from 'sonner';
import type { StaffMember } from '@/types';
import { AvatarUpload } from './AvatarUpload';
import { avatarColors, emptyForm, type FormMode, type FormState } from './types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FormMode;
  member: StaffMember | null;
}

const memberToForm = (m: StaffMember): FormState => ({
  name: m.name,
  email: m.email,
  employeeId: m.employeeId,
  role: m.role,
  avatar: null,
});

export const StaffFormDialog = ({ open, onOpenChange, mode, member }: Props) => {
  const inviteMutation = useInviteStaff();
  const updateMutation = useUpdateStaff();

  const formik = useFormik<FormState>({
    enableReinitialize: true,
    initialValues:
      mode === 'edit' && member ? memberToForm(member) : emptyForm,
    validationSchema: mode === 'invite' ? inviteStaffSchema : editStaffSchema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      // Upload the avatar first so the mutation payload carries the
      // S3 key. Surface the real backend error inline rather than
      // hiding it behind a generic toast.
      let profileImageKey: string | undefined;
      if (values.avatar) {
        try {
          const uploaded = await uploadProfileImage(values.avatar.file);
          profileImageKey = uploaded.key;
        } catch (err) {
          toast.error(
            getApiErrorMessage(err, 'Failed to upload profile photo'),
          );
          setSubmitting(false);
          return;
        }
      }

      const onError = (err: unknown) => {
        const e = err as { response?: { data?: { message?: string } } };
        const message = e?.response?.data?.message;
        // Map known backend field-level errors back onto the form.
        if (message && /email.*registered|already exists/i.test(message)) {
          setFieldError('email', message);
        } else if (message && /employee.*id/i.test(message)) {
          setFieldError('employeeId', message);
        }
      };

      if (mode === 'invite') {
        inviteMutation.mutate(
          {
            name: values.name.trim(),
            email: values.email.trim(),
            employeeId: values.employeeId.trim(),
            role: values.role,
            ...(profileImageKey && { profileImage: profileImageKey }),
          },
          { onSuccess: () => onOpenChange(false), onError },
        );
      } else if (member) {
        updateMutation.mutate(
          {
            id: member._id,
            name: values.name.trim(),
            role: values.role,
            ...(profileImageKey && { profileImage: profileImageKey }),
          },
          { onSuccess: () => onOpenChange(false), onError },
        );
      }
    },
  });

  const isBusy =
    inviteMutation.isPending || updateMutation.isPending || formik.isSubmitting;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          formik.resetForm();
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-md rounded-2xl">
        <form onSubmit={formik.handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === 'invite' ? 'Invite Staff Member' : 'Edit Staff Member'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <AvatarUpload
              value={formik.values.avatar}
              initial={formik.values.name.charAt(0).toUpperCase()}
              colorClass={avatarColors[0]}
              onChange={(next) => formik.setFieldValue('avatar', next)}
            />
            <div className="space-y-1.5">
              <Label htmlFor="form-name">Full Name</Label>
              <Input
                id="form-name"
                name="name"
                placeholder="Jane Smith"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              <FormikFieldError
                error={formik.errors.name}
                touched={formik.touched.name}
              />
            </div>
            {mode === 'invite' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="form-email">Email</Label>
                  <Input
                    id="form-email"
                    name="email"
                    type="email"
                    placeholder="jane@clinic.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <FormikFieldError
                    error={formik.errors.email}
                    touched={formik.touched.email}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="form-emp-id">Employee ID</Label>
                  <Input
                    id="form-emp-id"
                    name="employeeId"
                    placeholder="EMP-001"
                    value={formik.values.employeeId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <FormikFieldError
                    error={formik.errors.employeeId}
                    touched={formik.touched.employeeId}
                  />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={formik.values.role}
                onValueChange={(v) =>
                  formik.setFieldValue('role', v as 'admin' | 'staff')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { formik.resetForm(); onOpenChange(false); }}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isBusy}>
              {isBusy && <Spinner size="sm" className="mr-2 text-current" />}
              {mode === 'invite' ? 'Send Invitation' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
