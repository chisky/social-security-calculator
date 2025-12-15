import { createClient } from '@supabase/supabase-js'

// 只在客户端创建 Supabase 客户端
export const createSupabaseClient = () => {
  if (typeof window !== 'undefined') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return null
    }

    return createClient(supabaseUrl, supabaseAnonKey)
  }

  // 在服务器端返回 null
  return null
}

// 导出一个函数来获取客户端
export const getSupabase = () => {
  return createSupabaseClient()
}