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
  <div className="container px-4 sm:px-6 mx-auto max-w-6xl">
    <div className="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">How It Works</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          The simple, step-by-step process to experience secure exams.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-background p-6 rounded-lg border">
          <h3 className="text-xl font-semibold mb-2">1. Register</h3>
          <p className="text-muted-foreground">Create your account as a student, teacher or institution.</p>
        </div>
        <div className="bg-background p-6 rounded-lg border">
          <h3 className="text-xl font-semibold mb-2">2. Create/Join Exam</h3>
          <p className="text-muted-foreground">Easily participate in or organize secure exams online.</p>
        </div>
        <div className="bg-background p-6 rounded-lg border">
          <h3 className="text-xl font-semibold mb-2">3. Take Exam</h3>
          <p className="text-muted-foreground">Enjoy a streamlined, fair and monitored exam experience.</p>
        </div>
        <div className="bg-background p-6 rounded-lg border">
          <h3 className="text-xl font-semibold mb-2">4. Get Results</h3>
          <p className="text-muted-foreground">Receive instant grading and detailed feedback.</p>
        </div>
      </div>
    </div>
  </div>
</section>


        {/* Who is it for */}
        <section className="py-20 bg-muted/50">
  <div className="container px-4 sm:px-6 mx-auto max-w-6xl">
    <div className="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">Who is it for?</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Designed for every role in the education ecosystem.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-background p-6 rounded-lg border">
          <h3 className="text-xl font-semibold mb-2">Teachers</h3>
          <p className="text-muted-foreground">Easily manage, create, and monitor exams.</p>
        </div>
        <div className="bg-background p-6 rounded-lg border">
          <h3 className="text-xl font-semibold mb-2">Students</h3>
          <p className="text-muted-foreground">Participate in exams from anywhere with fairness.</p>
        </div>
        <div className="bg-background p-6 rounded-lg border">
          <h3 className="text-xl font-semibold mb-2">Universities</h3>
          <p className="text-muted-foreground">Oversee exams at scale with robust analytics and security.</p>
        </div>
        <div className="bg-background p-6 rounded-lg border">
          <h3 className="text-xl font-semibold mb-2">Institutions</h3>
          <p className="text-muted-foreground">Integrate our system for your entire educational process.</p>
        </div>
      </div>
    </div>
  </div>
</section>


        {/* Testimonials */}
        <section className="py-20">
  <div className="container px-4 sm:px-6 mx-auto max-w-6xl">
    <div className="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">Testimonials</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Trusted by educators and students around the world.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
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
          <span className="block font-semibold">– Dr. Popescu, Admin</span>
        </div>
        <div className="bg-background p-6 rounded-lg border">
          <p className="italic mb-2">"Best platform for online assessments!"</p>
          <span className="block font-semibold">– Mihai, IT Specialist</span>
        </div>
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

