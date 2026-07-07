import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { Spinner } from '@/components/Spinner';
import { useNavigate, useParams } from 'react-router-dom';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  acceptInviteApi,
  getApiErrorMessage,
  validateInviteApi,
} from '@/lib/authApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormikFieldError } from '@/components/FormikFieldError';
import { acceptInviteSchema } from '@/lib/authValidation';
import Logo from '@/components/Logo';

const InviteAcceptPage = () => {
  const { token = '' } = useParams();
  const navigate = useNavigate();

  const [loadingInvite, setLoadingInvite] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        toast.error('Invalid invitation link');
        setLoadingInvite(false);
        return;
      }
      try {
        const data = await validateInviteApi(token);
        setName(data.name || '');
        setEmail(data.email || '');
      } catch (err: unknown) {
        toast.error(
          getApiErrorMessage(err, 'Invitation link is invalid or expired'),
        );
      } finally {
        setLoadingInvite(false);
      }
    };
    run();
  }, [token]);

  const formik = useFormik({
    initialValues: { password: '', confirmPassword: '' },
    validationSchema: acceptInviteSchema,
    onSubmit: async (values, { setSubmitting }) => {
      if (!email) {
        toast.error('Invitation is invalid');
        setSubmitting(false);
        return;
      }
      try {
        await acceptInviteApi(token, email, values.password);
        setAccepted(true);
        toast.success('Account activated successfully');
        setTimeout(() => navigate('/', { replace: true }), 800);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, 'Failed to activate account'));
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (loadingInvite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Logo size="lg" />
        </div>

        <div className="bg-card rounded-2xl p-6 sm:p-7 border border-border/60 shadow-sm">
          {accepted ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <h1 className="text-xl font-bold text-foreground">
                Account Activated
              </h1>
              <p className="text-sm text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <h1 className="text-xl font-bold text-foreground">
                  Set Your Password
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {name ? `Welcome ${name}.` : 'Welcome.'} Complete account
                  setup to continue.
                </p>
              </div>

              <form onSubmit={formik.handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} disabled className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Minimum 8 characters"
                    className="h-11 rounded-xl"
                  />
                  <FormikFieldError
                    error={formik.errors.password}
                    touched={formik.touched.password}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Re-enter password"
                    className="h-11 rounded-xl"
                  />
                  <FormikFieldError
                    error={formik.errors.confirmPassword}
                    touched={formik.touched.confirmPassword}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="w-full h-11 rounded-xl font-semibold"
                >
                  {formik.isSubmitting ? (
                    <>
                      <Spinner size="sm" className="mr-2 text-current" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 mr-2" />
                      Activate Account
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteAcceptPage;
