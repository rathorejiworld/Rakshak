import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface Report {
  id: string
  reporter_id: string | null
  is_anonymous: boolean
  title: string
  description: string
  category: string
  status: string
  priority: string
  assigned_to: string | null
  teacher_owner: string | null
  location: any
  metadata: any
  created_at: string
  updated_at: string
}

interface ReportCounts {
  total: number
  solved: number
  pending: number
}

export function useReports(userId?: string, userRole?: string) {
  const [reports, setReports] = useState<Report[]>([])
  const [counts, setCounts] = useState<ReportCounts>({ total: 0, solved: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    console.log('📝 useReports: Fetching reports for user:', userId, 'role:', userRole)
    fetchReports()
  }, [userId, userRole])

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)

      if (userRole === 'student') {
        // Students ONLY see their own reports - filtered server-side via RLS
        console.log('🔍 Fetching reports for student:', userId)
        const { data, error: fetchError } = await supabase
          .from('reports')
          .select('*')
          .eq('reporter_id', userId) // Server-side filter - RLS will enforce this
          .order('created_at', { ascending: false })

        if (fetchError) {
          console.error('❌ Error fetching student reports:', fetchError)
          throw fetchError
        }

        console.log('✅ Fetched student reports:', data?.length || 0)
        setReports(data || [])

        // Calculate counts from the data we just fetched
        const totalCount = data?.length || 0
        const solvedCount = data?.filter(r => r.status === 'resolved' || r.status === 'closed').length || 0
        const pendingCount = totalCount - solvedCount

        setCounts({
          total: totalCount,
          solved: solvedCount,
          pending: pendingCount,
        })
      } else if (userRole === 'teacher') {
        // Teachers see reports for their students - filtered server-side via RLS
        console.log('🔍 Fetching reports for teacher:', userId)
        const { data, error: fetchError } = await supabase
          .from('reports')
          .select('*')
          .or(`teacher_owner.eq.${userId},assigned_to.eq.${userId}`)
          .order('created_at', { ascending: false })

        if (fetchError) {
          console.error('❌ Error fetching teacher reports:', fetchError)
          throw fetchError
        }

        console.log('✅ Fetched teacher reports:', data?.length || 0)
        setReports(data || [])

        const totalCount = data?.length || 0
        const solvedCount = data?.filter(r => r.status === 'resolved' || r.status === 'closed').length || 0
        const pendingCount = totalCount - solvedCount

        setCounts({
          total: totalCount,
          solved: solvedCount,
          pending: pendingCount,
        })
      } else if (userRole === 'root') {
        // Root sees all reports
        console.log('🔍 Fetching all reports for root')
        const { data, error: fetchError } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false })

        if (fetchError) {
          console.error('❌ Error fetching root reports:', fetchError)
          throw fetchError
        }

        console.log('✅ Fetched all reports:', data?.length || 0)
        setReports(data || [])

        const totalCount = data?.length || 0
        const solvedCount = data?.filter(r => r.status === 'resolved' || r.status === 'closed').length || 0
        const pendingCount = totalCount - solvedCount

        setCounts({
          total: totalCount,
          solved: solvedCount,
          pending: pendingCount,
        })
      }
    } catch (err: any) {
      console.error('❌ Error in fetchReports:', err)
      setError(err?.message || 'Failed to fetch reports')
      setReports([])
      setCounts({ total: 0, solved: 0, pending: 0 })
    } finally {
      setLoading(false)
    }
  }

  const createReport = async (reportData: Partial<Report>) => {
    try {
      console.log('📝 Creating report:', reportData)

      const { data, error } = await supabase
        .from('reports')
        .insert([
          {
            reporter_id: reportData.reporter_id,
            is_anonymous: reportData.is_anonymous ?? true,
            title: reportData.title,
            description: reportData.description,
            category: reportData.category,
            status: 'new',
            priority: reportData.priority || 'medium',
            location: reportData.location,
            metadata: reportData.metadata,
          },
        ])
        .select()

      if (error) {
        console.error('❌ Error creating report:', error)
        throw error
      }

      console.log('✅ Report created:', data?.[0]?.id)

      // Refresh reports list
      await fetchReports()

      return data?.[0]
    } catch (err: any) {
      console.error('❌ Error in createReport:', err)
      setError(err?.message || 'Failed to create report')
      throw err
    }
  }

  const updateReport = async (id: string, updates: Partial<Report>) => {
    try {
      console.log('📝 Updating report:', id, updates)

      const { data, error } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) {
        console.error('❌ Error updating report:', error)
        throw error
      }

      console.log('✅ Report updated:', id)

      // Update local state optimistically
      setReports(prev => prev.map(r => (r.id === id ? data[0] : r)))

      return data?.[0]
    } catch (err: any) {
      console.error('❌ Error in updateReport:', err)
      setError(err?.message || 'Failed to update report')
      throw err
    }
  }

  const deleteReport = async (id: string) => {
    try {
      console.log('📝 Deleting report:', id)

      const { error } = await supabase.from('reports').delete().eq('id', id)

      if (error) {
        console.error('❌ Error deleting report:', error)
        throw error
      }

      console.log('✅ Report deleted:', id)

      // Update local state
      setReports(prev => prev.filter(r => r.id !== id))
    } catch (err: any) {
      console.error('❌ Error in deleteReport:', err)
      setError(err?.message || 'Failed to delete report')
      throw err
    }
  }

  return {
    reports,
    counts,
    loading,
    error,
    createReport,
    updateReport,
    deleteReport,
    refetch: fetchReports,
  }
}
