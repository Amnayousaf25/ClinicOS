import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicPageShell } from '@/components/PublicPageShell';
import { ArrowRight, MapPin, Briefcase, Zap, Heart, Users, Globe, Clock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.5, ease } }),
};

const openings = [
  { id: 1, title: 'Senior Full-Stack Engineer', dept: 'Engineering', loc: 'Lahore / Remote', type: 'Full-time', level: 'Senior', desc: 'Own development of core scheduling and intake features across React, NestJS, and MongoDB. Direct line to the product roadmap and full architectural ownership.' },
  { id: 2, title: 'Product Designer', dept: 'Design', loc: 'Lahore / Remote', type: 'Full-time', level: 'Mid–Senior', desc: 'Design intuitive, beautiful experiences for clinicians and patients. Own the design system, run user research, and ship with engineering.' },
  { id: 3, title: 'Customer Success Manager', dept: 'Customer Success', loc: 'Lahore', type: 'Full-time', level: 'Mid', desc: 'Onboard new clinics, run training sessions, and be the voice of the customer internally. Turn clinics into ClinicOS champions.' },
  { id: 4, title: 'Growth Marketing Manager', dept: 'Marketing', loc: 'Remote', type: 'Full-time', level: 'Senior', desc: 'Drive acquisition through performance marketing, content, and partnerships. Own the full growth funnel from awareness to activated clinic.' },
  { id: 5, title: 'Backend Engineer (AI/ML)', dept: 'Engineering', loc: 'Remote', type: 'Full-time', level: 'Senior', desc: 'Build and productionise ML models for no-show prediction, smart scheduling, and intake data extraction. Python, NestJS, AWS SageMaker.' },
  { id: 6, title: 'Clinical Partnerships Manager', dept: 'Sales', loc: 'Dubai / Lahore', type: 'Full-time', level: 'Mid', desc: 'Build relationships with clinic groups and hospital networks across GCC and South Asia. Represent ClinicOS at conferences.' },
];

const perks = [
  { icon: Globe, title: 'Remote-first', desc: 'Work from anywhere. Async culture with optional Lahore HQ.', color: 'text-sky-500 bg-sky-500/10' },
  { icon: Heart, title: 'Health coverage', desc: 'Full health & dental for you and your dependents.', color: 'text-rose-500 bg-rose-500/10' },
  { icon: Zap, title: 'Fast-track growth', desc: 'Direct access to leadership. Own real problems. Zero bureaucracy.', color: 'text-amber-500 bg-amber-500/10' },
  { icon: Users, title: 'Great teammates', desc: 'Elite talent in a small, high-trust team. No politics.', color: 'text-violet-500 bg-violet-500/10' },
  { icon: Briefcase, title: 'Meaningful equity', desc: 'Share in what you build. Generous equity for all full-timers.', color: 'text-emerald-500 bg-emerald-500/10' },
  { icon: Clock, title: 'Flexible hours', desc: 'We care about results, not clock-in times. Own your schedule.', color: 'text-primary bg-primary/10' },
];

const deptColors: Record<string, string> = {
  Engineering: 'bg-amber-500/10 text-amber-600',
  Design: 'bg-fuchsia-500/10 text-fuchsia-600',
  'Customer Success': 'bg-emerald-500/10 text-emerald-600',
  Marketing: 'bg-sky-500/10 text-sky-600',
  Sales: 'bg-rose-500/10 text-rose-600',
};

const deptAccents: Record<string, string> = {
  Engineering: 'from-amber-400 to-orange-400',
  Design: 'from-fuchsia-400 to-pink-400',
  'Customer Success': 'from-emerald-400 to-teal-400',
  Marketing: 'from-sky-400 to-cyan-400',
  Sales: 'from-rose-400 to-pink-400',
};

export default function CareersPage() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const toggle = (id: number) => setExpanded((prev) => (prev === id ? null : id));

  const handleApply = (job: typeof openings[0]) => {
    setForm((f) => ({ ...f, role: job.title }));
    setTimeout(() => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setForm({ name: '', email: '', role: '', message: '' });
      toast.success("Application submitted! We'll review it and respond within 5 business days.");
    }, 900);
  };

  return (
    <PublicPageShell title="Careers">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[32rem] h-[32rem] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, hsl(199 89% 55%), transparent 65%)', filter: 'blur(80px)' }} />
        </div>
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold tracking-widest uppercase mb-7">
              Careers at ClinicOS
            </span>
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.04]">
            Help us fix{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">healthcare admin.</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="mt-7 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We're a small team doing big things. Own real problems, work with elite colleagues, and build software that genuinely matters.
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="mt-8 flex flex-wrap items-center justify-center gap-6">
            {['Remote-friendly', 'Equity for all', 'Lean & fast-moving', '26 team members'].map((b) => (
              <span key={b} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-success" /> {b}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Perks ── */}
      <section className="pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-10">Why join ClinicOS?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {perks.map((p, i) => (
              <motion.div key={p.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="flex gap-4 p-5 rounded-2xl border border-border/60 bg-card shadow-3d hover:shadow-3d-hover transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${p.color}`}>
                  <p.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm mb-1">{p.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Open roles ── */}
      <section className="pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold">Open positions</h2>
            <p className="text-muted-foreground mt-2">Can't see your role? Send a general application below.</p>
          </div>
          <div className="space-y-3">
            {openings.map((job, i) => (
              <motion.div key={job.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="rounded-2xl border border-border/60 bg-card shadow-3d overflow-hidden">
                {/* Accent line */}
                <div className={`h-px bg-gradient-to-r ${deptAccents[job.dept] || 'from-primary to-secondary'}`} />
                <button
                  type="button"
                  onClick={() => toggle(job.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${deptColors[job.dept] || ''}`}>{job.dept}</span>
                      <span className="text-[10px] bg-muted text-muted-foreground font-semibold px-2 py-0.5 rounded-lg">{job.level}</span>
                    </div>
                    <h3 className="font-bold text-foreground">{job.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{job.loc}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Briefcase className="w-3 h-3" />{job.type}</span>
                    </div>
                  </div>
                  <motion.div animate={{ rotate: expanded === job.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {expanded === job.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-border/40 pt-4">
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{job.desc}</p>
                        <Button onClick={() => handleApply(job)} className="rounded-xl font-bold">
                          Apply for this role <ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Application form ── */}
      <section id="apply" className="pb-20 px-4 scroll-mt-28">
        <div className="max-w-2xl mx-auto">
          <div className="relative rounded-3xl border border-border/60 bg-card shadow-3d overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
            <div className="p-8">
              <h2 className="text-2xl font-extrabold mb-1">Apply now</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {form.role ? `Applying for: ${form.role}` : "Fill in your details and we'll be in touch."}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { key: 'name', label: 'Full name', ph: 'Jane Smith', type: 'text' },
                    { key: 'email', label: 'Email address', ph: 'jane@example.com', type: 'email' },
                  ].map(({ key, label, ph, type }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-foreground uppercase tracking-widest">{label} *</label>
                      <input required type={type} value={(form as any)[key]}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        placeholder={ph}
                        className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-foreground uppercase tracking-widest">Role *</label>
                  <input required value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="Senior Full-Stack Engineer"
                    className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-foreground uppercase tracking-widest">Cover letter *</label>
                  <textarea required rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us who you are, what you've built, and why ClinicOS excites you…"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none" />
                </div>
                <Button type="submit" disabled={submitting} className="w-full h-12 rounded-xl font-bold text-base">
                  {submitting
                    ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</span>
                    : <>Submit application <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
                <p className="text-center text-xs text-muted-foreground">We review every application and respond within 5 business days.</p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
