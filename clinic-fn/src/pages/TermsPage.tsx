import { LegalPageLayout, LegalSection } from '@/components/LegalPageLayout';
import dayjs from 'dayjs';

const sections = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'services', title: '2. Description of Services' },
  { id: 'account', title: '3. Account Security' },
  { id: 'payment', title: '4. Subscription & Payment' },
  { id: 'acceptable', title: '5. Acceptable Use' },
  { id: 'hipaa', title: '6. Patient Data & HIPAA' },
  { id: 'ip', title: '7. Intellectual Property' },
  { id: 'sla', title: '8. Service Availability' },
  { id: 'liability', title: '9. Limitation of Liability' },
  { id: 'indemnification', title: '10. Indemnification' },
  { id: 'termination', title: '11. Termination' },
  { id: 'governing', title: '12. Governing Law' },
  { id: 'changes', title: '13. Changes to Terms' },
  { id: 'contact', title: '14. Contact' },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Use"
      subtitle="The rules and conditions governing your use of ClinicOS."
      badge="Legal"
      lastUpdated={`Last updated: ${dayjs().format('MMMM D, YYYY')}`}
      sections={sections}
    >
      <LegalSection id="acceptance" title="1. Acceptance of Terms">
        <p>By creating an account or using any part of the ClinicOS platform, you confirm that you are at least 18 years old, have the legal authority to enter into this agreement, and agree to be bound by these Terms and our Privacy Policy.</p>
        <p>If you are using ClinicOS on behalf of an organisation, you represent and warrant that you have the authority to bind that organisation to these Terms.</p>
      </LegalSection>

      <LegalSection id="services" title="2. Description of Services">
        <p>ClinicOS provides a cloud-based clinic management platform including appointment scheduling, digital intake forms, SMS reminders, patient management, and analytics (collectively, the "Services").</p>
        <p>We reserve the right to modify, suspend, or discontinue any feature of the Services at any time, with reasonable notice where practicable.</p>
      </LegalSection>

      <LegalSection id="account" title="3. Account Registration & Security">
        <p>You must provide accurate, complete, and current information when registering. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.</p>
        <p>You must immediately notify ClinicOS of any unauthorised use of your account at <a href="mailto:security@clinicos.io" className="text-primary hover:underline">security@clinicos.io</a>.</p>
      </LegalSection>

      <LegalSection id="payment" title="4. Subscription & Payment">
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { title: 'Free Trial', desc: 'We offer a 14-day free trial. No credit card required during the trial period.' },
            { title: 'Paid Plans', desc: 'After the trial, continued use requires a paid subscription billed in advance monthly or annually.' },
            { title: 'Cancellation', desc: 'You may cancel at any time. Access continues until the end of the current billing period. No partial-period refunds.' },
            { title: 'Price Changes', desc: 'We provide at least 30 days\' notice before changing subscription prices. Changes take effect at the next renewal.' },
          ].map(({ title, desc }) => (
            <div key={title} className="p-4 rounded-xl border border-border/50 bg-background">
              <p className="font-semibold text-foreground text-sm mb-1">{title}</p>
              <p className="text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection id="acceptable" title="5. Acceptable Use">
        <p>You agree not to use ClinicOS to:</p>
        <ul className="list-none space-y-2.5 mt-2">
          {[
            'Violate any applicable laws or regulations, including healthcare privacy laws',
            'Transmit unlawful, harmful, threatening, or fraudulent content',
            'Attempt to gain unauthorised access to any part of the platform',
            'Reverse engineer, decompile, or attempt to extract source code',
            'Resell, sublicense, or commercialise the platform without written authorisation',
            'Upload malware, viruses, or any malicious code',
            'Interfere with or disrupt the integrity or performance of the Services',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-[9px] shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection id="hipaa" title="6. Patient Data & HIPAA Compliance">
        <p>ClinicOS acts as a data processor for patient health information. Clinics (data controllers) are responsible for ensuring they have appropriate legal bases for processing patient data.</p>
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 mt-3">
          <p className="text-sm font-semibold text-foreground mb-1">Business Associate Agreement (BAA)</p>
          <p className="text-sm">We can provide a HIPAA-compliant BAA upon request. Contact <a href="mailto:compliance@clinicos.io" className="text-primary hover:underline font-medium">compliance@clinicos.io</a>.</p>
        </div>
        <p className="mt-3">You are responsible for obtaining all necessary patient consents before uploading patient data to the platform.</p>
      </LegalSection>

      <LegalSection id="ip" title="7. Intellectual Property">
        <p><strong className="text-foreground font-semibold">Our IP:</strong> The ClinicOS platform, including its software, design, trademarks, and content, is owned by ClinicOS and protected by intellectual property laws. You receive a limited, non-exclusive, non-transferable licence to use the Services.</p>
        <p><strong className="text-foreground font-semibold">Your Data:</strong> You retain all ownership rights to data you upload to ClinicOS. You grant us a limited licence to process your data solely for the purpose of providing the Services.</p>
      </LegalSection>

      <LegalSection id="sla" title="8. Service Availability & SLA">
        <p>We target <strong className="text-foreground">99.9% monthly uptime</strong>. Planned maintenance windows are announced at least 48 hours in advance.</p>
        <p>In the event of unplanned downtime exceeding our SLA, eligible customers may receive service credits as described in our Service Level Agreement, available on request.</p>
      </LegalSection>

      <LegalSection id="liability" title="9. Limitation of Liability">
        <p>To the maximum extent permitted by law, ClinicOS's total liability for any claims arising from these Terms or the Services shall not exceed the amounts you paid to ClinicOS in the 12 months preceding the claim.</p>
        <p>ClinicOS shall not be liable for indirect, incidental, special, consequential, or punitive damages, including loss of revenue, data, or goodwill.</p>
      </LegalSection>

      <LegalSection id="indemnification" title="10. Indemnification">
        <p>You agree to indemnify and hold harmless ClinicOS, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including legal fees) arising from: (a) your use of the Services; (b) your violation of these Terms; or (c) your violation of any third-party rights.</p>
      </LegalSection>

      <LegalSection id="termination" title="11. Termination">
        <p>Either party may terminate this agreement at any time. ClinicOS may suspend or terminate your account immediately for breach of these Terms, with or without notice.</p>
        <p>Upon termination, your right to use the Services ceases immediately. We will provide a 30-day window to export your data before deletion.</p>
      </LegalSection>

      <LegalSection id="governing" title="12. Governing Law">
        <p>These Terms shall be governed by the laws of Pakistan, without regard to its conflict of law provisions. Any disputes shall be subject to the exclusive jurisdiction of the courts of Lahore, Pakistan.</p>
      </LegalSection>

      <LegalSection id="changes" title="13. Changes to Terms">
        <p>We may update these Terms periodically. We will provide at least 30 days' notice of material changes via email or in-app notification. Continued use after the effective date constitutes acceptance.</p>
      </LegalSection>

      <LegalSection id="contact" title="14. Contact">
        <p>Questions about these Terms?</p>
        <div className="mt-4 p-5 rounded-2xl border border-border/60 bg-background">
          <p className="font-bold text-foreground mb-2">ClinicOS Legal Team</p>
          <div className="space-y-1 text-sm">
            <p>Email: <a href="mailto:legal@clinicos.io" className="text-primary hover:underline font-medium">legal@clinicos.io</a></p>
            <p>Address: ClinicOS Ltd., Lahore, Pakistan</p>
          </div>
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
}
