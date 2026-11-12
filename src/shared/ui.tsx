import { ChevronLeft } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { formatNumber, parseNumber } from './format'

interface ScreenProps {
  title: string
  /** Small label above the title. */
  eyebrow?: string
  back?: string
  action?: ReactNode
  children: ReactNode
}

export function Screen({ title, eyebrow, back, action, children }: ScreenProps) {
  return (
    <>
      <header className="screen-header">
        {back ? (
          <a className="back" href={back} aria-label="Volver">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </a>
        ) : null}
        <div className="title-block">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
        </div>
        {action}
      </header>
      <main className="screen">{children}</main>
    </>
  )
}

export function EmptyState({ title, icon, children }: { title: string; icon?: ReactNode; children?: ReactNode }) {
  return (
    <div className="empty">
      {icon && <div className="empty-icon">{icon}</div>}
      <p className="empty-title">{title}</p>
      {children}
    </div>
  )
}

/** Spanish-style decimals: 62.5 is shown as "62,5". */
const toText = (value: number) => (value === 0 ? '' : String(value).replace('.', ','))

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  label: string
  decimal?: boolean
  className?: string
}

/** Keeps the raw text while typing so values like "62," are not lost before they are complete. */
export function NumberInput({ value, onChange, label, decimal = false, className }: NumberInputProps) {
  const [text, setText] = useState(toText(value))
  useEffect(() => {
    if (parseNumber(text) !== value) setText(toText(value))
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

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Animates a number from 0 to `value`. Shows the final value right away when reduced motion is on. */
export function CountUp({ value, duration = 800 }: { value: number; duration?: number }) {
  const [reduceMotion] = useState(prefersReducedMotion)
  const [animated, setShown] = useState(0)
  const shown = reduceMotion ? value : animated
  useEffect(() => {
    if (reduceMotion) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(t === 1 ? value : value * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration, reduceMotion])
  const rounded = Number.isInteger(value) ? Math.round(shown) : Math.round(shown * 10) / 10
  return <span className="count-up">{formatNumber(rounded)}</span>
}

/** Circular progress indicator, 0 to 1. */
export function ProgressRing({ progress, size = 64, children }: { progress: number; size?: number; children?: ReactNode }) {
  const pct = Math.max(0, Math.min(1, progress)) * 100
  return (
    <div className={`ring${pct === 100 ? ' complete' : ''}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle className="ring-track" cx="18" cy="18" r="15.5" />
        <circle className="ring-fill" cx="18" cy="18" r="15.5" pathLength={100} strokeDasharray="100" strokeDashoffset={100 - pct} />
      </svg>
      <div className="ring-label">{children}</div>
    </div>
  )
}

const CONFETTI_COLORS = ['var(--lime)', 'var(--orange)', '#ffffff', '#38bdf8']

/** Decorative CSS-only confetti burst. Positions are derived from the index to keep rendering pure. */
export function Confetti({ pieces = 36 }: { pieces?: number }) {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: pieces }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${(i % 9) * 70}ms`,
            animationDuration: `${1400 + ((i * 53) % 900)}ms`,
            ['--drift' as string]: `${((i * 29) % 120) - 60}px`,
            ['--spin' as string]: `${((i * 71) % 720) - 360}deg`,
          }}
        />
      ))}
    </div>
  )
}
