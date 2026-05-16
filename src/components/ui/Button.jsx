import Spinner from './Spinner'

const variants = {
  primary: 'bg-accent text-white hover:bg-accent-hover focus-visible:ring-accent',
  secondary: 'border border-border bg-white text-ink hover:bg-surface focus-visible:ring-accent',
  danger: 'bg-danger text-white hover:bg-danger-hover focus-visible:ring-danger',
  ghost: 'text-ink-muted hover:text-ink hover:bg-surface focus-visible:ring-accent',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading && <Spinner className="w-4 h-4" />}
      {children}
    </button>
  )
}
