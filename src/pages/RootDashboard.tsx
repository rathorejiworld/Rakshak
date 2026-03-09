import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase, Report, Profile } from '@/lib/supabaseClient'
import Navbar from '@/components/Navbar'
import { format } from 'date-fns'

export default function RootDashboard() {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'reports' | 'users'>('reports')

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      const [reportsData, usersData] = await Promise.all([
        supabase.from('reports').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false })
      ])

      if (reportsData.data) setReports(reportsData.data)
      if (usersData.data) setUsers(usersData.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    totalReports: reports.length,
    totalUsers: users.length,
    students: users.filter(u => u.role === 'student').length,
    teachers: users.filter(u => u.role === 'teacher').length,
    roots: users.filter(u => u.role === 'root').length,
    emergencyReports: reports.filter(r => r.priority === 'emergency').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Root Dashboard</h1>
          <p className="text-gray-600 mt-2">Administrative control panel</p>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Reports</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
          </div>
          
          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Emergency</h3>
            <p className="text-2xl font-bold text-red-600">{stats.emergencyReports}</p>
          </div>
          
          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Users</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>
          
          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Students</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.students}</p>
          </div>
          
          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Teachers</h3>
            <p className="text-2xl font-bold text-green-600">{stats.teachers}</p>
          </div>
          
          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Root Users</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.roots}</p>
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex gap-4 border-b">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'reports'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600'
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'users'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600'
              }`}
            >
              User Management
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : activeTab === 'reports' ? (
          <div className="space-y-4">
            {reports.map((report) => (
              <Link
                key={report.id}
                to={`/report/${report.id}`}
                className="card hover:shadow-lg transition-shadow block"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{report.title}</h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {report.description}
                    </p>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        report.priority === 'emergency' ? 'bg-red-100 text-red-800' :
                        report.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {report.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {report.status}
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
        ) : (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Org</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.display_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'root' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'teacher' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.org || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.is_verified ? '✓' : '✗'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
