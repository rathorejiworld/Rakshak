import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/ui/dashboard-with-collapsible-sidebar'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function Settings() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Form states
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  // Update display name
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)

    try {
      console.log('📝 Updating display name:', displayName)

      if (!displayName.trim()) {
        throw new Error('Display name cannot be empty')
      }

      const { error: updateError } = await supabase
        .from('students')
        .update({ display_name: displayName })
        .eq('id', user?.id)

      if (updateError) {
        // Try updating in teachers table
        const { error: teacherError } = await supabase
          .from('teachers')
          .update({ display_name: displayName })
          .eq('id', user?.id)

        if (teacherError) {
          throw teacherError
        }
      }

      setSuccess('✅ Display name updated successfully!')
      console.log('✅ Display name updated')
    } catch (err: any) {
      console.error('❌ Error updating name:', err)
      setError(err.message || 'Failed to update display name')
    } finally {
      setLoading(false)
    }
  }

  // Update email
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)

    try {
      console.log('📧 Updating email:', email)

      if (!email.trim()) {
        throw new Error('Email cannot be empty')
      }

      const { error: emailError } = await supabase.auth.updateUser({
        email: email,
      })

      if (emailError) {
        throw emailError
      }

      setSuccess('✅ Email update request sent! Please check your email to confirm the change.')
      console.log('✅ Email update initiated')
    } catch (err: any) {
      console.error('❌ Error updating email:', err)
      setError(err.message || 'Failed to update email')
    } finally {
      setLoading(false)
    }
  }

  // Update password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)

    try {
      console.log('🔐 Updating password')

      if (!newPassword.trim()) {
        throw new Error('New password cannot be empty')
      }

      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (passwordError) {
        throw passwordError
      }

      setSuccess('✅ Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
      console.log('✅ Password updated')
    } catch (err: any) {
      console.error('❌ Error updating password:', err)
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-8">Settings</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 flex items-start gap-3">
              <X className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 flex items-start gap-3">
              <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Success</p>
                <p className="text-sm mt-1">{success}</p>
              </div>
            </div>
          )}

          {/* Display Name Section */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-6">Update Display Name</h2>

            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:shadow-cyan-500/30 border border-cyan-500/30 hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Display Name'}
              </button>
            </form>
          </div>

          {/* Email Section */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-6">Update Email</h2>

            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your new email"
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  disabled={loading}
                />
                <p className="text-xs text-gray-400 mt-2">
                  You'll need to verify the new email address via a confirmation link
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:shadow-cyan-500/30 border border-cyan-500/30 hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Email'}
              </button>
            </form>
          </div>

          {/* Password Section */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8">
            <h2 className="text-xl font-semibold text-gray-100 mb-6">Change Password</h2>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-400 space-y-1">
                <p>• Password must be at least 6 characters</p>
                <p>• Passwords must match</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:shadow-cyan-500/30 border border-cyan-500/30 hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Account Info */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 mt-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-6">Account Information</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">User ID</p>
                <p className="text-white font-mono text-sm">{user?.id}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Current Email</p>
                <p className="text-white">{user?.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Account Created</p>
                <p className="text-white">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
