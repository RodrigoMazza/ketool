import { supabase } from './supabase'

export async function getAllClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function createClient(name) {
  const { data, error } = await supabase
    .from('clients')
    .insert({ name })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateClient(id, name) {
  const { error } = await supabase
    .from('clients')
    .update({ name })
    .eq('id', id)
  if (error) throw error
}

export async function getClientUsers(clientId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*, clients ( name )')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
