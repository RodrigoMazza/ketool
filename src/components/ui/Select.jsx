export default function Select({
  label,
  error,
  helperText,
  options = [],
  placeholder,
  className = '',
  id,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
          {props.required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <select
        id={inputId}
        className={[
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink',
          'transition-colors cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
          error ? 'border-danger' : 'border-border',
        ].join(' ')}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
      {helperText && !error && <p className="text-xs text-ink-muted">{helperText}</p>}
    </div>
  )
}
