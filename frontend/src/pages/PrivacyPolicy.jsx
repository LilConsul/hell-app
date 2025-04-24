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
        <p className="mb-6 text-muted-foreground">
          At HellApp, we are committed to transparency regarding how your personal data is collected, used, and protected. This policy provides a clear overview of our practices, so you can make informed decisions about your privacy when using our platform.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">1. Data We Collect</h2>
        <ul className="list-disc pl-5 text-muted-foreground">
          <li>
            <strong>Identification data:</strong> Name, email address, institutional affiliation, and any other information you provide during registration or profile updates.
          </li>
          <li>
            <strong>Exam-related data:</strong> Submissions, answers, grades, time logs, and interactions with assessments on the platform.
          </li>
          <li>
            <strong>Technical and security data:</strong> Device type, browser, operating system, IP address, and usage statistics necessary for platform integrity and security.
          </li>
          <li>
            <strong>Anti-cheat monitoring data:</strong> In accordance with academic requirements, we may process webcam activity, tab-switching events, or security alerts generated during examinations. Such features will always be communicated in advance.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">2. Purposes of Data Processing</h2>
        <ul className="list-disc pl-5 text-muted-foreground">
          <li>To provide and manage your account and enable participation in online examinations.</li>
          <li>To ensure the integrity and fairness of assessments through security and anti-cheating measures.</li>
          <li>To support teachers and administrators in managing and evaluating exam activities.</li>
          <li>To respond to your requests, provide support, and maintain platform security.</li>
          <li>To improve our services based on usage analytics and feedback.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">3. Data Use and Disclosure</h2>
        <ul className="list-disc pl-5 text-muted-foreground">
          <li>
            Your data is accessible only to authorized personnel, such as your instructors and institutional administrators, strictly for educational purposes.
          </li>
          <li>
            We <span className="font-bold">do not sell or rent</span> your personal data to third parties. Data is never used for advertising purposes.
          </li>
          <li>
            Certain technical data may be processed by trusted service providers (e.g., for secure hosting, analytics, or support), under confidentiality agreements.
          </li>
          <li>
            We may disclose data if required to comply with applicable laws or legal proceedings.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">4. Your Rights and Choices</h2>
        <ul className="list-disc pl-5 text-muted-foreground">
          <li>
            You may review and update your personal information at any time in your profile settings.
          </li>
          <li>
            You may request deletion of your account and associated data, subject to institutional or legal retention obligations.
          </li>
          <li>
            For any concerns, requests, or questions regarding your data, you may contact us at <span className="underline">privacy@hellapp.com</span>.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">5. Data Security</h2>
        <p className="mb-4 text-muted-foreground">
          We implement industry-standard security measures to protect your data against unauthorized access, alteration, or loss. Access is restricted to individuals with a legitimate need, and all sensitive information is stored and transmitted securely.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">6. Data Retention</h2>
        <p className="mb-4 text-muted-foreground">
          Your personal data is retained only as long as necessary for educational, legal, or security purposes. When no longer required, data is securely deleted or anonymized.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">7. Policy Updates</h2>
        <p className="mb-4 text-muted-foreground">
          Any significant changes to this policy will be communicated via the platform or by email. The most current version is always available on this page.
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

export default PrivacyPolicy
