import HellAppLogo from "./hell-app-logo"
import { Link } from "react-router-dom"

export function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <HellAppLogo className="h-6 w-6" />
          <span className="font-semibold">HellApp</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} HellApp. All rights reserved.
        </p>
        <Link
          to="/privacy-policy"
          className="text-sm text-muted-foreground underline-offset-2 hover:underline transition"
        >
          Privacy Policy
        </Link>
      </div>
    </footer>
  )
}
