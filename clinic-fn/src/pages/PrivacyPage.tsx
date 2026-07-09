import { LegalPageLayout, LegalSection } from '@/components/LegalPageLayout';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

const sections = [
  { id: 'information', title: '1. Information We Collect' },
  { id: 'use', title: '2. How We Use It' },
  { id: 'sharing', title: '3. Sharing & Disclosure' },
  { id: 'retention', title: '4. Data Retention' },
  { id: 'security', title: '5. Data Security' },
  { id: 'cookies', title: '6. Cookies' },
  { id: 'rights', title: '7. Your Rights' },
  { id: 'transfers', title: '8. International Transfers' },
  { id: 'children', title: '9. Children\'s Privacy' },
  { id: 'changes', title: '10. Changes to Policy' },
  { id: 'contact', title: '11. Contact Us' },
];

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your information."
      badge="Legal"
      lastUpdated={`Last updated: ${dayjs().format('MMMM D, YYYY')}`}
      sections={sections}
    >
      <LegalSection id="information" title="1. Information We Collect">
        <p><strong className="text-foreground font-semibold">Account Information:</strong> When you register, we collect your name, email address, phone number, and organisation details.</p>
        <p><strong className="text-foreground font-semibold">Patient Data:</strong> As a healthcare platform, we process patient information on behalf of clinics. We act as a data processor; the clinic is the data controller.</p>
        <p><strong className="text-foreground font-semibold">Usage Data:</strong> We collect information about how you interact with our platform — pages visited, features used, and actions taken.</p>
        <p><strong className="text-foreground font-semibold">Technical Data:</strong> IP address, browser type, device identifiers, and cookies are automatically collected when you access our platform.</p>
        <p><strong className="text-foreground font-semibold">Communications:</strong> If you contact us by email or through the platform, we retain records of that correspondence.</p>
      </LegalSection>

      <LegalSection id="use" title="2. How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul className="list-none space-y-2.5 mt-2">
          {[
            'Provide, operate, and improve the ClinicOS platform',
            'Send appointment reminders and SMS notifications on behalf of clinics',
            'Process payments and manage subscriptions',
            'Respond to customer support enquiries',
            'Send product updates and marketing communications (with your consent)',
            'Comply with legal obligations',
            'Detect, prevent, and address technical issues or security incidents',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-[9px] shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection id="sharing" title="3. Sharing & Disclosure">
        <p>We do not sell your personal data. We may share information with:</p>
        <p><strong className="text-foreground font-semibold">Service Providers:</strong> Trusted third parties who assist in operating the platform (cloud hosting, SMS providers, payment processors). These parties are bound by confidentiality obligations.</p>
        <p><strong className="text-foreground font-semibold">Legal Requirements:</strong> We may disclose information if required by law, court order, or governmental authority.</p>
        <p><strong className="text-foreground font-semibold">Business Transfers:</strong> In the event of a merger or acquisition, user information may be transferred subject to this Policy.</p>
      </LegalSection>

      <LegalSection id="retention" title="4. Data Retention">
        <p>We retain your data for as long as your account is active. When you cancel, we delete or anonymise your data within 90 days, except where retention is legally required.</p>
        <p>Patient records may be subject to different retention periods based on applicable healthcare regulations and the clinic's own policies.</p>
      </LegalSection>

      <LegalSection id="security" title="5. Data Security">
        <p>We implement industry-standard security measures including:</p>
        <ul className="list-none space-y-2.5 mt-2">
          {[
            'TLS/SSL encryption for all data in transit',
            'AES-256 encryption for sensitive data at rest',
            'Multi-factor authentication for all team members',
            'Regular security audits and penetration testing',
            'SOC 2 Type II compliant infrastructure (AWS)',
            'Access controls with principle of least privilege',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success mt-[9px] shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3">No method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</p>
      </LegalSection>

      <LegalSection id="cookies" title="6. Cookies & Tracking">
        <p>We use cookies and similar technologies to enhance your experience. For detailed information, see our{' '}
          <Link to="/cookies" className="text-primary hover:underline font-semibold">Cookie Policy</Link>.
        </p>
        <p>You can control cookie settings through your browser or our cookie consent manager. Disabling certain cookies may affect platform functionality.</p>
      </LegalSection>

      <LegalSection id="rights" title="7. Your Rights">
        <p>Depending on your location, you may have the following rights:</p>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {[
            { right: 'Access', desc: 'Request a copy of the personal data we hold about you' },
            { right: 'Rectification', desc: 'Request correction of inaccurate or incomplete data' },
            { right: 'Erasure', desc: 'Request deletion of your personal data ("right to be forgotten")' },
            { right: 'Portability', desc: 'Request your data in a machine-readable format' },
            { right: 'Objection', desc: 'Object to processing of your data for marketing purposes' },
            { right: 'Restriction', desc: 'Request restriction of processing in certain circumstances' },
          ].map(({ right, desc }) => (
            <div key={right} className="p-3.5 rounded-xl border border-border/50 bg-background">
              <p className="text-xs font-extrabold text-primary uppercase tracking-wide mb-1">{right}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-4">To exercise any of these rights, contact us at{' '}
          <a href="mailto:privacy@clinicos.io" className="text-primary hover:underline font-semibold">privacy@clinicos.io</a>.
        </p>
      </LegalSection>

      <LegalSection id="transfers" title="8. International Data Transfers">
        <p>ClinicOS operates globally. Your data may be transferred to countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers, including Standard Contractual Clauses (SCCs) where applicable.</p>
      </LegalSection>

      <LegalSection id="children" title="9. Children's Privacy">
        <p>ClinicOS is not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, contact us immediately and we will delete it.</p>
      </LegalSection>

      <LegalSection id="changes" title="10. Changes to This Policy">
        <p>We may update this Privacy Policy periodically. We will notify you of significant changes by email or in-app notification at least 30 days before they take effect. Continued use after the effective date constitutes acceptance.</p>
      </LegalSection>

      <LegalSection id="contact" title="11. Contact Us">
        <p>For privacy-related questions or data subject requests, contact our privacy team:</p>
        <div className="mt-4 p-5 rounded-2xl border border-border/60 bg-background">
          <p className="font-bold text-foreground mb-2">ClinicOS Privacy Team</p>
          <div className="space-y-1 text-sm">
            <p>Email: <a href="mailto:privacy@clinicos.io" className="text-primary hover:underline font-medium">privacy@clinicos.io</a></p>
            <p>Address: ClinicOS Ltd., Lahore, Pakistan</p>
            <p>Response time: Within 30 days of receipt</p>
          </div>
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
}
