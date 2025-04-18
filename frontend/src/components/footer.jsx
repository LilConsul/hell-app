import { Shield } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <span className="font-semibold">HellApp</span>
        </div>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} HellApp. All rights reserved.</p>
      </div>
    </footer>
  )
}
