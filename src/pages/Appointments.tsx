import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase, Appointment } from '@/lib/supabaseClient'
import Navbar from '@/components/Navbar'
import { format } from 'date-fns'

export default function Appointments() {
  const { user, profile } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchAppointments()
    }
  }, [user])

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .or(`user_id.eq.${user?.id},teacher_id.eq.${user?.id}`)
        .order('start_time', { ascending: true })

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Appointments</h1>
          {profile?.role === 'student' && (
            <button className="btn-primary">+ Book New Appointment</button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">No appointments scheduled</p>
            {profile?.role === 'student' && (
              <button className="btn-primary">Book Your First Appointment</button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-lg font-semibold mb-1">
                      {format(new Date(appointment.start_time), 'PPpp')}
                    </div>
                    <div className="text-sm text-gray-600">
                      Duration: {format(new Date(appointment.end_time), 'p')}
                    </div>
                    <div className="mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'canceled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                  {appointment.status === 'booked' && (
                    <button className="btn-secondary text-sm">Cancel</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
