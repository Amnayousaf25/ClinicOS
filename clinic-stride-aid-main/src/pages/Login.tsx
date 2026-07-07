import { useState } from 'react';
import { useFormik } from 'formik';
import { useQueryClient } from '@tanstack/react-query';
import { loginApi, getApiErrorMessage } from '@/lib/authApi';
import { loginSchema } from '@/lib/authValidation';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormikFieldError } from '@/components/FormikFieldError';
import { toast } from 'sonner';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { LoginBrandPanel } from '@/components/login/LoginBrandPanel';
import { ForgotPasswordDialog } from '@/components/login/ForgotPasswordDialog';

const DEFAULT_LOGIN_EMAIL = 'tahir+a@geeksofkolachi.com';
const DEFAULT_LOGIN_PASSWORD = 'Test1234$';

const Login = () => {
  const [forgotOpen, setForgotOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: DEFAULT_LOGIN_EMAIL,
      password: DEFAULT_LOGIN_PASSWORD,
      rememberMe: false,
    },
    validationSchema: loginSchema,
    validateOnChange: true, // Ensured real-time keystroke evaluation
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(undefined);
      try {
        await loginApi(values.email, values.password, values.rememberMe);
        await queryClient.invalidateQueries({ queryKey: ['auth-me'] });
        toast.success('Welcome to ClinicOS!');
        navigate('/', { replace: true });
      } catch (err: unknown) {
        const message = getApiErrorMessage(err, 'Invalid credentials');
        setStatus(message);
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex">
      <LoginBrandPanel />

      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-muted/30">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <Logo size="lg" />
            <p className="text-muted-foreground text-sm mt-1">
              Clinic Management Platform
            </p>
          </div>

          <div className="space-y-2 mb-8">
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access your clinic dashboard
            </p>
          </div>

          <div className="bg-card rounded-2xl p-7 card-3d border border-border/50">
            <form onSubmit={formik.handleSubmit} className="space-y-5">
              {formik.status ? (
                <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formik.status}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@clinicos.com"
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setForgotOpen(true)}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="h-12 rounded-xl pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                  error={formik.errors.password}
                  touched={formik.touched.password}
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formik.values.rememberMe}
                    onChange={formik.handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    Remember me
                  </span>
                </label>
              </div>
              <Button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full h-12 rounded-xl text-base font-semibold btn-3d shadow-primary-glow group"
              >
                {formik.isSubmitting ? 'Signing in...' : 'Sign In'}
                {!formik.isSubmitting && (
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>

      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
    </div>
  );
};

export default Login;