import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Link } from "react-router-dom"
import { ArrowRight, Book, Building, CheckCircle, Clock, Monitor, School, Shield, Users, FileText, BarChart3, Globe } from "lucide-react"
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
                  Modern Online Examination Platform
                </h1>
                <p className="mt-6 text-lg text-muted-foreground">
                  Create, manage, and take online exams with ease. Our platform provides a seamless experience for
                  educators and students with powerful features and reliable performance.
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

        {/* Platform Features */}
        <SectionContainer withBackground>
          <SectionHeader
            title="Empowering Educators, Supporting Students"
            description="Everything you need for a complete online examination experience."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={FileText}
              title="Easy Exam Creation"
              description="Build comprehensive exams with multiple question types and customizable formats."
              centered
            />
            <FeatureCard
              icon={BarChart3}
              title="Detailed Analytics"
              description="Get insights into student performance with comprehensive reporting and statistics."
              centered
            />
            <FeatureCard
              icon={CheckCircle}
              title="Automatic Grading"
              description="Evaluates answers instantly with customizable question weights and instant feedback."
              centered
            />
            <FeatureCard
              icon={Globe}
              title="Accessible Anywhere"
              description="Take exams from any device, anywhere with our responsive web platform."
              centered
            />
          </div>
        </SectionContainer>

        {/* How it Works */}
        <SectionContainer >
          <SectionHeader
            title="How It Works"
            description="The simple, step-by-step process to get started with online exams."
          />
          <div className="relative">
            <div
              className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-muted -translate-y-1/2 z-0"></div>
            <div className="grid md:grid-cols-4 gap-6 relative z-10">
              {[
                {title: "Register", description: "Create your account as a student, teacher or institution."},
                {title: "Create/Join Exam", description: "Easily participate in or organize online exams with our intuitive interface."},
                {title: "Take Exam", description: "Enjoy a streamlined and user-friendly exam experience."},
                {title: "Get Results", description: "Receive instant grading and detailed feedback on performance."}
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
              description="Easily manage, create, and monitor exams with comprehensive tools."
              centered
            />
            <FeatureCard
              icon={Book}
              title="Students"
              description="Take exams from anywhere with a smooth and intuitive interface."
              centered
            />
            <FeatureCard
              icon={School}
              title="Universities"
              description="Manage exams at scale with robust analytics and administrative features."
              centered
            />
            <FeatureCard
              icon={Building}
              title="Institutions"
              description="Integrate our system seamlessly into your educational infrastructure."
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
              quote="This platform made remote exams so much easier and more efficient for my class. I can focus on creating quality questions and get detailed insights into student performance."
              name="Iana N."
              role="University Professor"
              initial="I"
            />
            <TestimonialCard
              quote="I loved how fast I got my grades and how smooth the exam experience was! The interface is intuitive and much better than traditional paper-based exams."
              name="Alex M."
              role="Computer Science Student"
              initial="A"
            />
            <TestimonialCard
              quote="As a school administrator, I've seen significant improvements in our examination process. The analytics help us understand student performance patterns and improve our curriculum."
              name="Yehor Karabanov"
              role="School Administrator"
              initial="Y"
            />
            <TestimonialCard
              quote="The platform is incredibly user-friendly from our IT department's perspective. It offers excellent performance and integrates well with our existing systems."
              name="Shevchenko Denys"
              role="IT Director at University"
              initial="D"
            />
            <TestimonialCard
              quote="My high school students are more engaged with online assessments. The platform's features have made the examination process more efficient and enjoyable for everyone."
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
              <div className="flex justify-center">
                <Button size="lg" className="px-8" onClick={() => window.openRegisterModal()}>
                  Get Started Free
                </Button>
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