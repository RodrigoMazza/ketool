import { supabase } from './supabase'

const BUCKET = 'templates'

export async function uploadFile(file, path) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true })
  if (error) throw error
  return data
}

export function getPublicUrl(path) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadPdf(file, templateId) {
  const ext = file.name.split('.').pop()
  const path = `${templateId}/template.${ext}`
  await uploadFile(file, path)
  return getPublicUrl(path) + '?t=' + Date.now()
}

export async function uploadThumbnail(file, templateId) {
  const ext = file.name.split('.').pop()
  const path = `${templateId}/thumbnail.${ext}`
  await uploadFile(file, path)
  return getPublicUrl(path) + '?t=' + Date.now()
}

export async function uploadFont(file, templateId) {
  const ext = file.name.split('.').pop()
  const path = `${templateId}/font.${ext}`
  await uploadFile(file, path)
  return getPublicUrl(path)
}

export async function uploadFontFile(file, fontId) {
  const ext = file.name.split('.').pop()
  const path = `fonts/${fontId}.${ext}`
  await uploadFile(file, path)
  return getPublicUrl(path)
}

export async function deleteTemplateFiles(templateId) {
  const { data: list } = await supabase.storage
    .from(BUCKET)
    .list(templateId)
  if (list?.length) {
    const paths = list.map(f => `${templateId}/${f.name}`)
    await supabase.storage.from(BUCKET).remove(paths)
  }
}
