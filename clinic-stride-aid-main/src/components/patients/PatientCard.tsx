import { InitialsAvatar } from '@/components/InitialsAvatar';
import { patientEmail, patientName } from '@/lib/appointmentDisplay';
import type { Appointment } from '@/types';

const GRADIENTS = [
  'from-primary/80 to-secondary/60',
  'from-success/70 to-accent/60',
  'from-warning/70 to-destructive/40',
  'from-secondary/70 to-primary/50',
  'from-accent/70 to-success/50',
  'from-info/70 to-primary/50',
];

interface Props {
  patient: Appointment;
  totalVisits: number;
  /** Used to rotate avatar gradient deterministically across the grid. */
  index: number;
  onClick: () => void;
}

export const PatientCard = ({ patient, totalVisits, index, onClick }: Props) => (
  <button
    onClick={onClick}
    className="bg-card rounded-2xl p-4 card-3d border border-border/50 text-left transition-all w-full hover:border-primary/30 hover:shadow-lg"
  >
    <div className="flex items-center gap-3 mb-3">
      <InitialsAvatar
        name={patientName(patient)}
        size="md"
        gradient={GRADIENTS[index % GRADIENTS.length]}
        textColor="text-primary-foreground"
        className="shadow-3d"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm">{patientName(patient)}</p>
        <p className="text-[11px] text-muted-foreground truncate">{patientEmail(patient)}</p>
      </div>
    </div>
    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
      <span>{totalVisits} visits</span>
    </div>
  </button>
);
