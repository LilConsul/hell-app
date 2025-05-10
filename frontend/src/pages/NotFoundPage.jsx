import React from 'react'
import { Link } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { Button } from '@/components/ui/button'

export default function NotFoundPageLight() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black">
      <main className="relative z-10 p-6 text-center text-black dark:text-white flex flex-col items-center space-y-8">
        {/* Logo + App Name */}
        <div className="flex items-center gap-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 28"
            preserveAspectRatio="xMidYMid meet"
            className="h-20 w-20 overflow-visible"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3l8 4v6c0 5-3.804 9.817-8 11-4.196-1.183-8-6-8-11V7l8-4z"
            />
          </svg>
          <span className="font-extrabold text-4xl">HellApp</span>
        </div>

        {/* 404 cu efect glitch */}
        <h1 className="flex space-x-2 text-8xl font-black glitch-container">
          <span className="glitch-text animate-text-glitch">4</span>
          <span className="glitch-text animate-text-glitch">0</span>
          <span className="glitch-text animate-text-glitch">4</span>
        </h1>

        <p className="text-lg">
          The portal you seek has collapsed into the abyss.
        </p>

        {/* Back to Home Button */}
        <div className="mt-4">
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </main>

      <footer className="w-full absolute bottom-0">
        <Footer className="w-full" />
      </footer>

      {/* Stiluri pentru glitch */}
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