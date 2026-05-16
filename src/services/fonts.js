import { supabase } from './supabase'
import { uploadFontFile } from './storage'

export async function getAllFonts() {
  const { data, error } = await supabase.from('fonts').select('*').order('name')
  if (error) throw error
  return data
}

export async function createFont(name, file) {
  const fontId = crypto.randomUUID()
  const fileUrl = await uploadFontFile(file, fontId)
  const { data, error } = await supabase
    .from('fonts')
    .insert({ id: fontId, name, file_url: fileUrl })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteFont(id) {
  const { error } = await supabase.from('fonts').delete().eq('id', id)
  if (error) throw error
}

export async function getFontsByIds(ids) {
  if (!ids.length) return {}
  const { data, error } = await supabase.from('fonts').select('id, file_url').in('id', ids)
  if (error) throw error
  return Object.fromEntries(data.map(f => [f.id, f.file_url]))
}
