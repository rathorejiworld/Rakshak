import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase, Report, Evidence } from '@/lib/supabaseClient'
import Navbar from '@/components/Navbar'
import { format } from 'date-fns'

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth() // Changed from user to profile
  
  const [report, setReport] = useState<Report | null>(null)
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (id) {
      fetchReport()
      fetchEvidence()
    }
  }, [id])

  const fetchReport = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setReport(data)
      setNewStatus(data.status)
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEvidence = async () => {
    try {
      const { data, error } = await supabase
        .from('evidence')
        .select('*')
        .eq('report_id', id)

      if (error) throw error
      setEvidence(data || [])
    } catch (error) {
      console.error('Error fetching evidence:', error)
    }
  }

  const updateStatus = async () => {
    if (!id || !report) return

    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      setReport({ ...report, status: newStatus as any })
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">Loading...</div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">Report not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="card mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{report.title}</h1>
              <div className="flex gap-2 mb-4">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  report.priority === 'emergency' ? 'bg-red-100 text-red-800' :
                  report.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {report.priority}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                  report.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {report.status.replace('_', ' ')}
                </span>
                <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                  {report.category}
                </span>
                {report.is_anonymous && (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">
                    Anonymous
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {format(new Date(report.created_at), 'PPpp')}
            </div>
          </div>

          <div className="prose max-w-none">
            <p>{report.description}</p>
          </div>

          {report.location && (
            <div className="mt-4 text-sm text-gray-600">
              <strong>Location:</strong> {report.location.city}
            </div>
          )}
        </div>

        {/* Evidence Section */}
        {evidence.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Evidence ({evidence.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {evidence.map((item) => (
                <div key={item.id} className="border rounded-lg p-3">
                  <div className="text-sm font-medium truncate">{item.storage_path.split('/').pop()}</div>
                  <div className="text-xs text-gray-500">{item.file_type}</div>
                  <div className="text-xs text-gray-500">{(item.file_size / 1024).toFixed(1)} KB</div>
                  {item.encrypted && (
                    <div className="text-xs text-green-600 mt-1">🔒 Encrypted</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Section (Teacher/Root only) */}
        {(profile?.role === 'teacher' || profile?.role === 'root') && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Update Status
                </label>
                <div className="flex gap-2">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="input flex-1"
                  >
                    <option value="new">New</option>
                    <option value="triaged">Triaged</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button onClick={updateStatus} className="btn-primary">
                    Update
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Add notes or recommendations..."
                />
                <button className="btn-primary mt-2">Add Comment</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
