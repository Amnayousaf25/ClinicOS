import { LegalPageLayout, LegalSection } from '@/components/LegalPageLayout';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

const sections = [
  { id: 'what', title: '1. What Are Cookies?' },
  { id: 'types', title: '2. Types We Use' },
  { id: 'third-party', title: '3. Third-Party Cookies' },
  { id: 'manage', title: '4. Managing Cookies' },
  { id: 'consent', title: '5. Cookie Consent' },
  { id: 'dnt', title: '6. Do Not Track' },
  { id: 'changes', title: '7. Changes to Policy' },
  { id: 'contact', title: '8. Contact Us' },
];

const cookieTypes = [
  {
    name: 'Strictly Necessary',
    badge: 'Always on',
    badgeColor: 'bg-success/10 text-success border-success/20',
    examples: ['Session token', 'CSRF protection', 'Cookie consent preference'],
    desc: 'Essential for the platform to function. Enable core features like authentication, session management, and security. Cannot be disabled.',
  },
  {
    name: 'Functional',
    badge: 'Can opt out',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    examples: ['Preferred language', 'Dashboard layout', 'Theme preference', 'Notification settings'],
    desc: 'Remember your preferences and settings to provide a more personalised experience.',
  },
  {
    name: 'Analytics',
    badge: 'Can opt out',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    examples: ['Page visit counts', 'Feature usage stats', 'Error tracking (Sentry)', 'Performance metrics'],
    desc: 'Help us understand how users interact with the platform so we can improve it. Privacy-preserving — no cross-site tracking.',
  },
  {
    name: 'Marketing',
    badge: 'Can opt out',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    examples: ['UTM source tracking', 'Demo request attribution', 'Sign-up conversion'],
    desc: 'Help us understand which marketing channels drive signups. We do not use third-party advertising trackers.',
  },
];

export default function CookiesPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      subtitle="What cookies we use, why we use them, and how to manage them."
      badge="Legal"
      lastUpdated={`Last updated: ${dayjs().format('MMMM D, YYYY')}`}
      sections={sections}
    >
      <LegalSection id="what" title="1. What Are Cookies?">
        <p>Cookies are small text files placed on your device when you visit a website or web application. They are widely used to make websites work efficiently, remember your preferences, and provide reporting information.</p>
        <p>Cookies are not programs — they cannot carry viruses or malware. They simply store small amounts of data that help the platform recognise you and provide a better experience.</p>
      </LegalSection>

      <LegalSection id="types" title="2. Types of Cookies We Use">
        <div className="space-y-4 mt-2">
          {cookieTypes.map((ct) => (
            <div key={ct.name} className="rounded-2xl border border-border/60 bg-background overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
                <p className="font-bold text-foreground">{ct.name}</p>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${ct.badgeColor}`}>
                  {ct.badge}
                </span>
              </div>
              <div className="px-5 py-4 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">{ct.desc}</p>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/50 mb-2">Examples</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ct.examples.map((ex) => (
                      <span key={ex} className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-medium">{ex}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection id="third-party" title="3. Third-Party Cookies">
        <p>Some third-party services we integrate with may also set cookies on your device:</p>
        <div className="mt-3 rounded-2xl border border-border/60 overflow-hidden">
          <div className="grid grid-cols-3 bg-muted/50 px-4 py-2.5">
            {['Provider', 'Purpose', 'Policy'].map((h) => (
              <p key={h} className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/50">{h}</p>
            ))}
          </div>
          {[
            { p: 'AWS CloudFront', purpose: 'CDN & performance', url: 'aws.amazon.com/privacy' },
            { p: 'Sentry', purpose: 'Error monitoring', url: 'sentry.io/privacy' },
            { p: 'Stripe', purpose: 'Payment processing', url: 'stripe.com/privacy' },
          ].map((row, i) => (
            <div key={row.p} className={`grid grid-cols-3 px-4 py-3.5 text-sm ${i < 2 ? 'border-b border-border/40' : ''}`}>
              <p className="font-medium text-foreground">{row.p}</p>
              <p className="text-muted-foreground">{row.purpose}</p>
              <a href={`https://${row.url}`} target="_blank" rel="noopener noreferrer"
                className="text-primary hover:underline text-xs font-medium truncate">{row.url}</a>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection id="manage" title="4. Managing Cookies">
        <p><strong className="text-foreground font-semibold">In the platform:</strong> Update preferences via Account Settings → Privacy &amp; Cookies at any time.</p>
        <p><strong className="text-foreground font-semibold">In your browser:</strong> Most browsers let you control cookies through settings:</p>
        <div className="grid sm:grid-cols-2 gap-2.5 mt-3">
          {[
            { name: 'Google Chrome', url: 'https://support.google.com/chrome/answer/95647' },
            { name: 'Mozilla Firefox', url: 'https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop' },
            { name: 'Safari', url: 'https://support.apple.com/en-gb/guide/safari/sfri11471/mac' },
            { name: 'Microsoft Edge', url: 'https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09' },
          ].map(({ name, url }) => (
            <a key={name} href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border/60 bg-background hover:border-primary/40 hover:text-primary transition-colors group text-sm font-medium text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {name}
            </a>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-xl border border-warning/30 bg-warning/5 text-sm">
          <p><strong className="text-foreground">Note:</strong> Disabling strictly necessary cookies will prevent login and break core features.</p>
        </div>
      </LegalSection>

      <LegalSection id="consent" title="5. Cookie Consent">
        <p>When you first visit ClinicOS, we display a cookie consent banner. You can accept all cookies, customise preferences, or reject optional cookies.</p>
        <p>Your consent is stored and respected on all subsequent visits. You can change preferences at any time via Account Settings → Privacy &amp; Cookies.</p>
      </LegalSection>

      <LegalSection id="dnt" title="6. Do Not Track">
        <p>Some browsers send a "Do Not Track" (DNT) signal. ClinicOS responds to DNT signals by disabling analytics and marketing cookies for your session while maintaining strictly necessary and functional cookies.</p>
      </LegalSection>

      <LegalSection id="changes" title="7. Changes to This Policy">
        <p>We may update this Cookie Policy from time to time. We will notify you of significant changes via email or in-app notification. The "Last updated" date at the top reflects the most recent revision.</p>
      </LegalSection>

      <LegalSection id="contact" title="8. Contact Us">
        <p>Questions about our use of cookies?</p>
        <div className="mt-4 p-5 rounded-2xl border border-border/60 bg-background">
          <p className="font-bold text-foreground mb-2">ClinicOS Privacy Team</p>
          <div className="space-y-1 text-sm">
            <p>Email: <a href="mailto:privacy@clinicos.io" className="text-primary hover:underline font-medium">privacy@clinicos.io</a></p>
            <p>Related: <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> · <Link to="/terms" className="text-primary hover:underline">Terms of Use</Link></p>
          </div>
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
}
