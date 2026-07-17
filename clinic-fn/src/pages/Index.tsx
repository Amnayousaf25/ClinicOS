import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Logo from '@/components/Logo';
import BookDemoDialog from '@/components/BookDemoDialog';
import dayjs from 'dayjs';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
} from 'framer-motion';
import clinicInterior from '@/assets/clinic-interior.jpg';
import doctorTablet from '@/assets/doctor-tablet.jpg';
import patientDoctor from '@/assets/patient-doctor.jpg';
import {
  Calendar,
  ClipboardList,
  Users,
  BarChart3,
  Clock,
  ArrowRight,
  CheckCircle,
  Star,
  Sparkles,
  MessageSquare,
  Bell,
  TrendingUp,
  Search,
  Home,
  Settings as SettingsIcon,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.45, ease } }),
};
const viewportOnce = { once: true, amount: 0.25 };

// ─────────── Working dashboard prototype (right under hero) ───────────
const sampleAppointments = [
  { time: '09:00', name: 'Emma Wilson', service: 'Consultation', status: 'confirmed', initials: 'EW' },
  { time: '09:30', name: 'James Carter', service: 'Follow-up', status: 'confirmed', initials: 'JC' },
  { time: '10:15', name: 'Olivia Brown', service: 'Check-up', status: 'pending', initials: 'OB' },
  { time: '11:00', name: 'Noah Garcia', service: 'Vaccination', status: 'confirmed', initials: 'NG' },
  { time: '11:45', name: 'Ava Martinez', service: 'Therapy', status: 'pending', initials: 'AM' },
  { time: '13:30', name: 'Liam Anderson', service: 'Consultation', status: 'confirmed', initials: 'LA' },
];

const dashboardTabs = ['Today', 'Patients', 'Calendar', 'Reports'] as const;
type DashTab = typeof dashboardTabs[number];

// Map sidebar labels to the matching tab
const sidebarTabMap: Record<string, DashTab | null> = {
  Dashboard: 'Today',
  Appointments: 'Today',
  Patients: 'Patients',
  Intake: null,
  Reports: 'Reports',
  Settings: null,
};

const DashboardPrototype = () => {
  const [tab, setTab] = useState<DashTab>('Today');
  const [tick, setTick] = useState(0);
  const [userOverride, setUserOverride] = useState(false);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const i = setInterval(() => setTick((t) => t + 1), 2200);
    return () => clearInterval(i);
  }, [reduce]);
  // Auto-rotate tabs — pause while user has manually clicked
  useEffect(() => {
    if (reduce || userOverride) return;
    const i = setInterval(() => {
      setTab((t) => {
        const idx = dashboardTabs.indexOf(t);
        return dashboardTabs[(idx + 1) % dashboardTabs.length];
      });
    }, 4000);
    return () => clearInterval(i);
  }, [reduce, userOverride]);
  const liveCount = 24 + (tick % 3);

  const handleSidebarClick = (label: string) => {
    const mapped = sidebarTabMap[label];
    if (mapped) {
      setTab(mapped);
      setUserOverride(true);
    }
  };

  return (
    <div className="relative rounded-[2rem] bg-black p-2 lg:p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)]">
      <div className="absolute left-1/2 -translate-x-1/2 -top-1 h-1.5 w-24 rounded-full bg-neutral-800" />
      <div className="relative rounded-[1.5rem] bg-card overflow-hidden border border-neutral-900/10">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/40">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-destructive/70" />
            <span className="w-3 h-3 rounded-full bg-warning/80" />
            <span className="w-3 h-3 rounded-full bg-success/80" />
          </div>
          <div className="flex-1 mx-4 px-3 py-1 rounded-md bg-card text-[11px] text-muted-foreground font-medium border border-border/40 truncate">
            app.clinicos.io/dashboard
          </div>
        </div>

        <div className="grid grid-cols-12 h-[520px]">
          {/* Sidebar */}
          <aside className="col-span-3 lg:col-span-2 border-r border-border/40 p-3 bg-sidebar">
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-extrabold">C</div>
              <span className="text-xs font-bold text-foreground hidden lg:block">ClinicOS</span>
            </div>
            <div className="mt-4 space-y-1">
              {[
                { icon: Home, label: 'Dashboard' },
                { icon: Calendar, label: 'Appointments' },
                { icon: Users, label: 'Patients' },
                { icon: ClipboardList, label: 'Intake' },
                { icon: BarChart3, label: 'Reports' },
                { icon: SettingsIcon, label: 'Settings' },
              ].map((it) => {
                const mapped = sidebarTabMap[it.label];
                const isActive = mapped === tab || (it.label === 'Dashboard' && tab === 'Today' && !['Patients','Reports'].includes(tab));
                return (
                  <div
                    key={it.label}
                    onClick={() => handleSidebarClick(it.label)}
                    title={mapped ? `View ${it.label}` : it.label}
                    className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors select-none ${
                      mapped === tab
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-muted'
                    }`}
                  >
                    <it.icon className="w-4 h-4 shrink-0" />
                    <span className="hidden lg:inline truncate">{it.label}</span>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Main */}
          <main className="col-span-9 lg:col-span-10 p-5 lg:p-6 flex flex-col min-w-0 overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
              <div className="flex-1 max-w-xs relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <div className="pl-9 pr-3 py-2 rounded-lg bg-muted text-[11px] text-muted-foreground">Search patients...</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-full bg-muted flex items-center justify-center transition-transform duration-300 hover:scale-105">
                  <Bell className="w-4 h-4 text-foreground" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive" />
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center text-[10px] font-bold">SM</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-4 border-b border-border/40 shrink-0">
              {dashboardTabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="relative flex-1 min-h-0 overflow-hidden">
              <AnimatePresence mode="wait">
                {tab === 'Today' && (
                  <motion.div key="today" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                      {[
                        { label: 'Today', value: liveCount, sub: 'appointments', up: true },
                        { label: 'Confirmed', value: 18, sub: '+3 vs yesterday', up: true },
                        { label: 'Pending', value: 4, sub: 'awaiting confirm', up: false },
                        { label: 'No-shows', value: 2, sub: '↓ 42% this month', up: true },
                      ].map((s, i) => (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                          className="rounded-xl p-3 bg-card border border-border/40 shadow-3d">
                          <p className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">{s.label}</p>
                          <div className="flex items-end justify-between mt-1">
                            <motion.p key={s.value} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                              className="text-2xl font-extrabold text-foreground">{s.value}</motion.p>
                            <TrendingUp className={`w-4 h-4 ${s.up ? 'text-success' : 'text-warning'}`} />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Appointments list */}
                    <div className="rounded-xl border border-border/40 overflow-hidden">
                      <div className="px-3 py-2 bg-muted/50 flex items-center justify-between">
                        <p className="text-xs font-bold text-foreground">Today's appointments</p>
                        <span className="text-[10px] text-muted-foreground">Live</span>
                      </div>
                      <div className="divide-y divide-border/40">
                        {sampleAppointments.slice(0, 5).map((a, i) => (
                          <motion.div key={a.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">{a.initials}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{a.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{a.service}</p>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-muted-foreground">{a.time}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${a.status === 'confirmed'
                              ? 'bg-success/15 text-success'
                              : 'bg-warning/15 text-warning'
                              }`}>{a.status}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {tab === 'Patients' && (
                  <motion.div key="patients" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {sampleAppointments.slice(0, 6).map((p, i) => (
                      <motion.div key={p.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                        className="rounded-xl p-3 border border-border/40 bg-card flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center text-xs font-bold">{p.initials}</div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">Last visit · {p.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {tab === 'Calendar' && (
                  <motion.div key="cal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: 28 }).map((_, i) => {
                      const busy = [3, 7, 11, 12, 18, 22, 25].includes(i);
                      const today = i === 14;
                      return (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.012 }}
                          className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold ${today ? 'bg-primary text-primary-foreground' : busy ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                            }`}>
                          {i + 1}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

                {tab === 'Reports' && (
                  <motion.div key="rep" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="rounded-xl border border-border/40 p-4 bg-card">
                    <p className="text-xs font-bold text-foreground mb-3">Weekly visits</p>
                    <div className="flex items-end gap-2 h-32">
                      {[40, 65, 50, 80, 70, 90, 55].map((h, i) => (
                        <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: h / 100 }} transition={{ delay: i * 0.03, duration: 0.45, ease }}
                          className="flex-1 h-full origin-bottom bg-gradient-to-t from-primary to-secondary rounded-t-md" />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-semibold">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

// (decorative scribbles removed)

// ─────────── Per-feature animated showcases ───────────
const SchedulingShowcase = () => (
  <div className="relative rounded-3xl gradient-border shadow-3d p-6 overflow-hidden">
    <div className="grid grid-cols-7 gap-1.5 mb-4">
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, index) => (
        <div key={`${d}-${index}`} className="text-center text-[10px] font-bold text-muted-foreground">{d}</div>
      ))}
      {Array.from({ length: 21 }).map((_, i) => {
        const active = [4, 9, 14].includes(i);
        return (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce}
            transition={{ delay: i * 0.01, duration: 0.3, ease }}
            className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
            {i + 1}
          </motion.div>
        );
      })}
    </div>
    <div className="space-y-2">
      {['09:00 — Consultation', '11:30 — Follow-up', '14:00 — Check-up'].map((s, i) => (
        <motion.div key={s} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewportOnce}
          transition={{ delay: 0.18 + i * 0.05, duration: 0.35, ease }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/8 text-xs font-semibold text-foreground">
          <Clock className="w-3.5 h-3.5 text-primary" /> {s}
        </motion.div>
      ))}
    </div>
  </div>
);

const IntakeShowcase = () => (
  <div className="relative rounded-3xl gradient-border shadow-3d p-6 overflow-hidden">
    <div className="space-y-3">
      {[
        { label: 'Full name', value: 'Emma Wilson' },
        { label: 'Date of birth', value: '04 / 12 / 1989' },
        { label: 'Insurance', value: 'BlueCross #4421' },
      ].map((f, i) => (
        <motion.div key={f.label} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce}
          transition={{ delay: i * 0.06, duration: 0.35, ease }}>
          <p className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground mb-1">{f.label}</p>
          <div className="px-3 py-2 rounded-lg border border-border bg-muted/30 text-xs font-semibold text-foreground flex items-center justify-between">
            <span>{f.value}</span>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={viewportOnce} transition={{ delay: 0.18 + i * 0.05, duration: 0.25, ease }}>
              <CheckCircle className="w-4 h-4 text-success" />
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
    <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={viewportOnce} transition={{ delay: 0.35, duration: 0.35, ease }}
      className="mt-4 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold text-center">
      Submit intake form
    </motion.div>
  </div>
);

const ReminderShowcase = () => (
  <div className="relative rounded-3xl gradient-border shadow-3d p-6 overflow-hidden">
    <div className="space-y-2">
      {[
        { from: 'ClinicOS', text: 'Hi Emma, reminder: appointment tomorrow at 09:00.', side: 'left' },
        { from: 'Emma', text: 'Confirmed, see you then 👍', side: 'right' },
        { from: 'ClinicOS', text: 'Great! We sent your intake form link.', side: 'left' },
      ].map((m, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce}
          transition={{ delay: i * 0.08, duration: 0.35, ease }}
          className={`flex ${m.side === 'right' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${m.side === 'right' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
            }`}>{m.text}</div>
        </motion.div>
      ))}
    </div>
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={viewportOnce} transition={{ delay: 0.32, duration: 0.3, ease }}
      className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
      <span className="w-2 h-2 rounded-full bg-success" /> Auto-sent 24h & 2h before visit
    </motion.div>
  </div>
);

const AnalyticsShowcase = () => (
  <div className="relative rounded-3xl gradient-border shadow-3d p-6 overflow-hidden">
    <div className="flex items-end gap-2 h-40 mb-3">
      {[35, 55, 45, 70, 60, 85, 75, 95].map((h, i) => (
        <motion.div key={i} initial={{ scaleY: 0 }} whileInView={{ scaleY: h / 100 }} viewport={viewportOnce}
          transition={{ delay: i * 0.03, duration: 0.45, ease }}
          className="flex-1 h-full origin-bottom bg-gradient-to-t from-primary to-secondary rounded-t-md" />
      ))}
    </div>
    <div className="flex items-center justify-between text-xs">
      <div>
        <p className="font-bold text-foreground">Revenue this month</p>
        <p className="text-muted-foreground text-[10px]">vs last month</p>
      </div>
      <motion.p initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={viewportOnce} transition={{ delay: 0.32, duration: 0.3, ease }}
        className="text-2xl font-extrabold text-success">+38%</motion.p>
    </div>
  </div>
);

type FeatureBlock = {
  tag: string;
  title: string;
  subtitle: string;
  desc: string;
  icon: typeof Calendar;
  showcase: React.ReactNode;
  flip?: boolean;
  photo?: string;
};

const featureBlocks: FeatureBlock[] = [
  {
    tag: 'Scheduling',
    title: 'Book. Confirm. Done.',
    subtitle: 'Smart scheduling that adapts to your clinic.',
    desc: 'Real-time availability, conflict detection, and one-click rescheduling — built for the way real clinics work.',
    icon: Calendar,
    showcase: <SchedulingShowcase />,
  },
  {
    tag: 'Digital intake',
    title: 'Paperless from day one.',
    subtitle: 'Patients fill in everything before they arrive.',
    desc: 'Insurance, history, allergies, consent — captured digitally and synced straight to the patient record.',
    icon: ClipboardList,
    showcase: <IntakeShowcase />,
    flip: true,
    photo: doctorTablet,
  },
  {
    tag: 'SMS Reminders',
    title: 'Never another no-show.',
    subtitle: 'Automated reminders that patients actually read.',
    desc: 'Send 24h and 2h reminders by SMS, capture confirmations automatically, and slash no-shows by 40%.',
    icon: MessageSquare,
    showcase: <ReminderShowcase />,
  },
  {
    tag: 'Analytics',
    title: 'See your clinic clearly.',
    subtitle: 'Live KPIs that drive better decisions.',
    desc: 'Revenue, no-show rate, average visit value, retention — all in one dashboard, updated in real time.',
    icon: BarChart3,
    showcase: <AnalyticsShowcase />,
    flip: true,
    photo: patientDoctor,
  },
];

const FeatureSection = ({ block }: { block: FeatureBlock }) => (
  <section className="py-12 lg:py-16">
    <div className="max-w-7xl mx-auto px-6">
      <div className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${block.flip ? 'lg:[&>*:first-child]:order-2' : ''}`}>
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce} transition={{ duration: 0.45, ease }}>
          <div className="inline-flex items-center gap-2 text-primary text-xs font-bold tracking-widest uppercase mb-4">
            <block.icon className="w-3.5 h-3.5" /> {block.tag}
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.05]">
            {block.title}
          </h2>
          <p className="mt-4 text-lg lg:text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {block.subtitle}
          </p>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-md">
            {block.desc}
          </p>
          <Link to="/login">
            <Button className="mt-7 rounded-full h-12 px-6 text-sm font-bold bg-foreground text-background hover:bg-foreground/90 group shadow-lg">
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportOnce}
          transition={{ duration: 0.5, ease, delay: 0.05 }}
          className="relative">
          <div className="absolute -inset-8 bg-primary/15 blur-3xl rounded-full -z-10" />
          {block.photo && (
            <motion.img
              src={block.photo}
              alt=""
              loading="lazy"
              width={800}
              height={600}
              initial={{ opacity: 0, x: block.flip ? -12 : 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewportOnce}
              transition={{ delay: 0.16, duration: 0.45, ease }}
              className={`absolute ${block.flip ? '-left-6 -bottom-6' : '-right-6 -bottom-6'} w-40 h-40 lg:w-52 lg:h-52 object-cover rounded-2xl shadow-3d-hover border-4 border-card hidden md:block`}
            />
          )}
          {block.showcase}
        </motion.div>
      </div>

    </div>
  </section>
);

// ─────────── Page ───────────
const stats = [
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '40%', label: 'Fewer No-shows' },
  { value: '10k+', label: 'Appointments/mo' },
  { value: '500+', label: 'Clinics Onboard' },
];

const testimonials = [
  { name: 'Dr. Sarah Mitchell', role: 'Family Practice', quote: 'ClinicOS transformed how we manage patients. The intake forms alone saved us 3 hours daily.', avatar: 'SM' },
  { name: 'Dr. James Lee', role: 'Physiotherapy', quote: 'Scheduling is incredibly intuitive. Our staff onboarded in minutes.', avatar: 'JL' },
  { name: 'Dr. Priya Sharma', role: 'Dermatology', quote: 'No-shows dropped 35% after enabling SMS reminders. Game changer.', avatar: 'PS' },
];

// ─────────── Animated mesh + grid background ───────────
const MeshBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 grid-bg mask-radial opacity-60" />
    <div className="absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full blob"
      style={{ background: 'radial-gradient(circle, hsl(199 89% 60% / 0.35), transparent 60%)', filter: 'blur(40px)', willChange: 'transform' }} />
    <div className="absolute top-20 -right-32 w-[32rem] h-[32rem] rounded-full blob"
      style={{ background: 'radial-gradient(circle, hsl(258 80% 65% / 0.3), transparent 60%)', filter: 'blur(40px)', animationDelay: '4s', willChange: 'transform' }} />
  </div>
);


// ─────────── Per-word kinetic title (replays on scroll up & down) ───────────
const KineticTitle = ({ children }: { children: string }) => {
  const words = children.split(' ');
  const reduce = useReducedMotion();
  return (
    <h1 className="mt-6 text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.05] text-foreground max-w-4xl mx-auto">
      {words.map((w, i) => {
        const accent = ['Clinic', 'care.', 'Automated.', 'Effortless.'].includes(w);
        const accentClass = accent
          ? 'bg-gradient-to-br from-primary via-secondary to-accent bg-clip-text text-transparent'
          : '';
        if (reduce) {
          return (
            <span key={i} className="inline-block mr-3 lg:mr-4">
              <span className={accentClass}>{w}</span>
            </span>
          );
        }
        return (
          <span key={i} className="inline-block overflow-hidden align-bottom mr-3 lg:mr-4">
            <motion.span
              initial={{ y: '110%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block will-change-transform"
            >
              <span className={accentClass}>{w}</span>
            </motion.span>
          </span>
        );
      })}
    </h1>
  );
};



// ─────────── Photo slideshow ───────────
const slides = [
  { src: clinicInterior, eyebrow: 'Modern Spaces', title: 'Designed for calm, built for care.', desc: 'Bright, welcoming clinic environments where patients feel at ease the moment they walk in.' },
  { src: doctorTablet, eyebrow: 'Smart Tools', title: 'Every chart, one tap away.', desc: 'Practitioners get the full patient picture instantly — no clicks lost, no notes forgotten.' },
  { src: patientDoctor, eyebrow: 'Real Connection', title: 'More time with patients.', desc: 'Less admin, more eye contact. ClinicOS gives the conversation back to your team.' },
];

const PhotoSlideshow = () => {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = (n: number) => setIdx((n + slides.length) % slides.length);
  const next = () => setIdx((p) => (p + 1) % slides.length);
  const prev = () => setIdx((p) => (p - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (paused || reduce) return;
    const i = setInterval(() => setIdx((p) => (p + 1) % slides.length), 6000);
    return () => clearInterval(i);
  }, [paused, reduce]);


  const current = slides[idx];

  return (
    <section className="py-14 lg:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="relative rounded-[2rem] overflow-hidden aspect-[16/9] md:aspect-[21/9] shadow-3d-hover bg-foreground isolate"
        >
          {/* Image layer */}
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={idx}
              className="absolute inset-0"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
              transition={{ duration: reduce ? 0.2 : 0.55, ease }}
            >
              <img
                src={current.src}
                alt={current.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Caption — staggered word reveal */}
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-14 lg:p-20 text-white pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial="hidden"
                animate="show"
                exit="hidden"
                variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.035, delayChildren: reduce ? 0 : 0.12 } } }}
                className="max-w-2xl"
              >
                <motion.p
                  variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.35, ease }}
                  className="text-[11px] font-bold tracking-[0.25em] uppercase text-white/70 mb-3"
                >
                  {current.eyebrow}
                </motion.p>
                <h3 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] overflow-hidden">
                  {current.title.split(' ').map((w, i) => (
                    <span key={i} className="inline-block overflow-hidden align-bottom mr-2">
                      <motion.span
                        variants={{ hidden: { y: '110%' }, show: { y: 0 } }}
                        transition={{ duration: 0.42, ease }}
                        className="inline-block"
                      >
                        {w}
                      </motion.span>
                    </span>
                  ))}
                </h3>
                <motion.p
                  variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.4, ease }}
                  className="mt-4 text-sm md:text-base text-white/80 max-w-lg leading-relaxed"
                >
                  {current.desc}
                </motion.p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 flex items-center gap-3 z-10">
            <span className="text-white/80 text-xs font-bold tabular-nums tracking-widest">
              {String(idx + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </span>
            <button onClick={prev} className="w-10 h-10 rounded-full border border-white/30 hover:bg-white hover:text-foreground text-white flex items-center justify-center transition-colors" aria-label="Previous slide">
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
            <button onClick={next} className="w-10 h-10 rounded-full border border-white/30 hover:bg-white hover:text-foreground text-white flex items-center justify-center transition-colors" aria-label="Next slide">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bars */}
          <div className="absolute bottom-6 left-6 md:bottom-12 md:left-14 right-32 md:right-56 flex gap-2 z-10">
            {slides.map((_, i) => (
              <button key={i} onClick={() => go(i)} className="relative h-[2px] flex-1 bg-white/25 overflow-hidden" aria-label={`Go to slide ${i + 1}`}>
                {i === idx && !paused && (
                  <motion.span
                    key={`bar-${idx}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 6, ease: 'linear' }}
                    className="absolute inset-y-0 left-0 w-full origin-left bg-white"
                  />
                )}
                {i < idx && <span className="absolute inset-0 bg-white" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};



// ─────────── Tilt wrapper (imperative, no re-renders) ───────────
const TiltWrapper = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const rafRef = useRef<number | null>(null);
  if (reduce) return <div>{children}</div>;
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          el.style.transform = `perspective(1400px) rotateX(${-py * 4}deg) rotateY(${px * 6}deg) translateZ(0)`;
        });
      }}
      onMouseLeave={() => {
        const el = ref.current;
        if (!el) return;
        el.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg) translateZ(0)';
      }}
      style={{ transition: 'transform 0.5s cubic-bezier(.22,1,.36,1)', transformStyle: 'preserve-3d', willChange: 'transform' }}
    >
      {children}
    </div>
  );
};


// ─────────── Scroll-driven scaling dashboard (Sandelia-style) ───────────
const ScrollScaleDashboard = () => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  // Grow from 0.85 → 1 as the dashboard enters the viewport, then hold
  const rawScale = useTransform(scrollYProgress, [0, 0.45, 1], [0.85, 1, 1]);
  const rawY = useTransform(scrollYProgress, [0, 0.45, 1], [40, 0, 0]);
  const scale = useSpring(rawScale, { stiffness: 120, damping: 24, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 120, damping: 24, mass: 0.4 });

  return (
    <div ref={ref} id="preview" className="relative mt-8 lg:mt-12 max-w-6xl mx-auto">
      <div className="absolute -inset-12 bg-gradient-to-tr from-primary/20 via-secondary/15 to-accent/15 blur-3xl rounded-full -z-10 pointer-events-none" />
      <motion.div
        style={reduce ? undefined : { scale, y }}
        className="transform-gpu will-change-transform"
      >
        <TiltWrapper>
          <DashboardPrototype />
        </TiltWrapper>
      </motion.div>
    </div>
  );
};






const Index = () => {
  const [demoOpen, setDemoOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubmitting(true);
    // Redirect to /register with email pre-filled
    setTimeout(() => {
      navigate(`/register?email=${encodeURIComponent(newsletterEmail)}`);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <BookDemoDialog open={demoOpen} onOpenChange={setDemoOpen} />
      <div className="fixed inset-0 -z-20 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(199 60% 95%) 50%, hsl(258 50% 96%) 100%)' }} />


      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 mt-3">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between rounded-2xl glass backdrop-blur-md shadow-3d">
            <Link to="/"><Logo size="md" /></Link>
            <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#preview" className="hover:text-foreground transition-colors">Live preview</a>
              <a href="#testimonials" className="hover:text-foreground transition-colors">Customers</a>
              <button type="button" onClick={() => setDemoOpen(true)} className="hover:text-foreground transition-colors">Book demo</button>
            </nav>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setDemoOpen(true)} className="text-sm font-semibold text-foreground/70 hover:text-foreground px-3 hidden sm:block">
                Book demo
              </button>
              <Link to="/login">
                <Button className="cta-orbit rounded-full h-10 px-5 text-sm font-bold bg-foreground text-background hover:bg-foreground/90 shadow-lg">
                  Get Started Free
                </Button>
              </Link>
              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="max-w-7xl mx-auto mt-2 rounded-2xl glass backdrop-blur-md shadow-3d-hover border border-border/60 px-4 py-3 flex flex-col gap-1"
              >
                {[
                  { label: 'Features', href: '#features' },
                  { label: 'Live preview', href: '#preview' },
                  { label: 'Customers', href: '#testimonials' },
                ].map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    {label}
                  </a>
                ))}
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); setDemoOpen(true); }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  Book demo
                </button>
                <div className="border-t border-border/60 mt-1 pt-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full rounded-xl h-10 text-sm font-bold">Get Started Free</Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-24 pb-0 lg:pt-28 overflow-hidden noise">
        <MeshBackground />

        <div className="max-w-7xl mx-auto px-6 text-center relative">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase shadow-3d">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary/30" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-foreground/80">New · v3.0 · The Clinic OS</span>
            </div>
          </motion.div>

          <KineticTitle>Clinic care reimagined. Automated. Smart. Effortless.</KineticTitle>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7 }}
            className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Run your entire clinic from one place — appointments, intake, reminders & analytics in a single click.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7 }}
            className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/login">
              <Button size="lg" className="rounded-full h-14 px-8 text-base font-bold bg-foreground text-background hover:bg-foreground/90 group shadow-xl shadow-foreground/20">
                Get Started Free
                <span className="ml-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-background text-foreground group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Button>
            </Link>
            <Button type="button" onClick={() => setDemoOpen(true)} size="lg" variant="outline" className="rounded-full h-14 px-8 text-base font-bold bg-transparent border-2 border-foreground/20 hover:border-foreground/40 hover:bg-foreground/5">
              <span className="w-2 h-2 rounded-full bg-success mr-2" /> Book a live demo
            </Button>
          </motion.div>

          <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
            {['No credit card', '14-day free trial', 'Cancel anytime'].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                <CheckCircle className="w-4 h-4 text-primary" /> {t}
              </span>
            ))}
          </div>

          {/* Working dashboard preview — peek then scroll-grow */}
          <ScrollScaleDashboard />

        </div>
      </section>


      {/* STATS */}
      <section className="py-8">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial="hidden" whileInView="visible" viewport={{ amount: 0.3 }} custom={i} variants={fadeUp}
                className="text-center p-6 rounded-3xl gradient-border shadow-3d">
                <p className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1 font-semibold">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUSTED BY MARQUEE */}
      <section className="py-6 border-y border-border/40 bg-card/40">
        <p className="text-center text-[11px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-6">
          Trusted by 500+ clinics worldwide
        </p>
        <div className="overflow-hidden mask-x">
          <div className="marquee">
            {[...Array(2)].flatMap((_, k) =>
              ['MEDIVA', 'NORTHCARE', 'PULSEHEALTH', 'CLARIVISTA', 'WELLNEST', 'HEALTHARC', 'CARENOVA', 'VITALINK'].map((b, i) => (
                <span key={`${k}-${i}`} className="text-2xl lg:text-3xl font-extrabold tracking-tighter text-foreground/30 hover:text-foreground transition-colors whitespace-nowrap">
                  {b}
                </span>
              ))
            )}
          </div>
        </div>
      </section>


      {/* FEATURES section header */}
      <section id="features" className="pt-10 pb-2" style={{ scrollMarginTop: '90px' }}>

        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 text-primary text-xs font-bold tracking-widest uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Features
          </div>
          <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-foreground">
            Your clinic.<br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Automated. Intelligent. Effortless.</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Discover how ClinicOS transforms every aspect of your practice — from booking to billing — into a seamless AI-powered workflow.
          </p>
        </div>
      </section>

      {/* Per-feature animated showcases */}
      {featureBlocks.map((b) => (
        <FeatureSection key={b.tag} block={b} />
      ))}

      {/* PHOTO SLIDESHOW */}
      <PhotoSlideshow />


      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-16" style={{ scrollMarginTop: '90px' }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce} transition={{ duration: 0.45, ease }}
            className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
              Loved by clinics <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">everywhere.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-0">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ amount: 0.3 }} custom={i} variants={fadeUp}
                className="rounded-3xl p-8 gradient-border shadow-3d flex flex-col">
                <div className="flex items-center gap-1 mb-5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className="w-4 h-4 text-warning fill-warning" />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed flex-1 mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="py-12" style={{ scrollMarginTop: '90px' }}>
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={viewportOnce} transition={{ duration: 0.45, ease }}
            className="relative rounded-[2rem] overflow-hidden bg-foreground text-background p-12 lg:p-20 text-center">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, hsl(var(--primary)), transparent 60%), radial-gradient(circle at 70% 50%, hsl(var(--secondary)), transparent 60%)' }} />
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tight mb-4">
                Ready to modernize?
              </h2>
              <p className="text-lg opacity-80 mb-10 max-w-lg mx-auto">
                Join 500+ clinics running on ClinicOS. Start free — no credit card needed.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/register">
                  <Button size="lg" className="rounded-full h-14 px-10 text-base font-bold bg-background text-foreground hover:bg-background/90 shadow-xl">
                    Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-background/90 hover:text-background underline-offset-4 hover:underline">
                  Already have an account? Login
                </Link>
                <Button type="button" onClick={() => setDemoOpen(true)} size="lg" variant="outline" className="rounded-full h-14 px-10 text-base font-bold bg-transparent border-2 border-background/30 hover:border-background/60 hover:bg-background/10 text-background">
                  Book a Demo
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative pt-20 pb-10 px-4 sm:px-6">
        <div className="relative max-w-7xl mx-auto rounded-[2.5rem] overflow-hidden border border-border/60 bg-card/60 backdrop-blur-xl shadow-3d">
          {/* Aurora glow background */}
          <div aria-hidden className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-primary/25 blur-[120px]" />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-secondary/20 blur-[120px]" />
          <div aria-hidden className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-accent/15 blur-[120px]" />

          <div className="relative p-8 sm:p-12 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Brand + Newsletter */}
              <div className="lg:col-span-5 space-y-6">
                <Link to="/"><Logo size="md" /></Link>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                  The intelligent operating system for modern clinics. Scheduling, intake, reminders &amp; analytics — unified in one place.
                </p>

                {/* Newsletter / quick-signup card */}
                <div className="rounded-2xl border border-border/60 bg-background/60 backdrop-blur-sm p-5 max-w-md">
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground mb-1">Start your free account</p>
                  <p className="text-xs text-muted-foreground mb-3">Enter your email to get started. No credit card required.</p>
                  <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="you@clinic.com"
                      className="flex-1 min-w-0 h-10 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={newsletterSubmitting}
                      className="h-10 px-4 rounded-xl bg-foreground text-background text-sm font-bold hover:bg-foreground/90 active:scale-[0.97] transition-all whitespace-nowrap inline-flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {newsletterSubmitting ? (
                        <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      ) : (
                        <>
                          Sign Up
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Socials */}
                <div className="flex items-center gap-2 pt-1">
                  {[
                    { label: 'X', title: 'Follow on X (Twitter)', href: 'https://twitter.com' },
                    { label: 'in', title: 'Connect on LinkedIn', href: 'https://linkedin.com' },
                    { label: 'Gh', title: 'View on GitHub', href: 'https://github.com' },
                    { label: '@', title: 'Contact via Email', href: 'mailto:hello@clinicos.io' },
                  ].map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      title={s.title}
                      aria-label={s.title}
                      target={s.href.startsWith('http') ? '_blank' : undefined}
                      rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="group w-10 h-10 rounded-xl border border-border bg-background/60 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary/40 hover:-translate-y-0.5 transition-all"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8">
                {[
                  {
                    title: 'Product',
                    items: [
                      { label: 'Features', href: '#features' },
                      { label: 'Pricing', href: '#pricing' },
                      { label: 'Live preview', href: '#preview' },
                      { label: 'Customers', href: '#testimonials' },
                    ],
                  },
                  {
                    title: 'Company',
                    items: [
                      { label: 'About', href: '/about' },
                      { label: 'Blog', href: '/blog' },
                      { label: 'Careers', href: '/careers' },
                      { label: 'Contact', href: 'mailto:hello@clinicos.io' },
                    ],
                  },
                  {
                    title: 'Platform',
                    items: [
                      { label: 'Dashboard', href: '/login' },
                      { label: 'Appointments', href: '/login' },
                      { label: 'Patients', href: '/login' },
                      { label: 'Reports', href: '/login' },
                    ],
                  },
                  {
                    title: 'Legal',
                    items: [
                      { label: 'Privacy policy', href: '/privacy' },
                      { label: 'Terms of use', href: '/terms' },
                      { label: 'Security', href: '/security' },
                      { label: 'Cookie policy', href: '/cookies' },
                    ],
                  },
                ].map((col) => (
                  <div key={col.title}>
                    <p className="text-xs font-bold uppercase tracking-widest text-foreground mb-5">{col.title}</p>
                    <ul className="space-y-3">
                      {col.items.map((item) => {
                        const isExternal = item.href.startsWith('mailto:');
                        const isInternal = item.href.startsWith('/');
                        return (
                          <li key={item.label}>
                            {isInternal ? (
                              <Link
                                to={item.href}
                                className="group inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <span className="relative">
                                  {item.label}
                                  <span className="absolute left-0 -bottom-0.5 h-px w-full bg-gradient-to-r from-primary to-secondary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                                </span>
                              </Link>
                            ) : (
                              <a
                                href={item.href}
                                target={isExternal ? '_blank' : undefined}
                                rel={isExternal ? 'noopener noreferrer' : undefined}
                                className="group inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <span className="relative">
                                  {item.label}
                                  <span className="absolute left-0 -bottom-0.5 h-px w-full bg-gradient-to-r from-primary to-secondary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                                </span>
                              </a>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-14 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                © {dayjs().year()} ClinicOS — Crafted with care.
              </p>
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">Login</Link>
                <Link to="/register" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">Sign up free</Link>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 border border-border/60">
                  <span className="relative flex w-2 h-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-success/40 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                  </span>
                  <span className="text-xs text-foreground font-semibold">All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
