import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { ArrowLeft, Lock, Eye, Shield, UserCheck, Server, Clock, RefreshCw } from "lucide-react"

function PrivacyPolicy() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 container py-10 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            At HellApp, we are committed to transparency regarding how your personal data is collected, used, and protected.
          </p>
        </div>

        <div className="grid gap-8 mb-10">
          {/* Introduction card */}
          <section className="bg-white dark:bg-muted rounded-2xl shadow p-6 border">
            <p className="text-muted-foreground">
              This policy provides a clear overview of our practices, so you can make informed decisions about your privacy when using our platform.
            </p>
          </section>

          {/* Data We Collect */}
          <section className="bg-white dark:bg-muted rounded-2xl shadow p-6 border">
            <div className="flex items-start gap-3 mb-4">
              <Eye className="h-5 w-5 mt-1 text-primary" />
              <h2 className="text-xl font-semibold">1. Data We Collect</h2>
            </div>
            <ul className="space-y-3 text-muted-foreground pl-9">
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
          </section>

          {/* Purposes of Data Processing */}
          <section className="bg-white dark:bg-muted rounded-2xl shadow p-6 border">
            <div className="flex items-start gap-3 mb-4">
              <UserCheck className="h-5 w-5 mt-1 text-primary" />
              <h2 className="text-xl font-semibold">2. Purposes of Data Processing</h2>
            </div>
            <ul className="space-y-2 text-muted-foreground pl-9">
              <li>To provide and manage your account and enable participation in online examinations.</li>
              <li>To ensure the integrity and fairness of assessments through security and anti-cheating measures.</li>
              <li>To support teachers and administrators in managing and evaluating exam activities.</li>
              <li>To respond to your requests, provide support, and maintain platform security.</li>
              <li>To improve our services based on usage analytics and feedback.</li>
            </ul>
          </section>

          {/* Data Use and Disclosure */}
          <section className="bg-white dark:bg-muted rounded-2xl shadow p-6 border">
            <div className="flex items-start gap-3 mb-4">
              <Server className="h-5 w-5 mt-1 text-primary" />
              <h2 className="text-xl font-semibold">3. Data Use and Disclosure</h2>
            </div>
            <ul className="space-y-3 text-muted-foreground pl-9">
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
          </section>

          {/* Your Rights and Choices */}
          <section className="bg-white dark:bg-muted rounded-2xl shadow p-6 border">
            <div className="flex items-start gap-3 mb-4">
              <Shield className="h-5 w-5 mt-1 text-primary" />
              <h2 className="text-xl font-semibold">4. Your Rights and Choices</h2>
            </div>
            <ul className="space-y-3 text-muted-foreground pl-9">
              <li>
                You may review and update your personal information at any time in your profile settings.
              </li>
              <li>
                You may request deletion of your account and associated data, subject to institutional or legal retention obligations.
              </li>
              <li>
                For any concerns, requests, or questions regarding your data, you may contact us at <a href="mailto:privacy@hellapp.com" className="text-primary hover:underline">privacy@hellapp.com</a>.
              </li>
            </ul>
          </section>

          {/* Combined shorter sections */}
          <div className="grid md:grid-cols-3 gap-6">
            <section className="bg-white dark:bg-muted rounded-2xl shadow p-6 border">
              <div className="flex items-start gap-3 mb-3">
                <Lock className="h-5 w-5 mt-1 text-primary" />
                <h2 className="text-xl font-semibold">5. Data Security</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                We implement industry-standard security measures to protect your data against unauthorized access, alteration, or loss. All sensitive information is stored and transmitted securely.
              </p>
            </section>

            <section className="bg-white dark:bg-muted rounded-2xl shadow p-6 border">
              <div className="flex items-start gap-3 mb-3">
                <Clock className="h-5 w-5 mt-1 text-primary" />
                <h2 className="text-xl font-semibold">6. Data Retention</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Your personal data is retained only as long as necessary for educational, legal, or security purposes. When no longer required, data is securely deleted or anonymized.
              </p>
            </section>

            <section className="bg-white dark:bg-muted rounded-2xl shadow p-6 border">
              <div className="flex items-start gap-3 mb-3">
                <RefreshCw className="h-5 w-5 mt-1 text-primary" />
                <h2 className="text-xl font-semibold">7. Policy Updates</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Any significant changes to this policy will be communicated via the platform or by email. The most current version is always available on this page.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default PrivacyPolicy