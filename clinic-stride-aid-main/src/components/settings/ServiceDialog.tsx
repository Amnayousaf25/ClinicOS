import { useFormik } from 'formik';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormikFieldError } from '@/components/FormikFieldError';
import { useAddService, useUpdateService } from '@/hooks/useApi';
import { serviceSchema } from '@/lib/settingsValidation';

export interface ServiceDraft {
  _id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
}

interface Props {
  /** The initial form values. `null` means the dialog is closed. */
  draft: ServiceDraft | null;
  onClose: () => void;
}

export const ServiceDialog = ({ draft, onClose }: Props) => {
  const addMut = useAddService();
  const updateMut = useUpdateService();

  const formik = useFormik<ServiceDraft>({
    enableReinitialize: true,
    initialValues: draft ?? {
      _id: '',
      name: '',
      duration: 30,
      price: 0,
      category: 'General',
    },
    validationSchema: serviceSchema,
    onSubmit: (values, { setSubmitting }) => {
      const payload = {
        name: values.name.trim(),
        duration: values.duration,
        price: values.price,
        category: values.category.trim(),
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
            {formik.values._id ? 'Edit Service' : 'Add Service'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="svc-name">Name</Label>
            <Input
              id="svc-name"
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="svc-duration">Duration (min)</Label>
              <Input
                id="svc-duration"
                name="duration"
                type="number"
                min={1}
                step={1}
                value={formik.values.duration}
                onChange={(e) =>
                  formik.setFieldValue(
                    'duration',
                    Math.max(1, Number(e.target.value) || 1),
                  )
                }
                onBlur={formik.handleBlur}
                className="rounded-xl"
              />
              <FormikFieldError
                error={formik.errors.duration}
                touched={formik.touched.duration}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-price">Price ($)</Label>
              <Input
                id="svc-price"
                name="price"
                type="number"
                min={0}
                step="0.01"
                value={formik.values.price}
                onChange={(e) =>
                  formik.setFieldValue(
                    'price',
                    Math.max(0, Number(e.target.value) || 0),
                  )
                }
                onBlur={formik.handleBlur}
                className="rounded-xl"
              />
              <FormikFieldError
                error={formik.errors.price}
                touched={formik.touched.price}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="svc-category">Category</Label>
            <Input
              id="svc-category"
              name="category"
              value={formik.values.category}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="rounded-xl"
            />
            <FormikFieldError
              error={formik.errors.category}
              touched={formik.touched.category}
            />
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
