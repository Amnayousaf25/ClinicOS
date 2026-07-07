import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { toast } from 'sonner';
import { FormDialogShell } from '@/components/FormDialogShell';
import { TextField } from '@/components/intake/primitives';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FormikFieldError } from '@/components/FormikFieldError';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Values {
  name: string;
  email: string;
  phone: string;
  age: string;
  reason: string;
}

const initialValues: Values = { name: '', email: '', phone: '', age: '', reason: '' };

const schema = Yup.object({
  name: Yup.string().trim().required('Name is required').max(100),
  email: Yup.string().trim().email('Invalid email').required('Email is required').max(255),
  phone: Yup.string()
    .trim()
    .required('Phone number is required')
    .matches(/^[+\d][\d\s\-()]{6,20}$/, 'Invalid phone number'),
  age: Yup.number()
    .typeError('Age must be a number')
    .required('Age is required')
    .integer('Age must be a whole number')
    .min(1, 'Age must be at least 1')
    .max(120, 'Age must be 120 or less'),
  reason: Yup.string().trim().required('Reason is required').max(500),
});

const BookDemoDialog = ({ open, onOpenChange }: Props) => (
  <Formik<Values>
    initialValues={initialValues}
    validationSchema={schema}
    enableReinitialize
    onSubmit={(values, { resetForm, setSubmitting }) => {
      // No backend wired yet — surface success and reset.
      toast.success("Thanks! We'll reach out shortly to schedule your demo.");
      resetForm();
      setSubmitting(false);
      onOpenChange(false);
    }}
  >
    {(formik) => (
      <FormDialogShell
        open={open}
        onOpenChange={(o) => {
          if (!o) formik.resetForm();
          onOpenChange(o);
        }}
        title="Book a live demo"
        description="Tell us a bit about you and we'll set up a personalized walkthrough."
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="book-demo-form"
              disabled={formik.isSubmitting}
            >
              Request demo
            </Button>
          </div>
        }
      >
        <Form id="book-demo-form" className="space-y-4">
          <TextField name="name" label="Full name" placeholder="Jane Doe" required />
          <TextField name="email" label="Email" type="email" placeholder="jane@clinic.com" required />
          <div className="grid grid-cols-2 gap-3">
            <TextField name="phone" label="Phone" type="tel" placeholder="+1 555 123 4567" required />
            <TextField name="age" label="Age" type="number" placeholder="32" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason to book *</Label>
            <Textarea
              id="reason"
              name="reason"
              rows={4}
              placeholder="What would you like to see in the demo?"
              value={formik.values.reason}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <FormikFieldError error={formik.errors.reason} touched={formik.touched.reason} />
          </div>
        </Form>
      </FormDialogShell>
    )}
  </Formik>
);

export default BookDemoDialog;
