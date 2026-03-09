import { useState } from 'react'
import DashboardLayout from '@/components/ui/dashboard-with-collapsible-sidebar'

export default function NewReport() {
  const [_formData] = useState({})

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold">New Report</h1>
        </div>
      </div>
    </DashboardLayout>
  )
}
