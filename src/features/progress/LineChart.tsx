import { formatNumber, formatShortDate } from '../../shared/format'

export interface ChartPoint {
  date: string
  value: number
}

const W = 320
const H = 180
const PAD = { top: 16, right: 16, bottom: 28, left: 44 }

/** Small dependency-free SVG line chart, spaced by session order. */
export function LineChart({ points, unit }: { points: ChartPoint[]; unit: string }) {
  if (points.length === 0) return null
  const values = points.map((p) => p.value)
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) {
    min = Math.max(0, min - 1)
    max = max + 1
  }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
  const y = (v: number) => PAD.top + innerH - ((v - min) / (max - min)) * innerH
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Progress chart in ${unit}`}>
      {[max, (max + min) / 2, min].map((v) => (
        <g key={v}>
          <line className="chart-grid" x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} />
          <text className="chart-label" x={PAD.left - 6} y={y(v) + 4} textAnchor="end">
            {formatNumber(v)}
          </text>
        </g>
      ))}
      <path className="chart-line" d={path} />
      {points.map((p, i) => (
        <circle key={i} className="chart-dot" cx={x(i)} cy={y(p.value)} r={3.5}>
          <title>{`${formatShortDate(p.date)}: ${formatNumber(p.value)} ${unit}`}</title>
        </circle>
      ))}
      <text className="chart-label" x={PAD.left} y={H - 8} textAnchor="start">
        {formatShortDate(points[0].date)}
      </text>
      {points.length > 1 && (
        <text className="chart-label" x={W - PAD.right} y={H - 8} textAnchor="end">
          {formatShortDate(points[points.length - 1].date)}
        </text>
      )}
    </svg>
  )
}
