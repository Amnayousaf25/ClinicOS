import { Field, ErrorMessage } from 'formik';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TextFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

/** Label + Formik Field + ErrorMessage — the repeated triplet across the form. */
export const TextField = ({
  name,
  label,
  placeholder,
  type,
  required,
}: TextFieldProps) => (
  <div className="space-y-1.5">
    <Label htmlFor={name}>
      {label}
      {required ? ' *' : ''}
    </Label>
    <Field
      as={Input}
      id={name}
      name={name}
      type={type}
      placeholder={placeholder}
    />
    <ErrorMessage
      name={name}
      component="p"
      className="text-xs text-destructive"
    />
  </div>
);

export const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
    {children}
  </p>
);
