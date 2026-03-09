import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Navigate } from 'react-router-dom'
import DashboardLayout from '@/components/ui/dashboard-with-collapsible-sidebar'
import { Shield } from 'lucide-react'

export default function AdminTools() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'data'>('users')
  const [message, setMessage] = useState('')

  if (profile?.role !== 'root') {
    return <Navigate to="/" />
  }

  const runDataRetention = async () => {
    setMessage('Data retention job started...')
    // Implement data retention logic
    setTimeout(() => setMessage('Data retention completed'), 2000)
  }

  const exportData = async () => {
    setMessage('Exporting data...')
    // Implement export logic
    setTimeout(() => setMessage('Export completed'), 2000)
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold">Admin Tools</h1>
          </div>

          {message && (
            <div className="bg-blue-50 text-blue-600 p-3 rounded-lg mb-4">
              {message}
            </div>
          )}

          <div className="card mb-6">
            <div className="flex gap-4 border-b">
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
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'audit'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600'
                }`}
              >
                Audit Logs
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'data'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600'
                }`}
              >
                Data Management
              </button>
            </div>
          </div>

          {activeTab === 'users' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">User Management</h2>
              <div className="space-y-4">
                <button className="btn-primary">+ Create Root User</button>
                <button className="btn-secondary">+ Create Teacher</button>
                <button className="btn-secondary">+ Create Student</button>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Audit Logs</h2>
              <p className="text-gray-600">Recent activity logs will appear here</p>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Data Management</h2>
              <div className="space-y-4">
                <div>
                  <button onClick={exportData} className="btn-primary">
                    Export All Data (CSV)
                  </button>
                </div>
                <div>
                  <button onClick={runDataRetention} className="btn-secondary">
                    Run Data Retention Job
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
