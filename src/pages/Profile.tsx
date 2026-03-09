import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import Navbar from '@/components/Navbar'

export default function Profile() {
  const { user, profile } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [org, setOrg] = useState('')
  const [classValue, setClassValue] = useState('')
  const [emergencyContacts, setEmergencyContacts] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setPhone(profile.phone || '')
      setOrg(profile.org || '')
      setClassValue(profile.class || '')
      setEmergencyContacts(profile.emergency_contacts ? JSON.stringify(profile.emergency_contacts, null, 2) : '')
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      let parsedContacts = null
      if (emergencyContacts.trim()) {
        parsedContacts = JSON.parse(emergencyContacts)
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          phone,
          org,
          class: classValue,
          emergency_contacts: parsedContacts,
        })
        .eq('id', user?.id)

      if (error) throw error
      setMessage('Profile updated successfully!')
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
          
          {message && (
            <div className={`p-3 rounded-lg mb-4 ${
              message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (read-only)
              </label>
              <input
                type="email"
                value={user?.email || ''}
                className="input bg-gray-100"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role (read-only)
              </label>
              <input
                type="text"
                value={profile?.role || ''}
                className="input bg-gray-100"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
                placeholder="+1234567890"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <input
                type="text"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                className="input"
              />
            </div>
            
            {profile?.role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class
                </label>
                <input
                  type="text"
                  value={classValue}
                  onChange={(e) => setClassValue(e.target.value)}
                  className="input"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contacts (JSON)
              </label>
              <textarea
                value={emergencyContacts}
                onChange={(e) => setEmergencyContacts(e.target.value)}
                className="input"
                rows={4}
                placeholder='{"name": "Contact Name", "phone": "+1234567890", "email": "contact@example.com"}'
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter valid JSON format for emergency contacts
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
