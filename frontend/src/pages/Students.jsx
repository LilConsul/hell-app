import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Link } from "react-router-dom"

export default function Students() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 container py-10">
        <h1 className="text-3xl font-bold mb-6">Students</h1>
        <p>Students content will go here. For now, this is a placeholder.</p>
        <div className="mt-4">
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
