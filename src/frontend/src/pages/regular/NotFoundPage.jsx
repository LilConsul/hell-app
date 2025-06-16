import React from 'react'
import { Link } from 'react-router-dom'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import HellAppLogo from "../../components/hell-app-logo"

export default function NotFoundPageLight() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black">
      <main className="relative z-10 p-6 text-center text-black dark:text-white flex flex-col items-center space-y-8">
        
        <div className=" flex items-center justify-center">
        <HellAppLogo className="h-20 w-20 text-primary/30"/>
        </div>

        <h1 className="flex space-x-2 text-8xl font-black glitch-container">
          <span className="glitch-text animate-text-glitch">4</span>
          <span className="glitch-text animate-text-glitch">0</span>
          <span className="glitch-text animate-text-glitch">4</span>
        </h1>

        <p className="text-lg">
          The portal you seek has collapsed into the abyss.
        </p>

        <div className="mt-4">
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </main>

      <footer className="w-full absolute bottom-0">
        <Footer className="w-full" />
      </footer>

      <style jsx global>{`
        .glitch-text {
          -webkit-text-stroke: 2px currentColor;
          text-stroke: 2px currentColor;
          display: inline-block;
        }
        @keyframes text-glitch {
          0% { clip-path: inset(0 0 100% 0); }
          20%, 80% { clip-path: inset(20% 0 65% 0); }
          40%, 60% { clip-path: inset(40% 0 45% 0); }
          100% { clip-path: inset(0 0 0 0); }
        }
        .animate-text-glitch {
          animation: text-glitch 2s infinite;
        }
      `}</style>
    </div>
  )
}
