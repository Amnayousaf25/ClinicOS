import { useFormik } from 'formik';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/Spinner';
import { FormikFieldError } from '@/components/FormikFieldError';
import {
  useInsuranceProviders,
  useAddInsuranceProvider,
  useRemoveInsuranceProvider,
} from '@/hooks/useApi';
import { insuranceProviderSchema } from '@/lib/settingsValidation';

export const InsuranceTab = () => {
  const { data: providers = [], isLoading } = useInsuranceProviders();
  const addMut = useAddInsuranceProvider();
  const removeMut = useRemoveInsuranceProvider();

  const formik = useFormik({
    initialValues: { name: '' },
    validationSchema: insuranceProviderSchema,
    onSubmit: (values, { resetForm, setSubmitting }) =>
      addMut.mutate(values.name.trim(), {
        onSuccess: () => resetForm(),
        onSettled: () => setSubmitting(false),
      }),
  });

  return (
    <div className="bg-card rounded-2xl p-6 card-3d border border-border/50 space-y-4">
      <h2 className="font-semibold text-foreground">Insurance Providers</h2>
      <p className="text-xs text-muted-foreground">
        Manage the list of insurance providers available on intake forms.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="sm" />
        </div>
      ) : (
        <div className="space-y-2">
          {providers.map((ip) => (
            <div
              key={ip._id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
            >
              <p className="text-sm font-medium text-foreground">{ip.name}</p>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={() => removeMut.mutate(ip._id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {providers.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No insurance providers yet
            </p>
          )}
        </div>
      )}

      <form
        onSubmit={formik.handleSubmit}
        className="border-t border-border pt-4 space-y-3"
      >
        <h3 className="text-sm font-medium text-foreground">
          Add Insurance Provider
        </h3>
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Input
              name="name"
              placeholder="Provider name"
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
          <Button
            type="submit"
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={addMut.isPending || formik.isSubmitting}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </form>
    </div>
  );
};
