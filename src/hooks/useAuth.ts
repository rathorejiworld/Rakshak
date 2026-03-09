import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        console.error('❌ Session error:', sessionError)
        setError(sessionError.message)
      }
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email)
      } else {
        setProfile(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      console.log('🔍 Fetching profile for user:', userId, 'email:', userEmail)
      
      // Try students
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!studentError && studentData) {
        console.log('✅ Found student profile:', studentData)
        setProfile({ ...studentData, role: 'student' })
        setError(null)
        return
      }

      // Try teachers
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!teacherError && teacherData) {
        console.log('✅ Found teacher profile:', teacherData)
        setProfile({ ...teacherData, role: 'teacher' })
        setError(null)
        return
      }

      // Try roots
      const { data: rootData, error: rootError } = await supabase
        .from('roots')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!rootError && rootData) {
        console.log('✅ Found root profile:', rootData)
        setProfile({ ...rootData, role: 'root' })
        setError(null)
        return
      }

      console.warn('⚠️ No profile found - profile might be creating...')
    } catch (err) {
      console.error('❌ Error fetching profile:', err)
      setError(String(err))
    }
  }

  const signUp = async (email: string, password: string, displayName: string, role: 'student' | 'teacher' = 'student') => {
    try {
      console.log('📝 Starting signup:', { email, displayName, role })
      setError(null)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            role: role,
          },
        },
      })

      if (error) {
        console.error('❌ Signup error:', error)
        setError(error.message)
        throw error
      }

      console.log('✅ User created in auth:', data.user?.id)
      setUser(data.user)
      
      if (data.user) {
        // Wait longer for trigger to execute
        console.log('⏳ Waiting 3 seconds for profile to be created...')
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        console.log('🔍 Now fetching profile...')
        await fetchProfile(data.user.id, data.user.email)
      }
      
      return data
    } catch (err: any) {
      console.error('❌ Signup failed:', err)
      const errorMsg = err?.message || 'Signup failed'
      setError(errorMsg)
      throw new Error(errorMsg)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Signing in:', email)
      setError(null)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Sign in error:', error)
        setError(error.message)
        throw error
      }

      console.log('✅ Signed in:', data.user?.id)
      setUser(data.user)
      if (data.user) {
        await fetchProfile(data.user.id, data.user.email)
      }
      return data
    } catch (err: any) {
      console.error('❌ Sign in error:', err)
      const errorMsg = err?.message || 'Sign in failed'
      setError(errorMsg)
      throw new Error(errorMsg)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setProfile(null)
      setError(null)
      navigate('/')
    } catch (err: any) {
      console.error('❌ Sign out error:', err)
      setError(err?.message)
      throw err
    }
  }

  return {
    user,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
  }
}
