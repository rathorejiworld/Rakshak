import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useReports } from '@/hooks/useReports'
import DashboardLayout from '@/components/ui/dashboard-with-collapsible-sidebar'
import { X, Upload } from 'lucide-react'

export default function NewReport() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { createReport } = useReports(user?.id)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'legal',
    isAnonymous: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAnonymousToggle = () => {
    setFormData(prev => ({ ...prev, isAnonymous: !prev.isAnonymous }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await createReport({
        reporter_id: formData.isAnonymous ? null : user?.id,
        is_anonymous: formData.isAnonymous,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: 'medium',
      })

      // Extract role from URL for redirect
      const pathMatch = location.pathname.match(/\/dashboard\/(\w+)/)
      const role = pathMatch ? pathMatch[1] : 'student'
      navigate(`/dashboard/${role}/myReport`)
    } catch (err: any) {
      setError(err?.message || 'Failed to create report')
    } finally {
      setLoading(false)
    }
  }

  const pathMatch = location.pathname.match(/\/dashboard\/(\w+)/)
  const role = pathMatch ? pathMatch[1] : 'student'

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-100">File a New Report</h1>
              <button
                onClick={() => navigate(`/dashboard/${role}`)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Report Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Brief title of your report"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="legal">Legal Guidance</option>
                  <option value="emotional">Emotional Support</option>
                  <option value="medical">Medical</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your situation in detail"
                  rows={5}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                />
              </div>

              {/* Anonymous Toggle */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-300">File Anonymously?</label>
                <button
                  type="button"
                  onClick={handleAnonymousToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isAnonymous ? 'bg-cyan-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isAnonymous ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Attach Evidence (Optional)</label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Drag and drop files or click to upload</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-sm hover:shadow-cyan-500/30 border border-cyan-500/30 hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/${role}`)}
                  className="flex-1 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white font-semibold hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}