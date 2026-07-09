import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg';

interface Props {
  name: string;
  /** Tailwind gradient classes, e.g. 'from-primary/20 to-secondary/20'. */
  gradient?: string;
  /** Foreground text color class — defaults to 'text-primary'. */
  textColor?: string;
  size?: Size;
  className?: string;
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-xs',
  lg: 'w-14 h-14 text-lg',
};

/**
 * Round avatar bubble with initials. Centralized so name-derived
 * avatars look identical across patient cells, intake rows, detail
 * dialogs, and patient list cards.
 */
export const InitialsAvatar = ({
  name,
  gradient = 'from-primary/20 to-secondary/20',
  textColor = 'text-primary',
  size = 'sm',
  className,
}: Props) => (
  <div
    className={cn(
      'rounded-full bg-gradient-to-br flex items-center justify-center font-bold shrink-0',
      gradient,
      textColor,
      SIZE_CLASSES[size],
      className,
    )}
  >
    {getInitials(name)}
  </div>
);
