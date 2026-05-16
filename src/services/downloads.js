import { supabase } from './supabase'

export async function logDownload(userId, templateId, format, fieldData) {
  const { data, error } = await supabase
    .from('downloads')
    .insert({ user_id: userId, template_id: templateId, format, field_data: fieldData })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getDownloadsForUser(userId) {
  const { data, error } = await supabase
    .from('downloads')
    .select('*, templates ( id, name, thumbnail_url )')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getRecentDownloads(limit = 10) {
  const { data, error } = await supabase
    .from('downloads')
    .select('*, templates ( name ), users ( email, clients ( name ) )')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function getDownloadStats() {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('downloads')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString())

  if (error) throw error
  return count
}
