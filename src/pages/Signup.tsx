import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/Navbar'
import SmokeyBackground from '@/components/ui/login-form'

export default function Signup() {
  const navigate = useNavigate()
  const { signUp, loading } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'student' as 'student' | 'teacher',
  })
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    // Validation
    if (!formData.email || !formData.password || !formData.displayName) {
      setFormError('Please fill in all fields')
      setIsSubmitting(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match')
      setIsSubmitting(false)
      return
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters')
      setIsSubmitting(false)
      return
    }

    try {
      console.log('📝 Submitting signup form:', { email: formData.email, displayName: formData.displayName, role: formData.role })
      
      await signUp(formData.email, formData.password, formData.displayName, formData.role)
      
      console.log('✅ Signup successful, redirecting to login...')
      // Redirect to login page
      navigate('/login')
    } catch (err: any) {
      console.error('❌ Signup submission error:', err)
      setFormError(err.message || 'Signup failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-gray-100">
      <Navbar />
      {/* Smokey WebGL background only for auth screens */}
      <SmokeyBackground backdropBlurAmount="lg" color="#0EA5E9" />

      <div className="relative flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-cyan-500/20 bg-white/5 backdrop-blur-xl p-8 shadow-xl">
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Create Account</h1>
            <p className="text-gray-400 mb-8">Join Rakshak for support</p>

            {formError && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 mb-6">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 rounded-lg bg-gray-900/60 border border-cyan-500/30 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-colors"
                  required
                  disabled={isSubmitting || loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="w-full px-4 py-2 rounded-lg bg-gray-900/60 border border-cyan-500/30 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-colors"
                  required
                  disabled={isSubmitting || loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-900/60 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400 transition-colors"
                  disabled={isSubmitting || loading}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 rounded-lg bg-gray-900/60 border border-cyan-500/30 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-colors"
                  required
                  disabled={isSubmitting || loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 rounded-lg bg-gray-900/60 border border-cyan-500/30 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-colors"
                  required
                  disabled={isSubmitting || loading}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-cyan-500/20 hover:shadow-cyan-500/30 border border-cyan-500/30 hover:scale-[1.02] transition-all disabled:opacity-50 mt-6"
              >
                {isSubmitting || loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-gray-400 text-sm mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
