import { useState } from 'react';
import { type Appointment } from '@/types';
import { useSendAppointmentSms } from '@/hooks/useApi';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ClipboardPlus, MessageSquare } from 'lucide-react';
import NewIntakeFormDialog from '@/components/NewIntakeFormDialog';
import { cn } from '@/lib/utils';

const TERMINAL_STATUSES: Appointment['status'][] = [
  'arrived',
  'cancelled',
  'no-show',
];

export const QuickActions = ({ appointment }: { appointment: Appointment }) => {
  const sendSms = useSendAppointmentSms();
  const [intakeOpen, setIntakeOpen] = useState(false);

  const isSendingSms =
    sendSms.isPending && sendSms.variables === appointment._id;

  // Once the visit is over (arrived / cancelled / no-show) or the patient
  // has already submitted intake, the SMS reminder is no longer useful.
  const isIntakeSubmitted =
    appointment.intakeStatus === 'confirmed' ||
    appointment.intakeStatus === 'submitted';

  const isFinalized =
    TERMINAL_STATUSES.includes(appointment.status) || isIntakeSubmitted;

  // Intake button should be visible for non-terminal statuses when intake is not yet submitted/confirmed
  const showIntakeButton =
    (appointment.status === 'pending' ||
      appointment.status === 'confirmed' ||
      appointment.status === 'rescheduled') &&
    !isIntakeSubmitted;

  const smsTooltip = isFinalized
    ? isIntakeSubmitted
      ? 'Intake already submitted'
      : `No actions for ${appointment.status} appointment`
    : isSendingSms
      ? 'Sending SMS...'
      : 'Send appointment SMS';

  return (
    <div className="flex items-center gap-1">
      {showIntakeButton && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => !isIntakeSubmitted && setIntakeOpen(true)}
                disabled={isIntakeSubmitted}
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center border transition-colors',
                  isIntakeSubmitted
                    ? 'border-success/30 text-success bg-success/5 cursor-not-allowed opacity-80'
                    : 'border-primary/30 text-primary hover:bg-primary/10',
                )}
                aria-label={isIntakeSubmitted ? 'Intake completed' : 'Add intake form'}
              >
                <ClipboardPlus className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {isIntakeSubmitted ? 'Intake completed' : 'Add intake form'}
            </TooltipContent>
          </Tooltip>
          {!isIntakeSubmitted && (
            <NewIntakeFormDialog
              open={intakeOpen}
              onOpenChange={setIntakeOpen}
              prefillAppointment={appointment}
            />
          )}
        </>
      )}
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
