import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/Navbar'
import { HeroSection } from '@/components/ui/3d-hero-section'

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-x-hidden">
      <Navbar />
      <HeroSection
        ctaButtons={{
          primary: { 
            text: user ? 'Go to Dashboard' : 'Get Started Free', 
            onClick: () => user ? navigate('/dashboard/student') : navigate('/signup')
          },
          secondary: { 
            text: 'Emergency Help', 
            onClick: () => navigate('/dashboard/student/chat')
          },
        }}
      />
    </div>
  )
}
