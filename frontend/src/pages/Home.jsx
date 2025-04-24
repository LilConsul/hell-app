import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Link } from "react-router-dom"

function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-20 text-center">
          <div className="container px-4 sm:px-6 mx-auto max-w-6xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter max-w-3xl mx-auto">
              Secure Online Exams with Advanced Anti-Cheat Technology
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Create, manage, and monitor online exams with confidence. Our platform ensures academic integrity through
              cutting-edge anti-cheat measures.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 items-center">
                <Button size="lg" className="w-[148px] px-8" onClick={() => window.openRegisterModal()}>
                  Get Started
                </Button>
              <Link to="/request">
                <Button size="lg" variant="outline" className="w-[148px] px-8">
                  Request Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Advanced Anti-Cheat Features */}
        <section className="py-20 bg-muted/50">
          <div className="container px-4 sm:px-6 mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">Advanced Anti-Cheat Features</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Our platform includes sophisticated anti-cheat measures to ensure exam integrity as described in the requirements.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-background p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold mb-2">Webcam Monitoring</h3>
                  <p className="text-muted-foreground">
                    Tracks student focus and detects suspicious behavior during exams.
                  </p>
                </div>
                <div className="bg-background p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold mb-2">Tab Switching Detection</h3>
                  <p className="text-muted-foreground">
                    Prevents students from searching for answers online during the exam.
                  </p>
                </div>
                <div className="bg-background p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold mb-2">Automatic Grading</h3>
                  <p className="text-muted-foreground">
                    Evaluates answers instantly with customizable question weights.
                  </p>
                </div>
                <div className="bg-background p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold mb-2">Time Management</h3>
                  <p className="text-muted-foreground">
                    Automatic submission when time expires with warning notifications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-20">
          <div className="container px-4 sm:px-6 mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-6">How it Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-2">1. Register an Account</h3>
                <p className="text-muted-foreground">
                  Sign up easily as a student, teacher, or institution.
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-2">2. Create or Join Exams</h3>
                <p className="text-muted-foreground">
                  Organize or participate in secure online exams with just a few clicks.
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-2">3. Get Instant Results</h3>
                <p className="text-muted-foreground">
                  Receive automatic grading and detailed reports as soon as the exam ends.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who is it for */}
        <section className="py-20 bg-muted/50">
          <div className="container px-4 sm:px-6 mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-6">Who is it for?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-2">Teachers</h3>
                <p className="text-muted-foreground">
                  Create and monitor exams, track student performance, and maintain academic integrity.
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-2">Students</h3>
                <p className="text-muted-foreground">
                  Participate in fair and transparent assessments from anywhere.
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-2">Universities</h3>
                <p className="text-muted-foreground">
                  Manage exams at scale with advanced analytics and security.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20">
          <div className="container px-4 sm:px-6 mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-6">Testimonials</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg border">
                <p className="italic mb-2">"This platform made remote exams so much easier and safer for my class."</p>
                <span className="block font-semibold">– Maria, Teacher</span>
              </div>
              <div className="bg-background p-6 rounded-lg border">
                <p className="italic mb-2">"I loved how fast I got my grades and how fair the exams felt!"</p>
                <span className="block font-semibold">– Alex, Student</span>
              </div>
              <div className="bg-background p-6 rounded-lg border">
                <p className="italic mb-2">"Managing exams across our university was never this secure and streamlined."</p>
                <span className="block font-semibold">– Dr. Popescu, University Admin</span>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}

export default Home;

