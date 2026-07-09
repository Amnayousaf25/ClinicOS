import dayjs from 'dayjs';
import { ClipboardList } from 'lucide-react';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import type { IntakeRowSummary } from './IntakeFormDetailDialog';

interface Props {
  rows: IntakeRowSummary[];
  onSelect: (row: IntakeRowSummary) => void;
}

export const IntakeFormsTable = ({ rows, onSelect }: Props) => {
  if (rows.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-2xl card-3d">
        <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-lg font-medium text-muted-foreground">
          No intake forms found
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl card-3d overflow-hidden border border-border/50">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Patient</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Service</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Date</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Time</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onSelect(row)}
                className="border-b border-border last:border-0 hover:bg-primary/[0.03] transition-colors cursor-pointer"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <InitialsAvatar
                      name={row.patientName}
                      gradient="from-secondary/20 to-primary/20"
                      textColor="text-secondary"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{row.patientName}</p>
                      <p className="text-xs text-muted-foreground">{row.patientEmail}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-foreground">{row.service}</td>
                <td className="px-5 py-4 text-sm text-foreground whitespace-nowrap">
                  {dayjs(row.date).format('MMM D, YYYY')}
                </td>
                <td className="px-5 py-4 text-sm text-foreground">{row.time}</td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success">
                    Confirmed
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
