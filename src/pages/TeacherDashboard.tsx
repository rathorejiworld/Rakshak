import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase, Report } from '@/lib/supabaseClient'
import Navbar from '@/components/Navbar'
import { format } from 'date-fns'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (user) {
      fetchReports()
    }
  }, [user, filter])

  const fetchReports = async () => {
    try {
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query
      if (error) throw error
      setReports(data || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: reports.length,
    new: reports.filter(r => r.status === 'new').length,
    inProgress: reports.filter(r => r.status === 'in_progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage and triage student reports</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Reports</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          
          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 mb-2">New</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.new}</p>
          </div>
          
          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 mb-2">In Progress</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>
          
          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Resolved</h3>
            <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Reports</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('new')}
                className={`px-4 py-2 rounded-lg ${filter === 'new' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
              >
                New
              </button>
              <button
                onClick={() => setFilter('in_progress')}
                className={`px-4 py-2 rounded-lg ${filter === 'in_progress' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
              >
                In Progress
              </button>
              <button
                onClick={() => setFilter('resolved')}
                className={`px-4 py-2 rounded-lg ${filter === 'resolved' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
              >
                Resolved
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">No reports found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Link
                key={report.id}
                to={`/report/${report.id}`}
                className="card hover:shadow-lg transition-shadow block"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{report.title}</h3>
                      {report.is_anonymous && (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">
                          Anonymous
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {report.description}
                    </p>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        report.priority === 'emergency' ? 'bg-red-100 text-red-800' :
                        report.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        report.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
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
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {format(new Date(report.created_at), 'MMM d, yyyy')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
