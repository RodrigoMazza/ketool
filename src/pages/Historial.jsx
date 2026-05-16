import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getDownloadsForUser } from '@/services/downloads'
import { getTemplateById, getTemplateFields } from '@/services/templates'
import { generateFilledPdf } from '@/lib/pdfProcessor'
import { triggerDownload } from '@/lib/downloadHelper'
import DownloadsTable from '@/components/admin/DownloadsTable'
import Spinner from '@/components/ui/Spinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import PageHeader from '@/components/layout/PageHeader'

export default function Historial() {
  const { profile } = useAuth()
  const [downloads, setDownloads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [redownloading, setRedownloading] = useState(null)

  useEffect(() => {
    if (!profile?.id) return
    getDownloadsForUser(profile.id)
      .then(setDownloads)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [profile])

  async function handleReDownload(download) {
    setRedownloading(download.id)
    try {
      const [template, fields] = await Promise.all([
        getTemplateById(download.template_id),
        getTemplateFields(download.template_id),
      ])

      const pdfBytes = await generateFilledPdf(
        template.pdf_url,
        fields,
        download.field_data,
        template.font_url || null
      )

      if (download.format === 'png') {
        throw new Error('La re-descarga en PNG no está disponible. Regenerá el archivo desde la plantilla.')
      } else {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        triggerDownload(blob, `${template.name}.pdf`)
      }
    } catch (err) {
      alert(`Error al volver a descargar: ${err.message}`)
    } finally {
      setRedownloading(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Historial de descargas"
        subtitle="Tus últimas descargas. Podés volver a generar cualquier archivo."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="w-6 h-6 text-accent" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <DownloadsTable
          downloads={downloads}
          onReDownload={handleReDownload}
        />
      )}
    </div>
  )
}
