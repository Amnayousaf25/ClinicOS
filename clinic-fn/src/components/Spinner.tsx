import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

/**
 * Single spinner used everywhere — never inline `<Loader2 ... animate-spin />`
 * directly. Defaults: medium size, primary color. Pass `className` to override
 * color (e.g. `text-muted-foreground`) or layout.
 */
export const Spinner = ({ size = 'md', className }: SpinnerProps) => (
  <Loader2
    className={cn(SIZE_CLASSES[size], 'animate-spin text-primary', className)}
  />
);

type Padding = 'sm' | 'md' | 'lg';

const PADDING_CLASSES: Record<Padding, string> = {
  sm: 'py-12',
  md: 'py-16',
  lg: 'py-24',
};

/**
 * Full-block centered spinner, for page-load and section-load states.
 * `padding` defaults to `lg` (route-level loader). Use `sm`/`md` for
 * spinners inside an existing container.
 */
export const PageSpinner = ({
  padding = 'lg',
  className,
}: {
  padding?: Padding;
  className?: string;
}) => (
  <div
    className={cn(
      'flex items-center justify-center',
      PADDING_CLASSES[padding],
      className,
    )}
  >
    <Spinner size="md" />
  </div>
);
