import { useEffect, useState, type ReactNode } from 'react'
import { parseNumber } from './format'

export function Screen({ title, back, action, children }: { title: string; back?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <>
      <header className="screen-header">
        {back ? (
          <a className="back" href={back} aria-label="Back">
            ‹
          </a>
        ) : null}
        <h1>{title}</h1>
        {action}
      </header>
      <main className="screen">{children}</main>
    </>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {children}
    </div>
  )
}

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  label: string
  decimal?: boolean
  className?: string
}

/** Keeps the raw text while typing so values like "62," are not lost before they are complete. */
export function NumberInput({ value, onChange, label, decimal = false, className }: NumberInputProps) {
  const [text, setText] = useState(value === 0 ? '' : String(value))
  useEffect(() => {
    if (parseNumber(text) !== value) setText(value === 0 ? '' : String(value))
    // Only resync when the value changes from outside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return (
    <input
      className={className}
      aria-label={label}
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      placeholder="0"
      value={text}
      onChange={(event) => {
        setText(event.target.value)
        onChange(parseNumber(event.target.value))
      }}
      onFocus={(event) => event.target.select()}
    />
  )
}
