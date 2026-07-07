import { useState } from 'react';
import { useFormik } from 'formik';
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
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
import { FormikFieldError } from '@/components/FormikFieldError';
import {
  forgotEmailSchema,
  forgotOtpSchema,
  forgotResetSchema,
} from '@/lib/authValidation';
import {
  forgotPasswordApi,
  verifyForgotPasswordOtpApi,
  resetPasswordApi,
  getApiErrorMessage,
} from '@/lib/authApi';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'email' | 'otp' | 'reset' | 'done';

const STEP_HINTS: Record<Step, string> = {
  email: "Enter your email and we'll send you a 6-digit code.",
  otp: 'Enter the code we just emailed you.',
  reset: 'Set a new password for your account.',
  done: 'Your password has been updated. You can sign in now.',
};

export const ForgotPasswordDialog = ({ open, onOpenChange }: Props) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const reset = () => {
    setStep('email');
    setEmail('');
    setResetToken('');
    setShowPassword(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  const emailFormik = useFormik({
    initialValues: { email: '' },
    validationSchema: forgotEmailSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await forgotPasswordApi(values.email);
        setEmail(values.email);
        toast.success('OTP sent to your email');
        setStep('otp');
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, 'Could not send OTP.'));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const otpFormik = useFormik({
    initialValues: { otp: '' },
    validationSchema: forgotOtpSchema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      try {
        const token = await verifyForgotPasswordOtpApi(email, values.otp.trim());
        setResetToken(token);
        setStep('reset');
      } catch (err: unknown) {
        setFieldError('otp', getApiErrorMessage(err, 'Invalid or expired OTP'));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const resetFormik = useFormik({
    initialValues: { password: '', confirmPassword: '' },
    validationSchema: forgotResetSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await resetPasswordApi(email, resetToken, values.password);
        setStep('done');
      } catch (err: unknown) {
        toast.error(
          getApiErrorMessage(
            err,
            'Could not reset password. The OTP may have expired.',
          ),
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  const resendOtp = async () => {
    try {
      await forgotPasswordApi(email);
      toast.success('A new OTP has been sent');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Could not resend OTP.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : handleClose())}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Reset Password
          </DialogTitle>
          <DialogDescription>{STEP_HINTS[step]}</DialogDescription>
        </DialogHeader>

        {step === 'email' && (
          <form onSubmit={emailFormik.handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email address</Label>
              <Input
                id="reset-email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={emailFormik.values.email}
                onChange={emailFormik.handleChange}
                onBlur={emailFormik.handleBlur}
                className="h-12 rounded-xl"
              />
              <FormikFieldError
                error={emailFormik.errors.email}
                touched={emailFormik.touched.email}
              />
            </div>
            <Button
              type="submit"
              disabled={emailFormik.isSubmitting}
              className="w-full h-12 rounded-xl font-semibold"
            >
              {emailFormik.isSubmitting ? 'Sending...' : 'Send OTP'}
              {!emailFormik.isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Remember your password?{' '}
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={handleClose}
              >
                Sign in
              </button>
            </p>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={otpFormik.handleSubmit} className="space-y-4 mt-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
              <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                We sent a code to{' '}
                <strong className="text-foreground">{email}</strong>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-otp">Verification code</Label>
              <Input
                id="reset-otp"
                name="otp"
                inputMode="numeric"
                placeholder="6-digit code"
                value={otpFormik.values.otp}
                onChange={otpFormik.handleChange}
                onBlur={otpFormik.handleBlur}
                maxLength={8}
                className="h-12 rounded-xl tracking-widest text-center text-base"
              />
              <FormikFieldError
                error={otpFormik.errors.otp}
                touched={otpFormik.touched.otp}
              />
            </div>
            <Button
              type="submit"
              disabled={otpFormik.isSubmitting}
              className="w-full h-12 rounded-xl font-semibold"
            >
              {otpFormik.isSubmitting ? 'Verifying...' : 'Verify Code'}
              {!otpFormik.isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setStep('email')}
              >
                Wrong email?
              </button>
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={resendOtp}
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={resetFormik.handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="8+ chars, Aa1@"
                  value={resetFormik.values.password}
                  onChange={resetFormik.handleChange}
                  onBlur={resetFormik.handleBlur}
                  className="h-12 rounded-xl pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <FormikFieldError
                error={resetFormik.errors.password}
                touched={resetFormik.touched.password}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={resetFormik.values.confirmPassword}
                onChange={resetFormik.handleChange}
                onBlur={resetFormik.handleBlur}
                className="h-12 rounded-xl"
              />
              <FormikFieldError
                error={resetFormik.errors.confirmPassword}
                touched={resetFormik.touched.confirmPassword}
              />
            </div>
            <Button
              type="submit"
              disabled={resetFormik.isSubmitting}
              className="w-full h-12 rounded-xl font-semibold"
            >
              {resetFormik.isSubmitting ? 'Resetting...' : 'Reset Password'}
              {!resetFormik.isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>
        )}

        {step === 'done' && (
          <div className="space-y-4 mt-2">
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Password updated
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sign in with your new password to continue.
                </p>
              </div>
            </div>
            <Button className="w-full rounded-xl" onClick={handleClose}>
              Back to Login
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
