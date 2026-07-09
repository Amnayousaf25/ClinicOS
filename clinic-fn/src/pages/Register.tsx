import { useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import { LoginBrandPanel } from '@/components/login/LoginBrandPanel';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormikFieldError } from '@/components/FormikFieldError';
import { registerApi, getRegistrationErrorMessage } from '@/lib/authApi';
import { registerSchema } from '@/lib/authValidation';
import { PhoneInput } from '@/components/PhoneInput';

const initialValues = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  role: 'staff' as 'staff' | 'admin',
  termsAccepted: false,
};

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillEmail = searchParams.get('email') || '';

  const formik = useFormik({
    initialValues: { ...initialValues, email: prefillEmail },
    validationSchema: registerSchema,
    validateOnChange: true, // Ensured real-time keystroke evaluation
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(undefined);
      try {
        const result = await registerApi({
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          password: values.password,
          confirmPassword: values.confirmPassword,
          role: values.role,
          termsAccepted: values.termsAccepted,
        });

        if (result?.authenticated) {
          await queryClient.invalidateQueries({ queryKey: ['auth-me'] });
          toast.success('Account created successfully');
          navigate('/', { replace: true });
        } else {
          toast.success('Account created. Please sign in to continue.');
          navigate('/login', { replace: true, state: { registeredEmail: values.email.trim() } });
        }
      } catch (err: unknown) {
        const message = getRegistrationErrorMessage(err);
        setStatus(message);
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const roleOptions = useMemo(
    () => [
      { value: 'staff', label: 'Staff' },
      { value: 'admin', label: 'Admin' },
    ],
    [],
  );

  return (
    <div className="min-h-screen flex">
      <LoginBrandPanel />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-background via-background to-muted/30">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Logo size="lg" />
            <p className="text-muted-foreground text-sm mt-1">Clinic Management Platform</p>
          </div>

          <div className="space-y-2 mb-8">
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="text-sm text-muted-foreground">
              Register to manage appointments, patients, and operations securely.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 sm:p-7 card-3d border border-border/50">
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              {formik.status ? (
                <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formik.status}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Alex Morgan"
                  value={formik.values.fullName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="h-12 rounded-xl"
                />
                <FormikFieldError error={formik.errors.fullName} touched={formik.touched.fullName} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@clinic.com"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="h-12 rounded-xl"
                />
                {/* Fixed to trigger error display immediately when typing '@' */}
                <FormikFieldError
                  error={formik.errors.email}
                  touched={formik.touched.email || !!formik.values.email}
                />
              </div>

              <div className="space-y-2">
                <PhoneInput
                  name="phone"
                  label="Phone Number"
                  value={formik.values.phone}
                  onChange={(val) => formik.setFieldValue('phone', val)}
                  onBlur={formik.handleBlur}
                  error={formik.errors.phone}
                  touched={formik.touched.phone}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="h-12 rounded-xl pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <FormikFieldError error={formik.errors.password} touched={formik.touched.password} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="h-12 rounded-xl pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <FormikFieldError error={formik.errors.confirmPassword} touched={formik.touched.confirmPassword} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  value={formik.values.role}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FormikFieldError error={formik.errors.role} touched={formik.touched.role} />
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-background/70 p-3">
                <Checkbox
                  id="termsAccepted"
                  name="termsAccepted"
                  checked={formik.values.termsAccepted}
                  onCheckedChange={(checked) => formik.setFieldValue('termsAccepted', checked === true)}
                />
                <Label htmlFor="termsAccepted" className="text-sm leading-5 text-muted-foreground cursor-pointer">
                  I agree to the terms and conditions and privacy policy.
                </Label>
              </div>
              <FormikFieldError error={formik.errors.termsAccepted} touched={formik.touched.termsAccepted} />

              <Button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full h-12 rounded-xl text-base font-semibold btn-3d shadow-primary-glow group"
              >
                {formik.isSubmitting ? 'Creating account...' : 'Create account'}
                {!formik.isSubmitting && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;