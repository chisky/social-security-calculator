'use client'

import { useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

export const useSupabase = () => {
  return useMemo(() => {
    if (typeof window !== 'undefined') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables')
        return null
      }

      return createClient(supabaseUrl, supabaseAnonKey)
    }

    return null
  }, [])
}