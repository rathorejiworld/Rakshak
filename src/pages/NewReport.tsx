import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useReports } from '@/hooks/useReports'
import DashboardLayout from '@/components/ui/dashboard-with-collapsible-sidebar'
import { Upload, Send, X, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface FormData {
  title: string
  description: string
  category: 'legal' | 'emotional' | 'medical' | 'other'
  isAnonymous: boolean
  location?: string
  priority: 'low' | 'medium' | 'high' | 'emergency'
}

export default function NewReport() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refetch } = useReports(user?.id, 'student')

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: 'emotional',
    isAnonymous: true,
    location: '',
    priority: 'medium',
  })

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleToggleAnonymous = () => {
    setFormData(prev => ({ ...prev, isAnonymous: !prev.isAnonymous }))
  }

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
  }

  const handleFileRemove = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      console.log('📝 Submitting report:', formData)

      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Title is required')
      }

      if (!formData.description.trim()) {
        throw new Error('Description is required')
      }

      // Create report
      const reportData = {
        reporter_id: formData.isAnonymous ? null : user?.id,
        is_anonymous: formData.isAnonymous,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        status: 'new' as const,
        priority: formData.priority,
        location: formData.location ? { text: formData.location } : null,
        metadata: {
          created_via: 'web_form',
          user_agent: navigator.userAgent,
        },
      }

      const { data: createdReport, error: reportError } = await supabase
        .from('reports')
        .insert([reportData])
        .select()

      if (reportError) {
        console.error('❌ Error creating report:', reportError)
        throw reportError
      }

      const reportId = createdReport?.[0]?.id

      if (!reportId) {
        throw new Error('Failed to create report')
      }

      console.log('✅ Report created:', reportId)

      // Upload evidence files if any
      if (uploadedFiles.length > 0) {
        console.log('📤 Uploading', uploadedFiles.length, 'files...')

        for (const file of uploadedFiles) {
          const fileName = `${Date.now()}_${file.name}`
          const filePath = `reports/${reportId}/${fileName}`

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('evidence')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            })

          if (uploadError) {
            console.error('❌ Error uploading file:', uploadError)
            throw uploadError
          }

          // Create evidence record
          const { error: evidenceError } = await supabase
            .from('evidence')
            .insert([
              {
                report_id: reportId,
                storage_path: filePath,
                file_type: file.type,
                file_size: file.size,
                uploaded_by: user?.id,
              },
            ])

          if (evidenceError) {
            console.error('❌ Error creating evidence record:', evidenceError)
            throw evidenceError
          }
        }

        console.log('✅ All files uploaded successfully')
      }

      setSuccess(true)
      console.log('✅ Report submission complete')

      // Refetch reports data
      await refetch()

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard/student')
      }, 2000)
    } catch (err: any) {
      console.error('❌ Error submitting report:', err)
      setError(err.message || 'Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
          <div className="text-center max-w-md">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Report Submitted!</h1>
            <p className="text-gray-400 mb-6">
              {formData.isAnonymous
                ? 'Your anonymous report has been submitted successfully.'
                : 'Your report has been submitted successfully.'}
            </p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Submit a Report</h1>
          <p className="text-gray-400 mb-8">Share your situation securely. You can remain anonymous or identify yourself.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Category & Title */}
            {step === 1 && (
              <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="emotional">Emotional Support</option>
                    <option value="legal">Legal Guidance</option>
                    <option value="medical">Medical Support</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Brief title for your report"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:shadow-cyan-500/30 border border-cyan-500/30 transition-all"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Description */}
            {step === 2 && (
              <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Please describe your situation in detail..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-700 text-gray-300 font-semibold hover:bg-gray-800 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:shadow-cyan-500/30 border border-cyan-500/30 transition-all"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Anonymous & Evidence */}
            {step === 3 && (
              <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Privacy</label>
                  <button
                    type="button"
                    onClick={handleToggleAnonymous}
                    className={`w-full px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                      formData.isAnonymous
                        ? 'border-cyan-600 bg-cyan-600/20 text-cyan-300'
                        : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    {formData.isAnonymous ? '🔒 Anonymous Report' : '👤 Identified Report'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.isAnonymous
                      ? 'Your identity will not be shared with others'
                      : 'Teachers and administrators will see your name'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Location (Optional)</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City or area (optional)"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Evidence Files (Optional)</label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-cyan-500 transition-colors">
                    <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <input
                      type="file"
                      multiple
                      onChange={handleFileAdd}
                      className="hidden"
                      id="file-input"
                    />
                    <label htmlFor="file-input" className="cursor-pointer">
                      <p className="text-gray-300 font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">Images, documents, audio (max 50MB each)</p>
                    </label>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                          <span className="text-sm text-gray-300 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => handleFileRemove(index)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-700 text-gray-300 font-semibold hover:bg-gray-800 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-green-500/30 border border-green-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Submitting...' : <>
                      <Send className="w-4 h-4" />
                      Submit Report
                    </>}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
