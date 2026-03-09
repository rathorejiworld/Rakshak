import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useReports } from '@/hooks/useReports'
import { format } from 'date-fns'
import DashboardLayout from '@/components/ui/dashboard-with-collapsible-sidebar'

export default function StudentDashboard() {
  const { user, profile } = useAuth()
  const { reports, counts, loading } = useReports(user?.id, profile?.role)

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* KPIs */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:border-cyan-600/40 transition-colors">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Total Reports</h3>
              <p className="text-3xl font-bold text-cyan-400">{reports.length}</p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:border-emerald-600/40 transition-colors">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Resolved Cases</h3>
              <p className="text-3xl font-bold text-emerald-400">{counts.solved}</p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:border-orange-600/40 transition-colors">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Pending Cases</h3>
              <p className="text-3xl font-bold text-orange-400">{counts.pending}</p>
            </div>
          </div>

          {/* Reports List */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-100">My Reports</h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : reports.length === 0 ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
              <p className="text-gray-400 mb-4">You haven't filed any reports yet.</p>
              <Link to="/dashboard/student/report/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-sm hover:shadow-cyan-500/30 border border-cyan-500/30 hover:scale-[1.02] transition-all">
                File Your First Report
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Link
                  key={report.id}
                  to={`/report/${report.id}`}
                  className="rounded-2xl border border-gray-800 bg-gray-900 p-6 block hover:border-cyan-600/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1 text-gray-100">{report.title}</h3>
                      <p className="text-gray-400 text-sm mb-2 line-clamp-2">{report.description}</p>
                      <div className="flex gap-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full border ${
                            report.status === 'resolved'
                              ? 'bg-emerald-900/30 border-emerald-700 text-emerald-300'
                              : report.status === 'in_progress'
                              ? 'bg-cyan-900/30 border-cyan-700 text-cyan-300'
                              : 'bg-gray-800 border-gray-700 text-gray-300'
                          }`}
                        >
                          {report.status}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-900/30 border border-purple-700 text-purple-300">
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

          {/* Quick Links */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <Link to="/dashboard/student/chat" className="rounded-2xl border border-gray-800 bg-gray-900 p-6 block hover:border-cyan-600/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all">
              <h3 className="text-lg font-semibold mb-2 text-gray-100">💬 Chat with Assistants</h3>
              <p className="text-gray-400">Get emotional or legal support from our AI assistants</p>
            </Link>

            <Link to="/dashboard/student/myReport" className="rounded-2xl border border-gray-800 bg-gray-900 p-6 block hover:border-cyan-600/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all">
              <h3 className="text-lg font-semibold mb-2 text-gray-100">📋 My Reports</h3>
              <p className="text-gray-400">View all your filed reports and their statuses</p>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
