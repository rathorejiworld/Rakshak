import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/ui/dashboard-with-collapsible-sidebar'

export default function TeacherDashboard() {
  const { profile } = useAuth()

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-8">Teacher Dashboard</h1>
          
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
            <p className="text-gray-400 mb-4">Teacher dashboard for {profile?.display_name}</p>
            <p className="text-gray-500 text-sm">More features coming soon...</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
