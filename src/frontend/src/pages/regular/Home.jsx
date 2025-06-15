import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Link } from "react-router-dom"
import { ArrowRight, Book, Building, CheckCircle, Clock, Monitor, School, Shield, Users } from "lucide-react"
import { useRef } from "react"
import { SectionHeader } from "@/components/section-header"
import { SectionContainer } from "@/components/section-container"
import { TestimonialCard } from "@/components/testimonial-card"
import { FeatureCard } from "@/components/feature-card"
import HellAppLogo from "../../components/hell-app-logo"

function Home() {
  const featuresRef = useRef(null)

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({behavior: 'smooth'})
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar/>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 md:py-24 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent dark:from-primary/5 z-0"></div>
          <div className="container px-4 sm:px-6 mx-auto max-w-6xl relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-left md:pr-8">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter animate-fade-in">
                  Secure Online Exams with Advanced Anti-Cheat Technology
                </h1>
                <p className="mt-6 text-lg text-muted-foreground">
                  Create, manage, and monitor online exams with confidence. Our platform ensures academic integrity
                  through
                  cutting-edge anti-cheat measures.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-10 items-center sm:items-start">
                  <Button size="lg" className="w-full sm:w-auto px-8" onClick={() => window.openRegisterModal()}>
                    Get Started
                  </Button>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto px-8" onClick={scrollToFeatures}>
                    See Features
                  </Button>
                </div>
                <div className="mt-10 flex items-center gap-4 text-sm">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1 text-primary"/>
                    <span>Trusted by 200+ institutions</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1 text-primary"/>
                    <span>99.9% uptime</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div
                  className="bg-background rounded-lg shadow-xl border p-4 transform rotate-2 transition-transform hover:rotate-0 duration-300">
                  <div className="aspect-video bg-muted/50 rounded-md flex items-center justify-center">
                    <HellAppLogo className="h-20 w-20 text-primary/30"/>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>
        {/* Scroll link :)*/}
        <div ref={featuresRef}/>

        {/* Advanced Anti-Cheat Features */}
        <SectionContainer withBackground>
          <SectionHeader
            title="Advanced Anti-Cheat Features"
            description="Our platform includes sophisticated anti-cheat measures to ensure exam integrity."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Monitor}
              title="Webcam Monitoring"
              description="Tracks student focus and detects suspicious behavior during exams."
              centered
            />
            <FeatureCard
              icon={Shield}
              title="Tab Switching Detection"
              description="Prevents students from searching for answers online during the exam."
              centered
            />
            <FeatureCard
              icon={CheckCircle}
              title="Automatic Grading"
              description="Evaluates answers instantly with customizable question weights."
              centered
            />
            <FeatureCard
              icon={Clock}
              title="Time Management"
              description="Automatic submission when time expires with warning notifications."
              centered
            />
          </div>
        </SectionContainer>

        {/* How it Works */}
        <SectionContainer >
          <SectionHeader
            title="How It Works"
            description="The simple, step-by-step process to experience secure exams."
          />
          <div className="relative">
            <div
              className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-muted -translate-y-1/2 z-0"></div>
            <div className="grid md:grid-cols-4 gap-6 relative z-10">
              {[
                {title: "Register", description: "Create your account as a student, teacher or institution."},
                {title: "Create/Join Exam", description: "Easily participate in or organize secure exams online."},
                {title: "Take Exam", description: "Enjoy a streamlined, fair and monitored exam experience."},
                {title: "Get Results", description: "Receive instant grading and detailed feedback."}
              ].map((step, index) => (
                <div key={index}
                     className="bg-background p-6 rounded-lg border text-center flex flex-col items-center hover:border-primary/50 hover:shadow-md transition-all">
                  <div className="bg-primary/10 rounded-full p-3 mb-4">
                    <div
                      className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionContainer>

        {/* Who is it for */}
        <SectionContainer withBackground>
          <SectionHeader
            title="Who is it for?"
            description="Designed for every role in the education ecosystem."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Users}
              title="Teachers"
              description="Easily manage, create, and monitor exams."
              centered
            />
            <FeatureCard
              icon={Book}
              title="Students"
              description="Participate in exams from anywhere with fairness."
              centered
            />
            <FeatureCard
              icon={School}
              title="Universities"
              description="Oversee exams at scale with robust analytics and security."
              centered
            />
            <FeatureCard
              icon={Building}
              title="Institutions"
              description="Integrate our system for your entire educational process."
              centered
            />
          </div>
        </SectionContainer>

        {/* Testimonials */}
        <SectionContainer>
          <SectionHeader
            title="What Our Users Say"
            description="Trusted by educators and students around the world."
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TestimonialCard
              quote="This platform made remote exams so much easier and safer for my class. I can focus on creating good questions instead of worrying about cheating."
              name="Maria D."
              role="University Professor"
              initial="M"
            />
            <TestimonialCard
              quote="I loved how fast I got my grades and how fair the exams felt! Much better than traditional exams with all the waiting and uncertainty."
              name="Alex M."
              role="Computer Science Student"
              initial="A"
            />
            <TestimonialCard
              quote="As a school administrator, I've seen a 40% reduction in academic integrity cases since implementing this platform. The analytics help us identify potential issues before they become problems."
              name="Yehor Karabanov"
              role="School Administrator"
              initial="Y"
            />
            <TestimonialCard
              quote="The security features are impressive. From our IT department's perspective, this platform offers the perfect balance between robust protection and user-friendly interface."
              name="Shevchenko Denys"
              role="IT Director at University"
              initial="D"
            />
            <TestimonialCard
              quote="My high school students are more engaged with online assessments. The platform's anti-cheat features have actually motivated them to study properly rather than looking for shortcuts."
              name="Valerii Matviiv"
              role="High School Teacher"
              initial="V"
            />
          </div>
        </SectionContainer>

        {/* CTA Section */}
        <SectionContainer withBackground>
          <div className="bg-white dark:bg-muted rounded-2xl shadow-lg p-8 border border-primary/20 max-w-4xl mx-auto">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">
                Ready to transform your examination process?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Join thousands of educators and students who are already using our platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="px-8" onClick={() => window.openRegisterModal()}>
                  Get Started Free
                </Button>
                <Link to="/request">
                  <Button size="lg" variant="outline" className="px-8">
                    Request Demo
                    <ArrowRight className="ml-2 h-4 w-4"/>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </SectionContainer>
      </main>
      <Footer/>
    </div>
  )
}

export default Home;