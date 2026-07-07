import {
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import type { Appointment } from '@/types';

interface StatCard {
  label: string;
  value: number;
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
}

interface Props {
  appointments: Appointment[];
  rangeLabel: string;
}

const buildStats = (apts: Appointment[], rangeLabel: string): StatCard[] => {
  const total = apts.length;
  const confirmed = apts.filter((a) => a.status === 'confirmed').length;
  const pending = apts.filter((a) => a.status === 'pending').length;
  const noShow = apts.filter((a) => a.status === 'no-show').length;
  const intakeCompleted = apts.filter(
    (a) => a.intakeStatus === 'confirmed' || a.intakeStatus === 'submitted',
  ).length;

  return [
    {
      label: `${rangeLabel} · Appointments`,
      value: total,
      icon: Calendar,
      gradient: 'from-primary/10 to-primary/5',
      iconColor: 'text-primary',
    },
    {
      label: 'Confirmed',
      value: confirmed,
      icon: CheckCircle,
      gradient: 'from-success/10 to-success/5',
      iconColor: 'text-success',
    },
    {
      label: 'Pending',
      value: pending,
      icon: Clock,
      gradient: 'from-warning/10 to-warning/5',
      iconColor: 'text-warning',
    },
    {
      label: 'No-shows',
      value: noShow,
      icon: UserX,
      gradient: 'from-destructive/10 to-destructive/5',
      iconColor: 'text-destructive',
    },
    {
      label: 'Forms Completed',
      value: intakeCompleted,
      icon: FileText,
      gradient: 'from-secondary/10 to-secondary/5',
      iconColor: 'text-secondary',
    },
  ];
};

export const StatCards = ({ appointments, rangeLabel }: Props) => {
  const cards = buildStats(appointments, rangeLabel);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((stat) => (
        <div
          key={stat.label}
          className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-4 sm:p-5 card-3d border border-border/50`}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`w-9 sm:w-10 h-9 sm:h-10 rounded-xl flex items-center justify-center bg-card shadow-3d ${stat.iconColor}`}
            >
              <stat.icon className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
};
