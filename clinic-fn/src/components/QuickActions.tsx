import { type Appointment } from '@/types';
import { useSendAppointmentSms } from '@/hooks/useApi';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MessageSquare } from 'lucide-react';

const TERMINAL_STATUSES: Appointment['status'][] = [
  'arrived',
  'cancelled',
  'no-show',
];

export const QuickActions = ({ appointment }: { appointment: Appointment }) => {
  const sendSms = useSendAppointmentSms();

  const isSendingSms =
    sendSms.isPending && sendSms.variables === appointment._id;

  // Once the visit is over (arrived / cancelled / no-show) or the patient
  // has already submitted intake, the SMS reminder is no longer useful.
  const isIntakeSubmitted =
    appointment.intakeStatus === 'confirmed' ||
    appointment.intakeStatus === 'submitted';

  const isFinalized =
    TERMINAL_STATUSES.includes(appointment.status) || isIntakeSubmitted;

  const smsTooltip = isFinalized
    ? isIntakeSubmitted
      ? 'Intake already submitted'
      : `No actions for ${appointment.status} appointment`
    : isSendingSms
      ? 'Sending SMS...'
      : 'Send appointment SMS';

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => !isFinalized && sendSms.mutate(appointment._id)}
            disabled={isFinalized || isSendingSms}
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-secondary/30 text-secondary hover:bg-secondary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send appointment SMS"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{smsTooltip}</TooltipContent>
      </Tooltip>
    </div>
  );
};
