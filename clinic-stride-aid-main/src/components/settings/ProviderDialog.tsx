import { useFormik } from 'formik';
import {
  Dialog,
  DialogContent,
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
import { FormikFieldError } from '@/components/FormikFieldError';
import {
  useAddProvider,
  useUpdateProvider,
  useServices,
} from '@/hooks/useApi';
import { providerSchema } from '@/lib/settingsValidation';

export interface ProviderDraft {
  _id: string;
  name: string;
  title: string;
  serviceId: string;
}

interface Props {
  draft: ProviderDraft | null;
  onClose: () => void;
}

export const ProviderDialog = ({ draft, onClose }: Props) => {
  const { data: services = [] } = useServices();
  const addMut = useAddProvider();
  const updateMut = useUpdateProvider();

  const formik = useFormik<ProviderDraft>({
    enableReinitialize: true,
    initialValues: draft ?? { _id: '', name: '', title: '', serviceId: '' },
    validationSchema: providerSchema,
    onSubmit: (values, { setSubmitting }) => {
      const payload = {
        name: values.name.trim(),
        title: values.title.trim(),
        serviceId: values.serviceId || undefined,
      };
      const after = { onSettled: () => setSubmitting(false), onSuccess: onClose };
      if (values._id) {
        updateMut.mutate({ id: values._id, ...payload }, after);
      } else {
        addMut.mutate(payload, after);
      }
    },
  });

  const saving = addMut.isPending || updateMut.isPending;

  return (
    <Dialog open={!!draft} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {formik.values._id ? 'Edit Provider' : 'Add Provider'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="prov-name">Name</Label>
            <Input
              id="prov-name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="rounded-xl"
            />
            <FormikFieldError
              error={formik.errors.name}
              touched={formik.touched.name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prov-title">Title</Label>
            <Input
              id="prov-title"
              name="title"
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="e.g. Cardiologist"
              className="rounded-xl"
            />
            <FormikFieldError
              error={formik.errors.title}
              touched={formik.touched.title}
            />
          </div>
          <div className="space-y-2">
            <Label>Service</Label>
            <Select
              value={formik.values.serviceId || 'none'}
              onValueChange={(val) =>
                formik.setFieldValue('serviceId', val === 'none' ? '' : val)
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Link to service (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl" disabled={saving}>
              {saving ? 'Saving...' : formik.values._id ? 'Save' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
