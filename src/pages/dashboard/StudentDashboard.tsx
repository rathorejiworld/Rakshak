import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useReports } from '@/hooks/useReports'
import { format } from 'date-fns'
import DashboardLayout from '@/components/ui/dashboard-with-collapsible-sidebar'
import { FileText, CheckCircle, Clock, Plus } from 'lucide-react'

export default function StudentDashboard() {
  const { user, profile, loading: authLoading } = useAuth()
  const { reports, counts, loading: reportsLoading } = useReports(user?.id, profile?.role)

  const loading = authLoading || reportsLoading

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-100 mb-2">
              Welcome back, {profile?.display_name || 'Student'}
            </h1>
            <p className="text-gray-400">Here's an overview of your reports and support resources</p>
          </div>

          {/* KPI Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:border-cyan-600/40 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyan-600/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Total Reports</h3>
                  <p className="text-3xl font-bold text-cyan-400">{reports.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:border-emerald-600/40 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Resolved Cases</h3>
                  <p className="text-3xl font-bold text-emerald-400">{counts.solved}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:border-orange-600/40 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-600/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Pending Cases</h3>
                  <p className="text-3xl font-bold text-orange-400">{counts.pending}</p>
                </div>
              </div>
            </div>
          </div>

          {/* My Reports Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-100">My Reports</h2>
              <Link
                to="/dashboard/student/report/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-sm hover:shadow-cyan-500/30 border border-cyan-500/30 hover:scale-[1.02] transition-all"
              >
                <Plus className="w-4 h-4" />
                New Report
              </Link>
            </div>

            {reports.length === 0 ? (
              <div className="rounded-2xl border border-gray-800 bg-gray-900 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No reports yet</h3>
                <p className="text-gray-400 mb-6">Start by filing your first report to get support</p>
                <Link
                  to="/dashboard/student/report/new"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-sm hover:shadow-cyan-500/30 border border-cyan-500/30 hover:scale-[1.02] transition-all"
                >
                  <Plus className="w-5 h-5" />
                  File Your First Report
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <Link
                    key={report.id}
                    to={`/report/${report.id}`}
                    className="rounded-2xl border border-gray-800 bg-gray-900 p-6 block hover:border-cyan-600/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2 text-gray-100 group-hover:text-cyan-300 transition-colors">
                          {report.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{report.description}</p>
                        <div className="flex gap-2 flex-wrap">
                          <span
                            className={`px-3 py-1 text-xs rounded-full border font-medium ${
                              report.status === 'resolved' || report.status === 'closed'
                                ? 'bg-emerald-900/30 border-emerald-700 text-emerald-300'
                                : report.status === 'in_progress'
                                ? 'bg-cyan-900/30 border-cyan-700 text-cyan-300'
                                : 'bg-gray-800 border-gray-700 text-gray-300'
                            }`}
                          >
                            {report.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="px-3 py-1 text-xs rounded-full bg-purple-900/30 border border-purple-700 text-purple-300 font-medium">
                            {report.category.toUpperCase()}
                          </span>
                          <span
                            className={`px-3 py-1 text-xs rounded-full border font-medium ${
                              report.priority === 'emergency'
                                ? 'bg-red-900/30 border-red-700 text-red-300'
                                : report.priority === 'high'
                                ? 'bg-orange-900/30 border-orange-700 text-orange-300'
                                : 'bg-blue-900/30 border-blue-700 text-blue-300'
                            }`}
                          >
                            {report.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500 ml-4">
                        <div className="text-gray-400 font-medium mb-1">
                          {format(new Date(report.created_at), 'MMM d, yyyy')}
                        </div>
                        <div className="text-gray-600 text-xs">
                          {format(new Date(report.created_at), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              to="/dashboard/student/chat"
              className="rounded-2xl border border-gray-800 bg-gray-900 p-6 block hover:border-pink-600/40 hover:shadow-[0_0_20px_rgba(236,72,153,0.15)] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-pink-600/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-100 group-hover:text-pink-300 transition-colors">
                    Chat with Support
                  </h3>
                  <p className="text-gray-400 text-sm">Get emotional or legal support from our AI assistants 24/7</p>
                </div>
              </div>
            </Link>

            <Link
              to="/dashboard/student/help"
              className="rounded-2xl border border-gray-800 bg-gray-900 p-6 block hover:border-blue-600/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🆘</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-100 group-hover:text-blue-300 transition-colors">
                    Emergency Contacts
                  </h3>
                  <p className="text-gray-400 text-sm">Access helpline numbers and emergency resources</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
