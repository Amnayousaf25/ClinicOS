import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormikFieldError } from '@/components/FormikFieldError';
import { ArrowRight, Calendar, Building2, Users, Mail, Phone, User } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const teamSizeOptions = ['1–5', '6–20', '21–50', '51–100', '100+'];

const schema = Yup.object({
  name: Yup.string().trim().required('Name is required').max(100),
  email: Yup.string().trim().email('Invalid email').required('Email is required').max(255),
  phone: Yup.string()
    .trim()
    .required('Phone number is required')
    .matches(/^[+\d][\d\s\-()]{6,20}$/, 'Invalid phone number'),
  clinicName: Yup.string().trim().required('Clinic name is required').max(150),
  teamSize: Yup.string().required('Please select your team size'),
  message: Yup.string().trim().max(500),
});

const BookDemoDialog = ({ open, onOpenChange }: Props) => {
  const [submitted, setSubmitted] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      clinicName: '',
      teamSize: '',
      message: '',
    },
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: (_values, { setSubmitting }) => {
      // Simulate a brief "sending" state then confirm
      setTimeout(() => {
        setSubmitting(false);
        setSubmitted(true);
        toast.success("Demo request sent! We'll be in touch within 24 hours.");
      }, 800);
    },
  });

  const handleClose = (o: boolean) => {
    if (!o) {
      formik.resetForm();
      setSubmitted(false);
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Book a live demo</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Get a personalized walkthrough of ClinicOS — free, no commitment.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-130px)]">
          {submitted ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center justify-center px-8 py-12 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center">
                <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">You're on the list!</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Our team will reach out within <strong>24 hours</strong> to schedule your personalised demo. In the meantime, why not explore the app?
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  onClick={() => handleClose(false)}
                  className="rounded-xl"
                >
                  Close
                </Button>
                <Button
                  className="rounded-xl"
                  onClick={() => {
                    handleClose(false);
                    window.location.href = '/register';
                  }}
                >
                  Start Free Trial <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            /* ── Form ── */
            <form id="book-demo-form" onSubmit={formik.handleSubmit} className="px-6 py-5 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" /> Full name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Dr. Jane Smith"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="rounded-xl h-11"
                />
                <FormikFieldError error={formik.errors.name} touched={formik.touched.name} />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="jane@clinic.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="rounded-xl h-11"
                  />
                  <FormikFieldError error={formik.errors.email} touched={formik.touched.email} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone *
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 555 123 4567"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="rounded-xl h-11"
                  />
                  <FormikFieldError error={formik.errors.phone} touched={formik.touched.phone} />
                </div>
              </div>

              {/* Clinic Name */}
              <div className="space-y-1.5">
                <Label htmlFor="clinicName" className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Clinic / Organisation name *
                </Label>
                <Input
                  id="clinicName"
                  name="clinicName"
                  placeholder="City Health Clinic"
                  value={formik.values.clinicName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="rounded-xl h-11"
                />
                <FormikFieldError error={formik.errors.clinicName} touched={formik.touched.clinicName} />
              </div>

              {/* Team size */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" /> Team size *
                </Label>
                <div className="flex flex-wrap gap-2">
                  {teamSizeOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => formik.setFieldValue('teamSize', opt)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                        formik.values.teamSize === opt
                          ? 'bg-primary text-primary-foreground border-primary shadow-md'
                          : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <FormikFieldError error={formik.errors.teamSize} touched={formik.touched.teamSize} />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label htmlFor="message">Anything you'd like us to know? <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={3}
                  placeholder="What challenges are you hoping ClinicOS will solve?"
                  value={formik.values.message}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="rounded-xl resize-none"
                />
                <FormikFieldError error={formik.errors.message} touched={formik.touched.message} />
              </div>

              {/* Footer actions */}
              <div className="flex justify-end gap-2 pt-2 pb-1">
                <Button type="button" variant="outline" onClick={() => handleClose(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="rounded-xl px-6 font-bold"
                >
                  {formik.isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending…
                    </span>
                  ) : (
                    <>Request demo <ArrowRight className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookDemoDialog;
