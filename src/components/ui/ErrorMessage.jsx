export default function ErrorMessage({ message, className = '' }) {
  if (!message) return null
  return (
    <div className={`rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 ${className}`}>
      {message}
    </div>
  )
}
