import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Link } from "react-router-dom";

function Settings() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        <div className="grid gap-8 max-w-2xl mx-auto">

          {/* Personal Data */}
          <section className="bg-white dark:bg-muted rounded-2xl shadow p-6 space-y-4 border">
            <h2 className="text-xl font-semibold mb-2">Personal Data</h2>
            <div>
              <label className="block font-medium mb-1">Name</label>
              <input type="text" className="w-full border rounded p-2" placeholder="Your name" />
            </div>
            <div>
              <label className="block font-medium mb-1">Email</label>
              <input type="email" className="w-full border rounded p-2" value="your@email.com" disabled />
            </div>
          </section>

          {/* Account Security */}
          <section className="bg-white dark:bg-muted rounded-2xl shadow p-6 space-y-4 border">
            <h2 className="text-xl font-semibold mb-2">Account Security</h2>
            <div>
              <Button size="sm" variant="outline">Change Password</Button>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="2fa" className="accent-blue-600" />
              <label htmlFor="2fa" className="font-medium">Two-Factor Authentication</label>
            </div>
            <div>
              <Button size="sm" variant="outline" className="mt-2">View Active Sessions</Button>
            </div>
          </section>

          {/* Language & Accessibility */}
          <section className="bg-white dark:bg-muted rounded-2xl shadow p-6 space-y-4 border">
            <h2 className="text-xl font-semibold mb-2">Language & Accessibility</h2>
            <div>
              <label className="block font-medium mb-1">Language</label>
              <select className="w-full border rounded p-2" defaultValue="English">
                <option>English</option>
                <option>Română</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">Interface language updates instantly. (Saved in your account)</p>
            </div>
            <div>
              <label className="block font-medium mb-1">Theme</label>
              <select className="w-full border rounded p-2" defaultValue="Light">
                <option>Light</option>
                <option>Dark</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Text Size</label>
              <select className="w-full border rounded p-2" defaultValue="Normal">
                <option>Normal</option>
                <option>Large</option>
              </select>
            </div>
          </section>

          {/* Notifications */}
          <section className="bg-white dark:bg-muted rounded-2xl shadow p-6 space-y-4 border">
            <h2 className="text-xl font-semibold mb-2">Notifications</h2>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="examReminders" className="accent-blue-600" defaultChecked />
              <label htmlFor="examReminders">Exam Email Reminders</label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receive reminders 24h and 1h before your exams. You can disable them here.
            </p>
          </section>

          {/* Privacy & Data */}
          <section className="bg-white dark:bg-muted rounded-2xl shadow p-6 space-y-4 border">
            <h2 className="text-xl font-semibold mb-2">Privacy & Data</h2>
            <div>
              <a href="/privacy-policy" className="text-blue-600 underline">View Privacy Policy</a>
            </div>
            <div>
              <Button size="sm" variant="outline">Download My Data</Button>
            </div>
            <div>
              <Button size="sm" variant="destructive">Delete My Account</Button>
              <p className="text-xs text-muted-foreground mt-1">
                Requesting deletion will send a confirmation email. Your data will be deleted within 24h after confirmation.
              </p>
            </div>
          </section>

          {/* Support */}
          <section className="bg-white dark:bg-muted rounded-2xl shadow p-6 space-y-4 border">
            <h2 className="text-xl font-semibold mb-2">Support</h2>
            <div>
              <a href="/support" className="text-blue-600 underline">Contact Support</a>
            </div>
            <div>
              <a href="/faq" className="text-blue-600 underline">FAQs / Help Center</a>
            </div>
          </section>

          {/* Back button */}
          <div className="flex justify-center">
            <Link to="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Settings;
