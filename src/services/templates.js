import { supabase } from './supabase'

export async function getTemplatesForClient(clientId) {
  const { data, error } = await supabase
    .from('templates')
    .select(`
      *,
      categories ( id, name )
    `)
    .eq('is_active', true)
    .in('id', supabase
      .from('template_clients')
      .select('template_id')
      .eq('client_id', clientId)
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getTemplatesForClientDirect(clientId) {
  const { data: tcRows, error: tcErr } = await supabase
    .from('template_clients')
    .select('template_id')
    .eq('client_id', clientId)
  if (tcErr) throw tcErr

  const ids = tcRows.map(r => r.template_id)
  if (!ids.length) return []

  const { data, error } = await supabase
    .from('templates')
    .select('*, categories ( id, name )')
    .eq('is_active', true)
    .in('id', ids)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getAllTemplates() {
  const { data, error } = await supabase
    .from('templates')
    .select(`
      *,
      categories ( id, name ),
      template_clients ( client_id )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getTemplateById(id) {
  const { data, error } = await supabase
    .from('templates')
    .select('*, categories ( id, name ), fonts ( id, name, file_url )')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getTemplateFields(templateId) {
  const { data, error } = await supabase
    .from('template_fields')
    .select('*')
    .eq('template_id', templateId)
    .order('sort_order')

  if (error) throw error
  return data
}

export async function getTemplateClients(templateId) {
  const { data, error } = await supabase
    .from('template_clients')
    .select('client_id, clients ( id, name )')
    .eq('template_id', templateId)

  if (error) throw error
  return data
}

export async function createTemplate(templateData, fields, clientIds) {
  const { data: template, error: tErr } = await supabase
    .from('templates')
    .insert(templateData)
    .select()
    .single()

  if (tErr) throw tErr

  if (fields.length > 0) {
    const { error: fErr } = await supabase
      .from('template_fields')
      .insert(fields.map(f => ({ ...f, template_id: template.id })))
    if (fErr) throw fErr
  }

  if (clientIds.length > 0) {
    const { error: cErr } = await supabase
      .from('template_clients')
      .insert(clientIds.map(cid => ({ template_id: template.id, client_id: cid })))
    if (cErr) throw cErr
  }

  return template
}

export async function updateTemplate(id, templateData, fields, clientIds) {
  const { error: tErr } = await supabase
    .from('templates')
    .update(templateData)
    .eq('id', id)
  if (tErr) throw tErr

  // Replace fields
  await supabase.from('template_fields').delete().eq('template_id', id)
  if (fields.length > 0) {
    const { error: fErr } = await supabase
      .from('template_fields')
      .insert(fields.map(f => ({ ...f, template_id: id })))
    if (fErr) throw fErr
  }

  // Replace client assignments
  await supabase.from('template_clients').delete().eq('template_id', id)
  if (clientIds.length > 0) {
    const { error: cErr } = await supabase
      .from('template_clients')
      .insert(clientIds.map(cid => ({ template_id: id, client_id: cid })))
    if (cErr) throw cErr
  }
}

export async function deleteTemplate(id) {
  const { error: dlErr } = await supabase.from('downloads').delete().eq('template_id', id)
  if (dlErr) throw dlErr
  const { error } = await supabase.from('templates').delete().eq('id', id)
  if (error) throw error
}

export async function toggleTemplateActive(id, isActive) {
  const { error } = await supabase
    .from('templates')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) throw error
}

export async function getAllCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function createCategory(name) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name })
    .select()
    .single()
  if (error) throw error
  return data
}
