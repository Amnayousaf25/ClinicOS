import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Logo from '@/components/Logo';
import BookDemoDialog from '@/components/BookDemoDialog';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowUp, Menu, X, Twitter, Linkedin, Github, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dayjs from 'dayjs';

interface Props {
  children: React.ReactNode;
  /** Show a breadcrumb label in the nav (e.g. "About") */
  title?: string;
}

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Careers', href: '/careers' },
];

const footerCols = [
  {
    title: 'Product',
    items: [
      { label: 'Features', href: '/#features' },
      { label: 'Live preview', href: '/#preview' },
      { label: 'Customers', href: '/#testimonials' },
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
      { label: 'Login', href: '/login' },
      { label: 'Sign up free', href: '/register' },
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
];

const socials = [
  { icon: Twitter, label: 'X (Twitter)', href: 'https://twitter.com' },
  { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com' },
  { icon: Github, label: 'GitHub', href: 'https://github.com' },
  { icon: Mail, label: 'Email us', href: 'mailto:hello@clinicos.io' },
];

export const PublicPageShell = ({ children, title }: Props) => {
  const [demoOpen, setDemoOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
      setShowTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return false;
    return pathname === href;
  };

  const FooterLink = ({ item }: { item: { label: string; href: string } }) => {
    const isExternal = item.href.startsWith('mailto:') || item.href.startsWith('http');
    const isHashLink = item.href.startsWith('/#');
    return isExternal || isHashLink ? (
      <a
        href={item.href}
        target={item.href.startsWith('http') ? '_blank' : undefined}
        rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="group flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        <span className="relative">
          {item.label}
          <span className="absolute left-0 -bottom-px h-px w-full bg-gradient-to-r from-primary to-secondary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
        </span>
      </a>
    ) : (
      <Link
        to={item.href}
        className="group flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        <span className="relative">
          {item.label}
          <span className="absolute left-0 -bottom-px h-px w-full bg-gradient-to-r from-primary to-secondary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
        </span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BookDemoDialog open={demoOpen} onOpenChange={setDemoOpen} />

      {/* ── Scroll-to-top FAB ── */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="fixed bottom-8 right-6 z-50 w-11 h-11 rounded-2xl bg-foreground text-background shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Sticky Nav ── */}
      <header className="sticky top-0 z-40 pt-3 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            animate={{
              backgroundColor: scrolled ? 'hsl(var(--card) / 0.85)' : 'hsl(var(--card) / 0.6)',
              borderColor: scrolled ? 'hsl(var(--border) / 0.8)' : 'hsl(var(--border) / 0.4)',
              boxShadow: scrolled
                ? '0 4px 32px -8px hsl(220 25% 12% / 0.12), 0 2px 8px -4px hsl(220 25% 12% / 0.06)'
                : '0 2px 12px -4px hsl(220 25% 12% / 0.06)',
            }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border backdrop-blur-xl px-5 h-16 flex items-center justify-between"
          >
            {/* Logo + breadcrumb */}
            <div className="flex items-center gap-3">
              <Link to="/"><Logo size="md" /></Link>
              {title && (
                <>
                  <span className="text-border/80 text-lg font-light select-none hidden sm:block">/</span>
                  <span className="text-sm font-bold text-foreground hidden sm:block">{title}</span>
                </>
              )}
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ label, href }) => (
                <Link
                  key={label}
                  to={href}
                  className={`relative px-3 py-2 text-sm font-semibold rounded-xl transition-colors duration-200 ${
                    isActive(href)
                      ? 'text-foreground bg-muted/60'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  {label}
                  {isActive(href) && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    />
                  )}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => setDemoOpen(true)}
                className="px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl transition-colors duration-200"
              >
                Book demo
              </button>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hidden sm:block text-sm font-semibold text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl transition-colors duration-200"
              >
                Login
              </Link>
              <Link to="/register">
                <Button className="rounded-xl h-9 px-4 text-sm font-bold shadow-md">
                  Get started
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
              {/* Mobile hamburger */}
              <button
                type="button"
                aria-label="Toggle navigation"
                onClick={() => setMobileOpen((o) => !o)}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileOpen
                    ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-4 h-4" /></motion.span>
                    : <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="w-4 h-4" /></motion.span>
                  }
                </AnimatePresence>
              </button>
            </div>
          </motion.div>

          {/* Mobile dropdown */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="mt-2 rounded-2xl border border-border/60 bg-card/90 backdrop-blur-xl shadow-3d-hover px-2 py-2"
              >
                {navLinks.map(({ label, href }) => (
                  <Link
                    key={label}
                    to={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${
                      isActive(href) ? 'text-foreground bg-muted/60' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    {label}
                    {isActive(href) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); setDemoOpen(true); }}
                  className="w-full text-left flex items-center px-3 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  Book demo
                </button>
                <div className="mx-3 my-2 h-px bg-border/50" />
                <div className="flex gap-2 px-1 pb-1">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1">
                    <Button variant="outline" className="w-full rounded-xl h-10 text-sm font-semibold">Login</Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1">
                    <Button className="w-full rounded-xl h-10 text-sm font-bold">Get started</Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="relative pt-16 pb-10 px-4 sm:px-6">
        <div className="relative max-w-7xl mx-auto rounded-[2.5rem] overflow-hidden border border-border/60 bg-card/70 backdrop-blur-xl">
          {/* Ambient glows */}
          <div aria-hidden className="pointer-events-none absolute -top-32 -left-20 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-secondary/15 blur-[100px]" />

          <div className="relative p-8 sm:p-12 lg:p-14">
            {/* Top: brand + tagline */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mb-12">
              <div className="lg:w-72 shrink-0 space-y-4">
                <Link to="/"><Logo size="md" /></Link>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The intelligent OS for modern clinics — scheduling, intake, reminders &amp; analytics, unified.
                </p>
                {/* Socials */}
                <div className="flex items-center gap-2 pt-1">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      aria-label={s.label}
                      title={s.label}
                      target={s.href.startsWith('http') ? '_blank' : undefined}
                      rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="w-9 h-9 rounded-xl border border-border/60 bg-background/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:-translate-y-0.5 transition-all"
                    >
                      <s.icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Link columns */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-8">
                {footerCols.map((col) => (
                  <div key={col.title}>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-foreground mb-4">{col.title}</p>
                    <ul className="space-y-2.5">
                      {col.items.map((item) => (
                        <li key={item.label}><FooterLink item={item} /></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                © {dayjs().year()} ClinicOS Ltd. All rights reserved.
              </p>
              <div className="flex items-center gap-4 flex-wrap justify-center">
                <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
                <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
                <Link to="/security" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Security</Link>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/8 border border-success/20">
                  <span className="relative flex w-2 h-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-success/50 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                  </span>
                  <span className="text-[11px] text-success font-semibold">All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
