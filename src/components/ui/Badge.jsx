const variants = {
  active: 'bg-green-50 text-green-700 border border-green-200',
  inactive: 'bg-gray-100 text-gray-500 border border-gray-200',
  new: 'bg-accent/10 text-accent border border-accent/20',
  pdf: 'bg-orange-50 text-orange-700 border border-orange-200',
  png: 'bg-purple-50 text-purple-700 border border-purple-200',
  default: 'bg-surface text-ink-muted border border-border',
}

export default function Badge({ variant = 'default', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
