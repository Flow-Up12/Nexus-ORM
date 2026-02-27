import { useEffect, useState } from 'react'
import { Database } from 'lucide-react'

interface LoadingScreenProps {
  onComplete?: () => void
  duration?: number
}

export function LoadingScreen({ onComplete, duration = 1800 }: LoadingScreenProps) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const fadeTime = duration - 300
    const fadeTimer = setTimeout(() => setFadeOut(true), fadeTime)
    const completeTimer = setTimeout(() => onComplete?.(), duration)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete, duration])

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 transition-opacity duration-300 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="status"
      aria-label="Loading"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="loading-grid" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.8)_70%)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="nexus-logo">
          <Database className="nexus-icon" />
          <div className="nexus-glow" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h1 className="nexus-title">Nexus ORM</h1>
          <p className="text-sm font-medium text-indigo-300/80 tracking-widest uppercase">Database Manager</p>
        </div>
        <div className="loading-bar-container">
          <div className="loading-bar" style={{ animationDuration: `${duration}ms` }} />
        </div>
      </div>
    </div>
  )
}
