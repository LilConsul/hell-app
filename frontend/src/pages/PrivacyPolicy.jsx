import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

function PrivacyPolicy() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 container py-10 max-w-3xl mx-auto pt-20">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="mb-4 text-muted-foreground">
          Thank you for choosing HellApp. We value your privacy and are committed to protecting your personal information. This Privacy Policy describes how we collect, use, disclose, and safeguard your data when you interact with our online examination platform.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">1. What Information Do We Collect?</h2>
        <ul className="list-disc pl-5 text-muted-foreground">
          <li>
            <strong>Personal Information:</strong> Name, email address, profile photo, institution affiliation, and other details you provide during registration or while updating your profile.
          </li>
          <li>
            <strong>Exam Data:</strong> Your exam submissions, scores, answers, timing, feedback, and other activity logs related to the assessments you participate in.
          </li>
          <li>
            <strong>Technical Data:</strong> Device type, browser, operating system, IP address, time zone, log data, and usage statistics.
          </li>
          <li>
            <strong>Anti-Cheat Monitoring Data:</strong> Webcam snapshots, tab switching events, suspicious activity flags, and security logs recorded during exams for integrity purposes.
          </li>
          <li>
            <strong>Communication Data:</strong> Messages sent to support or within the app, contact forms, and feedback you provide.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">2. How Do We Use Your Information?</h2>
        <ul className="list-disc pl-5 text-muted-foreground">
          <li>To create and manage your user account and profile.</li>
          <li>To organize, deliver, and grade online exams securely.</li>
          <li>To ensure exam integrity through anti-cheat measures.</li>
          <li>To generate reports for you and your institution (if applicable).</li>
          <li>To provide you with support and respond to your requests.</li>
          <li>To maintain platform security, monitor usage, and improve our services.</li>
          <li>To communicate important updates or changes in policies and features.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">3. How Is Your Information Shared?</h2>
        <ul className="list-disc pl-5 text-muted-foreground">
          <li>
            We do <span className="font-bold">NOT</span> sell or rent your personal information to third parties.
          </li>
          <li>
            Data may be shared with your institution, exam organizers, or authorized staff for legitimate educational and administrative purposes.
          </li>
          <li>
            We may disclose your information to trusted service providers (such as hosting, analytics, and security services) who assist us in operating the platform, under strict confidentiality agreements.
          </li>
          <li>
            We may disclose information when required by law, regulation, or valid legal process.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">4. Data Storage and Security</h2>
        <p className="mb-4 text-muted-foreground">
          We use modern security technologies and practices to protect your information from unauthorized access, alteration, disclosure, or destruction. All exam data is stored securely and access is limited to authorized personnel. We regularly review our procedures to ensure your privacy is maintained.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">5. Your Rights & Choices</h2>
        <ul className="list-disc pl-5 text-muted-foreground">
          <li>You can access, update, or correct your personal data at any time from your profile settings.</li>
          <li>You may request the deletion of your account or data (subject to legal or educational retention requirements).</li>
          <li>You can opt out of non-essential communications.</li>
          <li>To exercise your rights, contact us via the support section of HellApp or by email at <span className="underline">privacy@hellapp.com</span>.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">6. Data Retention</h2>
        <p className="mb-4 text-muted-foreground">
          We retain your information only as long as is necessary for educational, legal, and security purposes. When no longer required, your data will be securely deleted or anonymized.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">7. Cookies & Tracking Technologies</h2>
        <p className="mb-4 text-muted-foreground">
          HellApp may use cookies and similar technologies to enhance user experience, analyze site usage, and improve our services. You can control cookie preferences via your browser settings.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">8. Changes to this Privacy Policy</h2>
        <p className="mb-4 text-muted-foreground">
          We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. We will notify you of significant changes via the platform or email.
        </p>

        <div className="mt-8">
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default PrivacyPolicy;
