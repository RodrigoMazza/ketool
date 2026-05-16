import { useEffect, useState } from 'react'
import { getAllFonts, createFont, deleteFont } from '@/services/fonts'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Spinner from '@/components/ui/Spinner'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/ui/EmptyState'

export default function AdminFonts() {
  const [fonts, setFonts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newFile, setNewFile] = useState(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    getAllFonts()
      .then(data => setFonts(data ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function openCreate() {
    setNewName('')
    setNewFile(null)
    setCreateError('')
    setShowCreate(true)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim() || !newFile) return
    setCreating(true)
    setCreateError('')
    try {
      const font = await createFont(newName.trim(), newFile)
      setFonts(prev => [...prev, font].sort((a, b) => a.name.localeCompare(b.name)))
      setShowCreate(false)
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`¿Eliminar la fuente "${name}"? Solo eliminá fuentes que no estén en uso por ninguna plantilla.`)) return
    try {
      await deleteFont(id)
      setFonts(prev => prev.filter(f => f.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Fuentes"
        action={<Button size="sm" onClick={openCreate}>+ Nueva fuente</Button>}
      />

      <ErrorMessage message={error} className="mb-4" />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="w-6 h-6 text-accent" />
        </div>
      ) : fonts.length === 0 ? (
        <EmptyState
          icon="🔤"
          title="No hay fuentes"
          description="Subí fuentes TTF/OTF para usar en tus plantillas."
          action={<Button size="sm" onClick={openCreate}>Subir fuente</Button>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-5 py-2.5 text-left text-xs font-medium text-ink-muted">Nombre</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-ink-muted">Formato</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-ink-muted">Agregada</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fonts.map(font => (
                <tr key={font.id} className="hover:bg-surface/50">
                  <td className="px-5 py-3 font-medium text-ink">{font.name}</td>
                  <td className="px-5 py-3 text-ink-muted uppercase text-xs">
                    {font.file_url.split('.').pop().split('?')[0]}
                  </td>
                  <td className="px-5 py-3 text-ink-muted">
                    {new Date(font.created_at).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(font.id, font.name)}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nueva fuente">
        <form onSubmit={handleCreate} className="space-y-4">
          <ErrorMessage message={createError} />
          <Input
            label="Nombre"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
            placeholder="Inter Bold"
            autoFocus
          />
          <div>
            <label className="text-sm font-medium text-ink block mb-1">
              Archivo <span className="text-danger">*</span>
            </label>
            <label className="block cursor-pointer">
              <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${newFile ? 'border-success bg-green-50' : 'border-border hover:border-accent/50'}`}>
                <input
                  type="file"
                  accept=".ttf,.otf"
                  className="sr-only"
                  onChange={e => setNewFile(e.target.files[0] || null)}
                />
                {newFile
                  ? <p className="text-sm text-ink">✅ {newFile.name}</p>
                  : <p className="text-sm text-ink-muted">Subir .ttf o .otf</p>
                }
              </div>
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={creating} disabled={!newName.trim() || !newFile}>
              Subir fuente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
