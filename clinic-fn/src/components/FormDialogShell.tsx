import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Right-aligned slot in the header — e.g. an Edit button. */
  headerActions?: React.ReactNode;
  /** Optional trigger element — if omitted, the dialog is fully controlled. */
  trigger?: React.ReactNode;
  /** Sticky footer content — typically Cancel + Submit buttons. */
  footer?: React.ReactNode;
  /** Tailwind max-width override — default 'sm:max-w-lg'. */
  maxWidth?: string;
  children: React.ReactNode;
}

/**
 * Standard form-dialog layout: bordered header, scrollable body, sticky
 * footer. Replaces the manually-constructed Dialog scaffolding repeated
 * across NewAppointmentDialog, PatientDialog, intake forms, etc.
 */
export const FormDialogShell = ({
  open,
  onOpenChange,
  title,
  description,
  headerActions,
  trigger,
  footer,
  maxWidth = 'sm:max-w-lg',
  children,
}: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
    <DialogContent
      className={cn(
        maxWidth,
        'rounded-2xl p-0 max-h-[90vh] overflow-hidden',
      )}
    >
      <DialogHeader className="px-6 py-4 border-b border-border/60">
        <div className="flex items-center justify-between gap-3">
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          {headerActions}
        </div>
        {description ? (
          <DialogDescription>{description}</DialogDescription>
        ) : (
          <DialogDescription className="sr-only">{title}</DialogDescription>
        )}
      </DialogHeader>
      <div className="flex flex-col max-h-[calc(90vh-74px)]">
        <div className="flex-1 overflow-y-auto px-6 pt-3 pb-4 space-y-4">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-border/60 bg-background">
            {footer}
          </div>
        )}
      </div>
    </DialogContent>
  </Dialog>
);
