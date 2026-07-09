import { motion } from 'framer-motion';
import { PublicPageShell } from '@/components/PublicPageShell';
import { Lock, Shield, Server, Eye, Key, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease } }),
};

const pillars = [
  { icon: Lock, title: 'Encryption Everywhere', color: 'from-sky-500 to-cyan-400', bg: 'bg-sky-500/10 text-sky-600', desc: 'All data encrypted in transit via TLS 1.3 and at rest via AES-256. Zero plaintext storage of sensitive fields.' },
  { icon: Server, title: 'SOC 2 Type II', color: 'from-violet-500 to-purple-400', bg: 'bg-violet-500/10 text-violet-600', desc: 'Hosted on AWS with SOC 2 Type II certification. Secure data centres with 24/7 monitoring and physical access controls.' },
  { icon: Key, title: 'Zero-Trust Access', color: 'from-amber-500 to-orange-400', bg: 'bg-amber-500/10 text-amber-600', desc: 'Role-based access controls ensure each user only sees what they need. MFA enforced for all staff.' },
  { icon: Eye, title: 'Full Audit Logging', color: 'from-emerald-500 to-teal-400', bg: 'bg-emerald-500/10 text-emerald-600', desc: 'Every action on the platform is immutably logged. Admins have full audit trails for compliance and incident response.' },
  { icon: Shield, title: 'Annual Pen Tests', color: 'from-fuchsia-500 to-pink-400', bg: 'bg-fuchsia-500/10 text-fuchsia-600', desc: 'Annual penetration tests by third-party security firms. Automated vulnerability scanning runs continuously.' },
  { icon: AlertTriangle, title: 'Incident Response', color: 'from-rose-500 to-red-400', bg: 'bg-rose-500/10 text-rose-600', desc: '24/7 on-call security team. In the event of a breach, affected customers are notified within 72 hours per GDPR.' },
];

const certifications = [
  { abbr: 'SOC2', name: 'SOC 2 Type II', body: 'AICPA', status: 'Certified', color: 'from-violet-500 to-purple-400', desc: 'Annual audit of security, availability, and confidentiality controls.' },
  { abbr: 'GDPR', name: 'GDPR Compliant', body: 'EU', status: 'Certified', color: 'from-sky-500 to-cyan-400', desc: 'Full compliance with EU General Data Protection Regulation.' },
  { abbr: 'HIPAA', name: 'HIPAA Ready', body: 'HHS', status: 'BAA available', color: 'from-emerald-500 to-teal-400', desc: 'Business Associate Agreement available. Supports HIPAA-compliant workflows for US clinics.' },
  { abbr: 'ISO', name: 'ISO 27001', body: 'ISO', status: 'In Progress', color: 'from-amber-500 to-orange-400', desc: 'Currently undergoing ISO 27001 certification. Expected Q4 2026.' },
];

const practices = [
  { title: 'Vulnerability Disclosure', desc: 'Responsible disclosure programme. Report at security@clinicos.io — acknowledged within 24 hours.' },
  { title: 'Dependency Management', desc: 'Automated scanning with Dependabot and Snyk. Critical patches applied within 48 hours of disclosure.' },
  { title: 'Secret Management', desc: 'All secrets managed via AWS Secrets Manager. Zero hardcoded credentials in our codebase.' },
  { title: 'Data Minimisation', desc: 'We only collect and retain data we need. Unused data is automatically purged on a schedule.' },
  { title: 'Background Checks', desc: 'All employees with production system access undergo background verification before onboarding.' },
  { title: 'Geo-Redundant Backups', desc: 'Automated daily backups with 30-day retention stored across multiple AWS regions.' },
];

export default function SecurityPage() {
  return (
    <PublicPageShell title="Security">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 right-0 h-[30rem] opacity-15"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(199 89% 55%), transparent 70%)', filter: 'blur(60px)' }} />
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6 mx-auto">
              <Shield className="w-8 h-8" />
            </div>
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
            Security you can{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">trust completely.</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Healthcare data is among the most sensitive in existence. We've built security into every layer of ClinicOS — not bolted on after the fact.
          </motion.p>
        </div>
      </section>

      {/* ── Live status banner ── */}
      <section className="pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 rounded-2xl border border-success/25 bg-success/5">
            <div className="flex items-center gap-3">
              <div className="relative flex w-3 h-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success/50 animate-ping" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
              </div>
              <div>
                <p className="font-bold text-foreground">All systems operational</p>
                <p className="text-xs text-muted-foreground">99.97% uptime over the past 90 days</p>
              </div>
            </div>
            <a href="https://status.clinicos.io" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              View status page <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Security pillars ── */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-primary mb-3">Defence in depth</p>
            <h2 className="text-4xl font-extrabold tracking-tight">Security by design</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Six independent layers of protection baked into every part of the platform.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pillars.map((p, i) => (
              <motion.div key={p.title} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp} custom={i}
                className="gradient-border p-6 rounded-2xl bg-card shadow-3d hover:shadow-3d-hover hover:-translate-y-1 transition-all duration-200">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${p.bg}`}>
                  <p.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-foreground text-base mb-2.5">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Certifications ── */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-10">Certifications &amp; compliance</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {certifications.map((c, i) => (
              <motion.div key={c.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="flex gap-4 p-5 rounded-2xl border border-border/60 bg-card shadow-3d hover:shadow-3d-hover transition-shadow items-start">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.color} text-white flex flex-col items-center justify-center shrink-0`}>
                  <p className="text-xs font-extrabold leading-none">{c.abbr}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-foreground">{c.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'In Progress' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-primary font-semibold mt-0.5 mb-1.5">{c.body}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Practices ── */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-10">Security practices</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {practices.map((p, i) => (
              <motion.div key={p.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="flex gap-3.5 p-5 rounded-2xl border border-border/60 bg-card">
                <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-foreground mb-1">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Responsible Disclosure ── */}
      <section className="py-12 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, ease }}
            className="relative rounded-3xl border border-border/60 bg-card shadow-3d overflow-hidden p-8 lg:p-12 text-center">
            <div className="absolute inset-0 opacity-5 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-extrabold mb-3">Found a vulnerability?</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed max-w-sm mx-auto">
                We take all security reports seriously. Disclose responsibly — we'll acknowledge within 24 hours and keep you updated throughout.
              </p>
              <a
                href="mailto:security@clinicos.io"
                className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-7 py-3.5 font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
              >
                <Shield className="w-4 h-4" />
                Report a vulnerability
              </a>
              <p className="text-xs text-muted-foreground mt-4">We do not pursue legal action against good-faith security researchers.</p>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicPageShell>
  );
}
