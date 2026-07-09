import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PublicPageShell } from '@/components/PublicPageShell';

interface Section {
  id: string;
  title: string;
}

interface Props {
  title: string;
  subtitle: string;
  badge: string;
  lastUpdated: string;
  sections: Section[];
  children: React.ReactNode;
}

export const LegalPageLayout = ({ title, subtitle, badge, lastUpdated, sections, children }: Props) => {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, [sections]);

  return (
    <PublicPageShell title={title}>
      {/* Page hero */}
      <div className="border-b border-border/40 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-primary/10 text-primary mb-5">
              {badge}
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-3">{title}</h1>
            <p className="text-muted-foreground text-lg mb-4">{subtitle}</p>
            <p className="text-xs text-muted-foreground/70 font-medium">{lastUpdated}</p>
          </motion.div>
        </div>
      </div>

      {/* Two-col layout */}
      <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12 xl:gap-16">
          {/* Sticky TOC sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-1">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-foreground/50 mb-3 px-3">On this page</p>
              {sections.map(({ id, title: secTitle }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeSection === id
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <span className={`inline-block transition-transform duration-200 ${activeSection === id ? 'translate-x-0.5' : ''}`}>
                    {secTitle}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <motion.article
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="prose-custom min-w-0"
          >
            {children}
          </motion.article>
        </div>
      </div>
    </PublicPageShell>
  );
};

/**
 * A single section within a legal page. Renders an anchor-able heading
 * followed by the body content.
 */
export const LegalSection = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="mb-12 scroll-mt-28">
    <h2 className="text-lg font-bold text-foreground mb-5 pb-3 border-b border-border/50 flex items-center gap-2">
      <span className="w-1 h-5 rounded-full bg-gradient-to-b from-primary to-secondary shrink-0" />
      {title}
    </h2>
    <div className="space-y-4 text-[15px] text-muted-foreground leading-[1.75]">
      {children}
    </div>
  </section>
);
