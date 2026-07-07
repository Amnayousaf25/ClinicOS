import dayjs from 'dayjs';
import { Calendar, Clock, Mail, PencilLine, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/Spinner';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { AppointmentStatusBadge } from '@/components/StatusBadge';
import { patientEmail, patientName, patientPhone, serviceName } from '@/lib/appointmentDisplay';
import type { Appointment } from '@/types';

interface Props {
  /** Lightweight patient summary derived from the appointments list. */
  patient: Appointment | null;
  /** Visit history rows for this patient, already sorted newest-first. */
  appointments: Appointment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Click handler for the "Edit Profile" button — kicks off the patient lookup. */
  onEdit: () => void;
  editLoading: boolean;
}

/**
 * Read-only patient profile + visit history modal. The Patients page
 * derives rows from appointments (no full Patient FK), so we only need
 * the summary fields the appointment carries plus the visit history
 * the page already filters.
 */
export const PatientDetailDialog = ({
  patient,
  appointments,
  open,
  onOpenChange,
  onEdit,
  editLoading,
}: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader className="pr-12">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <DialogTitle className="text-lg font-bold">Patient Details</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review profile and visit history in one place.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={editLoading}
            onClick={onEdit}
          >
            {editLoading ? (
              <Spinner size="sm" className="mr-2 text-current" />
            ) : (
              <PencilLine className="w-4 h-4 mr-2" />
            )}
            Edit Profile
          </Button>
        </div>
      </DialogHeader>
      {patient && (
        <div className="space-y-5 mt-2">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/60">
            <InitialsAvatar
              name={patientName(patient)}
              size="lg"
              gradient="from-primary/80 to-secondary/60"
              textColor="text-primary-foreground"
              className="shadow-3d"
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{patientName(patient)}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-1">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  {patientEmail(patient)}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  {patientPhone(patient)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{appointments.length}</p>
              <p className="text-[10px] text-muted-foreground">Total Visits</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">
                {appointments.length > 0
                  ? dayjs(appointments[0].date).format('MMM D')
                  : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground">Last Visit</p>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="p-3 border-b border-border flex items-center gap-2 bg-muted/30">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">Visit History</h3>
            </div>
            <div className="divide-y divide-border max-h-60 overflow-y-auto">
              {appointments.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No visits yet</p>
              ) : (
                appointments.map((apt) => (
                  <div key={apt._id} className="p-3 flex items-center gap-4">
                    <div className="text-center shrink-0 w-12">
                      <p className="text-xs font-bold text-foreground">{dayjs(apt.date).format('MMM')}</p>
                      <p className="text-lg font-bold text-primary">{dayjs(apt.date).format('D')}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{serviceName(apt)}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{apt.time}</span>
                      </div>
                    </div>
                    <AppointmentStatusBadge status={apt.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
);
