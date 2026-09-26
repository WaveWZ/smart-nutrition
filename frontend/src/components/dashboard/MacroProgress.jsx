import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { formatNumber } from '../../utils/format'
import { MACRO_FIELDS, percentOfTarget } from '../../utils/nutrition'

const CARD_TONE = {
  calories: 'bg-forest text-white',
  proteinGrams: 'bg-accent text-accent-foreground',
  carbGrams: 'bg-carb text-white',
  fatGrams: 'bg-clay text-white',
}

const METER = {
  calories: { track: 'fill-white/25', bar: 'fill-white' },
  proteinGrams: { track: 'fill-white/25', bar: 'fill-white' },
  carbGrams: { track: 'fill-white/25', bar: 'fill-white' },
  fatGrams: { track: 'fill-white/25', bar: 'fill-white' },
}

function MacroRing({ field, consumed, target }) {
  const safeTarget = Math.max(target || 0, 0)
  const safeConsumed = Math.max(consumed || 0, 0)
  const remaining = Math.max(0, safeTarget - safeConsumed)
  const percent = percentOfTarget(safeConsumed, safeTarget)
  const slices = safeConsumed === 0 && remaining === 0
    ? [{ name: 'Remaining', value: 1 }]
    : [
        { name: 'Consumed', value: Math.max(safeConsumed, 0) },
        { name: 'Remaining', value: Math.max(remaining, 0.0001) },
      ]
  const meter = METER[field.key]

  return (
    <article className={`rounded-3xl p-5 shadow-sm ${CARD_TONE[field.key]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{field.label}</h3>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{formatNumber(remaining, field.digits)}</p>
          <p className="mt-1 text-sm text-white/80">
            {field.unit} left · {formatNumber(safeConsumed, field.digits)} of {formatNumber(safeTarget, field.digits)}
          </p>
        </div>
        <div className="relative size-16 shrink-0" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius="68%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                stroke="none"
                isAnimationActive={false}
              >
                <Cell fill="#f4fbf7" />
                <Cell fill="rgba(255,255,255,0.28)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <p className="pointer-events-none absolute inset-0 grid place-items-center text-[11px] font-semibold">{percent}%</p>
        </div>
      </div>
      <svg viewBox="0 0 100 8" className="mt-4 h-2 w-full" aria-hidden="true">
        <rect width="100" height="8" rx="4" className={meter.track} />
        <rect width={Math.min(percent, 100)} height="8" rx="4" className={meter.bar} />
      </svg>
    </article>
  )
}

export function MacroProgress({ targets, consumed }) {
  const rows = MACRO_FIELDS.map((field) => ({
    ...field,
    target: targets?.[field.key] || 0,
    consumed: consumed?.[field.key] || 0,
  }))

  return (
    <section aria-labelledby="macro-progress-title">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="macro-progress-title" className="text-2xl font-semibold tracking-tight text-ink">Still open today</h2>
        <p className="text-sm text-muted">Each color is one macro. The number is what you can still eat.</p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((row) => (
          <MacroRing key={row.key} field={row} consumed={row.consumed} target={row.target} />
        ))}
      </div>
      <table className="sr-only">
        <caption>Consumed and target macros for today</caption>
        <thead>
          <tr>
            <th scope="col">Macro</th>
            <th scope="col">Consumed</th>
            <th scope="col">Target</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.label}</th>
              <td>{formatNumber(row.consumed, row.digits)} {row.unit}</td>
              <td>{formatNumber(row.target, row.digits)} {row.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
