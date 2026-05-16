import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getTemplatesForClientDirect } from '@/services/templates'
import { getAllCategories } from '@/services/templates'
import TemplateGrid from '@/components/templates/TemplateGrid'
import CategoryFilter from '@/components/templates/CategoryFilter'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import PageHeader from '@/components/layout/PageHeader'

export default function Dashboard() {
  const { profile } = useAuth()
  const [templates, setTemplates] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)

  useEffect(() => {
    if (!profile?.client_id) return
    Promise.all([
      getTemplatesForClientDirect(profile.client_id),
      getAllCategories(),
    ])
      .then(([tmpl, cats]) => {
        setTemplates(tmpl)
        setCategories(cats)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [profile])

  const filtered = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !activeCategory || t.category_id === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div>
      <PageHeader title="Mis plantillas" subtitle="Completá y descargá tus comunicaciones" />

      <div className="space-y-4 mb-6">
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            active={activeCategory}
            onChange={setActiveCategory}
          />
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="w-6 h-6 text-accent" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <TemplateGrid templates={filtered} />
      )}
    </div>
  )
}
