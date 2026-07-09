import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicPageShell } from '@/components/PublicPageShell';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Tag, ChevronRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.5, ease } }),
};

type Category = 'All' | 'Product' | 'Engineering' | 'Clinical' | 'Design' | 'Company';

const categories: Category[] = ['All', 'Product', 'Engineering', 'Clinical', 'Design', 'Company'];

const posts = [
  { id: '1', cat: 'Product' as Category, title: 'How ClinicOS cut no-show rates by 40%', excerpt: 'We analysed 2 million appointments across 500 clinics to understand exactly when reminder timing affects attendance.', author: 'Sana Khan', initials: 'SK', grad: 'from-violet-500 to-purple-400', date: 'Jun 28, 2026', mins: 8, featured: true },
  { id: '2', cat: 'Engineering' as Category, title: 'Building real-time scheduling at scale', excerpt: 'Real-time availability checks sound simple until you have 100 providers and 300 clinics all updating calendars simultaneously.', author: 'Bilal Shah', initials: 'BS', grad: 'from-amber-500 to-orange-400', date: 'Jun 14, 2026', mins: 12, featured: false },
  { id: '3', cat: 'Clinical' as Category, title: 'The hidden cost of manual intake forms', excerpt: 'Paper intake forms waste 15 minutes per patient on average. Multiply that by 30 patients a day and you\'ve lost 7.5 hours.', author: 'Dr. Adeel Raza', initials: 'AR', grad: 'from-sky-500 to-cyan-400', date: 'May 30, 2026', mins: 6, featured: false },
  { id: '4', cat: 'Design' as Category, title: 'Designing for tired clinicians', excerpt: 'After-hours nurses and early-morning doctors don\'t have patience for complex UIs. Our design principles explained.', author: 'Nadia Siddiqui', initials: 'NS', grad: 'from-fuchsia-500 to-pink-400', date: 'May 12, 2026', mins: 5, featured: false },
  { id: '5', cat: 'Company' as Category, title: 'ClinicOS raises $4M Series A', excerpt: 'We\'re thrilled to announce our Series A funding round led by HealthTech Ventures. Here\'s what this means for our product.', author: 'Omar Farooq', initials: 'OF', grad: 'from-emerald-500 to-teal-400', date: 'Apr 22, 2026', mins: 4, featured: false },
  { id: '6', cat: 'Product' as Category, title: 'Introducing AI-powered scheduling', excerpt: 'Our new AI engine learns each provider\'s patterns and automatically optimises the schedule to minimise gaps.', author: 'Sana Khan', initials: 'SK', grad: 'from-violet-500 to-purple-400', date: 'Mar 18, 2026', mins: 7, featured: false },
  { id: '7', cat: 'Engineering' as Category, title: 'How we went from 0 to 99.97% uptime', excerpt: 'A post-mortem of our worst incident and the infrastructure overhaul that followed, including multi-region failover.', author: 'Bilal Shah', initials: 'BS', grad: 'from-amber-500 to-orange-400', date: 'Feb 5, 2026', mins: 15, featured: false },
];

const catColors: Record<Category, string> = {
  All: 'bg-muted text-muted-foreground',
  Product: 'bg-primary/10 text-primary',
  Engineering: 'bg-amber-500/10 text-amber-600',
  Clinical: 'bg-sky-500/10 text-sky-600',
  Design: 'bg-fuchsia-500/10 text-fuchsia-600',
  Company: 'bg-emerald-500/10 text-emerald-600',
};

export default function BlogPage() {
  const [activeCat, setActiveCat] = useState<Category>('All');
  const featured = posts[0];
  const rest = posts.slice(1).filter((p) => activeCat === 'All' || p.cat === activeCat);

  return (
    <PublicPageShell title="Blog">
      {/* ── Hero ── */}
      <section className="pt-16 pb-10 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold tracking-widest uppercase mb-6">
              <TrendingUp className="w-3.5 h-3.5" /> ClinicOS Blog
            </span>
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
            Insights for{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">modern clinics.</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
            Product updates, engineering deep-dives, clinical insights, and the occasional rant about healthcare admin.
          </motion.p>
        </div>
      </section>

      {/* ── Featured post ── */}
      <section className="pb-10 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
            className="relative group cursor-pointer rounded-3xl overflow-hidden bg-foreground text-background">
            <div className="absolute inset-0 opacity-25"
              style={{ backgroundImage: 'radial-gradient(ellipse at 20% 60%, hsl(var(--primary)), transparent 50%), radial-gradient(ellipse at 80% 40%, hsl(var(--secondary)), transparent 50%)' }} />
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="relative z-10 p-8 lg:p-12 lg:grid lg:grid-cols-2 lg:gap-10 items-center">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-bold">{featured.cat}</span>
                  <span className="flex items-center gap-1 text-xs opacity-60 font-medium"><Clock className="w-3 h-3" /> {featured.mins} min</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/30 text-xs font-bold">Featured</span>
                </div>
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-extrabold leading-tight mb-4 group-hover:opacity-90 transition-opacity">
                  {featured.title}
                </h2>
                <p className="opacity-75 leading-relaxed mb-6">{featured.excerpt}</p>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${featured.grad} flex items-center justify-center text-white text-xs font-bold`}>{featured.initials}</div>
                    <div>
                      <p className="text-sm font-bold">{featured.author}</p>
                      <p className="text-xs opacity-60">{featured.date}</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" className="rounded-xl font-bold group-hover:translate-x-0.5 transition-transform">
                    Read article <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
              {/* Visual side */}
              <div className="hidden lg:flex items-center justify-center">
                <div className="w-full max-w-xs aspect-[4/3] rounded-2xl bg-white/10 border border-white/15 flex flex-col gap-3 p-5">
                  {[['No-show rate', '40% ↓', 'text-success'], ['Appointments/mo', '10,847', 'text-sky-300'], ['Avg reminder delay', '24h → 2h', 'text-amber-300']].map(([label, val, col]) => (
                    <div key={label as string} className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3">
                      <span className="text-xs opacity-70">{label}</span>
                      <span className={`text-sm font-extrabold ${col}`}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Category filter ── */}
      <section className="pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                  activeCat === cat
                    ? 'bg-foreground text-background border-foreground shadow-sm'
                    : 'bg-background border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Post grid ── */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={activeCat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((post, i) => (
                <motion.article key={post.id} variants={fadeUp} initial="hidden" animate="visible" custom={i}
                  className="group cursor-pointer flex flex-col rounded-2xl border border-border/60 bg-card shadow-3d hover:shadow-3d-hover hover:-translate-y-1.5 transition-all duration-250 overflow-hidden">
                  {/* Colour accent top bar */}
                  <div className={`h-1 bg-gradient-to-r ${post.grad}`} />
                  <div className="flex flex-col flex-1 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${catColors[post.cat]}`}>
                        <Tag className="w-2.5 h-2.5" /> {post.cat}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium ml-auto">
                        <Clock className="w-3 h-3" /> {post.mins} min
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground leading-snug mb-3 group-hover:text-primary transition-colors duration-200">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">{post.excerpt}</p>
                    <div className="flex items-center gap-2.5 mt-5 pt-4 border-t border-border/50">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${post.grad} text-white flex items-center justify-center text-[11px] font-bold shrink-0`}>
                        {post.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{post.author}</p>
                        <p className="text-[10px] text-muted-foreground">{post.date}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </AnimatePresence>

          {rest.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-semibold">No posts in this category yet.</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" className="rounded-2xl h-12 px-8 font-bold">
              Load more posts
            </Button>
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl border border-border/60 bg-card shadow-3d overflow-hidden p-8 lg:p-12 text-center">
            <div className="absolute inset-0 opacity-5 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
            <div className="relative z-10">
              <h2 className="text-2xl font-extrabold mb-2">Stay in the loop</h2>
              <p className="text-muted-foreground mb-6">Weekly insights on clinic operations, product updates, and clinical research.</p>
              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 max-w-sm mx-auto">
                <input type="email" required placeholder="you@clinic.com"
                  className="flex-1 h-11 rounded-xl border border-border bg-background px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                <Button type="submit" className="rounded-xl h-11 px-5 font-bold whitespace-nowrap">Subscribe</Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
