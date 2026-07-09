import {
  CalendarCheck,
  Users,
  ClipboardList,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import Logo from '@/components/Logo';

const FEATURES: ReadonlyArray<{ icon: LucideIcon; title: string; desc: string }> = [
  { icon: CalendarCheck, title: 'Smart Scheduling', desc: 'Automated booking with real-time availability' },
  { icon: Users, title: 'Patient Management', desc: 'Complete patient records at your fingertips' },
  { icon: ClipboardList, title: 'Digital Intake', desc: 'Paperless forms sent automatically' },
  { icon: MessageSquare, title: 'SMS Reminders', desc: 'Reduce no-shows with automated alerts' },
];

/** Marketing/brand panel rendered on the left side of the Login route on lg+. */
export const LoginBrandPanel = () => (
  <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-secondary relative overflow-hidden flex-col justify-between p-12 text-primary-foreground">
    <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
    <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5" />
    <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-white/[0.03]" />

    <div className="relative z-10">
      <Logo size="lg" variant="white" />
      <p className="mt-2 text-primary-foreground/70 text-sm font-medium">Clinic Management Platform</p>
    </div>

    <div className="relative z-10 space-y-3">
      <h2 className="text-3xl font-bold leading-tight">
        Everything your clinic
        <br />
        needs in one place.
      </h2>
      <p className="text-primary-foreground/60 text-sm max-w-sm">
        Streamline appointments, automate reminders, and digitise patient intake — all from a single dashboard.
      </p>
    </div>

    <div className="relative z-10 grid grid-cols-2 gap-4">
      {FEATURES.map((f) => (
        <div
          key={f.title}
          className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.08] backdrop-blur-sm"
        >
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <f.icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{f.title}</p>
            <p className="text-xs text-primary-foreground/50 leading-snug">{f.desc}</p>
          </div>
        </div>
      ))}
    </div>

    <p className="relative z-10 text-xs text-primary-foreground/30">
      © 2026 ClinicOS. All rights reserved.
    </p>
  </div>
);
