import dayjs from 'dayjs';
import { Calendar, FileText, Mail, Phone } from 'lucide-react';
import type { IntakeForm } from '@/types';

interface Props {
  submission: IntakeForm;
}

/** Read-only view of a submitted intake form (the non-editing branch). */
export const IntakeFormReadView = ({ submission }: Props) => (
  <>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" /> Date of Birth
        </div>
        <p className="text-sm font-medium text-foreground">
          {dayjs(submission.dob).format('MMMM D, YYYY')}
        </p>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Phone className="w-3.5 h-3.5" /> Phone
        </div>
        <p className="text-sm font-medium text-foreground">{submission.phone}</p>
      </div>
      <div className="space-y-1 col-span-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="w-3.5 h-3.5" /> Email
        </div>
        <p className="text-sm font-medium text-foreground">{submission.email}</p>
      </div>
    </div>

    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <FileText className="w-3.5 h-3.5" /> Reason for Visit
      </div>
      <div className="p-3 rounded-xl bg-muted/60">
        <p className="text-sm text-foreground">{submission.reasonForVisit}</p>
      </div>
    </div>

    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <FileText className="w-3.5 h-3.5" /> Insurance Provider
      </div>
      <div className="p-3 rounded-xl bg-muted/60">
        <p className="text-sm text-foreground">
          {submission.insuranceProvider || 'Not provided'}
        </p>
      </div>
    </div>
  </>
);
