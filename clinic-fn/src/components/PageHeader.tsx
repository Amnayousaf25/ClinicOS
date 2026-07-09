import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Tailwind color token used for the icon bg/foreground (e.g. 'primary', 'secondary'). */
  tone?: 'primary' | 'secondary';
  /** Right-side actions (search, filters, buttons). */
  actions?: React.ReactNode;
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<Props['tone']>, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
};

/**
 * Standard page header — icon pill + title + optional subtitle, with
 * an actions slot on the right. Used by every list page so the visual
 * rhythm at the top of each route stays consistent.
 */
export const PageHeader = ({
  icon: Icon,
  title,
  subtitle,
  tone = 'primary',
  actions,
  className,
}: Props) => (
  <div
    className={cn(
      'flex flex-col sm:flex-row sm:items-center justify-between gap-4',
      className,
    )}
  >
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          TONE_CLASSES[tone],
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
    {actions && (
      <div className="flex items-center gap-3 flex-wrap">{actions}</div>
    )}
  </div>
);
