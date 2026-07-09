import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { PublicPageShell } from '@/components/PublicPageShell';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Target, Zap, Globe, Users, Award, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.55, ease } }),
};

const team = [
  { name: 'Dr. Adeel Raza', role: 'Co-founder & CEO', initials: 'AR', grad: 'from-sky-500 to-cyan-400', bio: 'Former NHS physician turned tech entrepreneur. Built ClinicOS after 8 years of living with broken clinic software.' },
  { name: 'Sana Khan', role: 'Co-founder & CTO', initials: 'SK', grad: 'from-violet-500 to-purple-400', bio: '10 years at Google Health. Obsessed with turning complex workflows into delightfully simple experiences.' },
  { name: 'Omar Farooq', role: 'Head of Product', initials: 'OF', grad: 'from-emerald-500 to-teal-400', bio: 'Product lead who spent 5 years embedded in tier-1 hospitals learning how clinics truly operate.' },
  { name: 'Aisha Malik', role: 'Head of Customer Success', initials: 'AM', grad: 'from-rose-500 to-pink-400', bio: 'Ex-clinic manager turned advocate — she has personally onboarded 300+ clinics and knows every pain point.' },
  { name: 'Bilal Shah', role: 'Lead Engineer', initials: 'BS', grad: 'from-amber-500 to-orange-400', bio: 'Full-stack engineer who built real-time systems at a healthcare unicorn. Speed and reliability are his religion.' },
  { name: 'Nadia Siddiqui', role: 'Head of Design', initials: 'NS', grad: 'from-fuchsia-500 to-pink-400', bio: 'Human-centered designer who believes every pixel should serve the clinician, not distract them.' },
];

const values = [
  { icon: Heart, title: 'Patient First', color: 'text-rose-500 bg-rose-500/10', desc: 'Every feature we ship starts with one question: does this lead to better patient care? If not, it doesn\'t ship.' },
  { icon: Target, title: 'Relentless Focus', color: 'text-primary bg-primary/10', desc: 'We do one thing: help clinics run better. We say no to distractions and yes to depth.' },
  { icon: Zap, title: 'Speed as a Feature', color: 'text-amber-500 bg-amber-500/10', desc: 'Slow software costs clinicians time, and time costs patients. We obsess over sub-100ms interactions.' },
  { icon: Globe, title: 'Globally Minded', color: 'text-emerald-500 bg-emerald-500/10', desc: 'Healthcare is universal. ClinicOS works for clinics from Lahore to London to Los Angeles.' },
  { icon: Users, title: 'Transparent by Default', color: 'text-secondary bg-secondary/10', desc: 'We share our roadmap, pricing, and reasoning openly. No surprises, no lock-in, no gotchas.' },
  { icon: Award, title: 'Excellence Always', color: 'text-violet-500 bg-violet-500/10', desc: 'We\'re not building good software. We\'re building the definitive clinic OS on the planet.' },
];

const milestones = [
  { year: '2021', icon: '🏠', title: 'Founded', desc: 'Two doctors and a developer started ClinicOS in a basement, fed up with their own clinic\'s software.' },
  { year: '2022', icon: '🚀', title: 'First 50 Clinics', desc: 'Reached 50 active clinics across Pakistan and UAE within 12 months of launch.' },
  { year: '2023', icon: '💰', title: 'Series A', desc: 'Raised $4M led by HealthTech Ventures to expand the team and accelerate product development.' },
  { year: '2024', icon: '📈', title: '300+ Clinics', desc: 'Passed 300 clinics, processing 10,000+ appointments per month on the platform.' },
  { year: '2025', icon: '🤖', title: 'AI Features', desc: 'Shipped AI-powered scheduling, predictive no-show detection, and smart intake document parsing.' },
  { year: '2026', icon: '🌍', title: '500+ Clinics', desc: 'Serving 500+ clinics globally. Actively expanding to UK, Canada, and Australia.' },
];

const stats = [
  { value: '500+', label: 'Clinics worldwide', desc: 'Across 8 countries' },
  { value: '10k+', label: 'Appointments/month', desc: 'And growing fast' },
  { value: '40%', label: 'No-show reduction', desc: 'Average across clinics' },
  { value: '3 hrs', label: 'Saved daily per clinic', desc: 'In admin time' },
];

function AnimatedStat({ value, label, desc, delay }: { value: string; label: string; desc: string; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5, ease }}
      className="text-center p-8 rounded-3xl border border-border/60 bg-card shadow-3d hover:shadow-3d-hover hover:-translate-y-1 transition-all">
      <p className="text-5xl font-extrabold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent leading-none">{value}</p>
      <p className="font-bold text-foreground mt-3 mb-1">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </motion.div>
  );
}

export default function AboutPage() {
  return (
    <PublicPageShell title="About">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, hsl(199 89% 55%), transparent 65%)', filter: 'blur(80px)' }} />
          <div className="absolute top-0 right-1/4 w-[30rem] h-[30rem] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, hsl(258 80% 65%), transparent 65%)', filter: 'blur(80px)' }} />
        </div>

        <div className="max-w-5xl mx-auto px-6 pt-20 pb-24 lg:pt-28 lg:pb-32 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold tracking-widest uppercase mb-8">
            <Heart className="w-3.5 h-3.5" /> Our story
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.04] text-foreground">
            Built by clinicians,<br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-sky-400 to-secondary bg-clip-text text-transparent">for clinicians.</span>
            </span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="mt-7 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            ClinicOS was born out of frustration. Two doctors spent more time clicking through broken software than talking to patients, so they decided to build something better. That was 2021. Today we serve 500+ clinics worldwide.
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="rounded-2xl h-13 px-8 font-bold text-base shadow-primary-glow">
                Start for free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/careers">
              <Button size="lg" variant="outline" className="rounded-2xl h-13 px-8 font-bold text-base">
                Join our team
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Mission banner ── */}
      <section className="py-4 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.5, ease }}
            className="relative rounded-3xl overflow-hidden bg-foreground text-background px-10 py-14 lg:px-16 lg:py-20">
            <div className="absolute inset-0 opacity-20 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, hsl(var(--primary)), transparent 50%), radial-gradient(ellipse at 80% 50%, hsl(var(--secondary)), transparent 50%)' }} />
            {/* Grid dots */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
            <div className="relative z-10 max-w-3xl">
              <Quote className="w-10 h-10 opacity-30 mb-5" />
              <h2 className="text-3xl lg:text-5xl font-extrabold leading-[1.1] mb-6">
                To give every clinician in the world back an hour a day.
              </h2>
              <p className="text-lg opacity-75 leading-relaxed">
                Administrative burden is the leading cause of clinician burnout. Every minute spent on paperwork, chasing confirmations, and managing spreadsheets is a minute stolen from patient care. We're here to eliminate that — one clinic at a time.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => <AnimatedStat key={s.label} {...s} delay={i * 0.08} />)}
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-primary mb-3">What drives us</p>
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">Our six core values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {values.map((v, i) => (
              <motion.div key={v.title} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp} custom={i}
                className="gradient-border p-6 rounded-2xl bg-card shadow-3d hover:shadow-3d-hover hover:-translate-y-1 transition-all duration-200">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${v.color}`}>
                  <v.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2.5">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-primary mb-3">Journey</p>
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">How we got here</h2>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-secondary/40 to-transparent sm:left-1/2" />
            <div className="space-y-8">
              {milestones.map((m, i) => (
                <motion.div key={m.year} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }}
                  variants={fadeUp} custom={i}
                  className={`relative flex gap-5 sm:gap-0 items-start ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                  {/* Card — desktop */}
                  <div className={`hidden sm:flex flex-1 ${i % 2 === 0 ? 'justify-end pr-10' : 'justify-start pl-10'}`}>
                    <div className="max-w-xs w-full bg-card border border-border/60 rounded-2xl p-5 shadow-3d hover:shadow-3d-hover transition-shadow">
                      <p className="text-2xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{m.year}</p>
                      <h3 className="font-bold text-foreground mt-1">{m.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                  {/* Dot */}
                  <div className="relative z-10 w-16 h-16 shrink-0 rounded-2xl bg-card border border-border/60 shadow-3d flex items-center justify-center text-2xl sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:top-0">
                    {m.icon}
                  </div>
                  {/* Card — mobile */}
                  <div className="sm:hidden flex-1 bg-card border border-border/60 rounded-2xl p-4 shadow-3d">
                    <p className="text-xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{m.year}</p>
                    <h3 className="font-bold text-foreground mt-0.5">{m.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{m.desc}</p>
                  </div>
                  <div className="hidden sm:block flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-primary mb-3">People</p>
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">Meet the team</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Doctors, engineers, designers, and operators united by one goal.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {team.map((member, i) => (
              <motion.div key={member.name} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp} custom={i}
                className="group relative p-6 rounded-2xl border border-border/60 bg-card shadow-3d hover:shadow-3d-hover hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
                {/* Subtle corner glow on hover */}
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle, hsl(var(--primary)), transparent 60%)` }} />
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${member.grad} text-white flex items-center justify-center text-lg font-extrabold mb-5 group-hover:scale-105 transition-transform duration-300`}>
                  {member.initials}
                </div>
                <h3 className="font-bold text-foreground text-base">{member.name}</h3>
                <p className="text-xs text-primary font-bold mt-0.5 mb-3 uppercase tracking-wide">{member.role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, ease }}>
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-4">
              Ready to join 500+ clinics?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Start your free 14-day trial. No credit card. No commitment.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/register">
                <Button size="lg" className="rounded-2xl h-13 px-8 font-bold shadow-primary-glow">
                  Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/careers">
                <Button size="lg" variant="outline" className="rounded-2xl h-13 px-8 font-bold">
                  Work with us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicPageShell>
  );
}
