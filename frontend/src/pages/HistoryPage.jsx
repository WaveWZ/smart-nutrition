import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AppHeader, SiteFooter, SkipLink } from '../components/layout/SiteHeader'
import { PageMeta } from '../components/seo/PageMeta'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/useAuth'
import { getIntakeHistory, getProfile, readApiError, removeIntake } from '../services/api'
import { formatClockTime, formatDateLabel, formatShortDay, localDateISO } from '../utils/dates'
import { formatNumber } from '../utils/format'
import { MEAL_SLOTS } from '../utils/nutrition'

const RANGES = [7, 14, 30]

const SLOT_TONE = {
  breakfast: 'bg-sand text-clay',
  lunch: 'bg-sky text-carb',
  dinner: 'bg-accent/10 text-accent',
  snack: 'bg-clay/10 text-clay',
}

export default function HistoryPage() {
  const { user } = useAuth()
  const today = localDateISO()
  const [searchParams] = useSearchParams()
  const requestedDate = searchParams.get('date')
  const [range, setRange] = useState(14)
  const [reload, setReload] = useState(0)
  const [history, setHistory] = useState(null)
  const [targetCalories, setTargetCalories] = useState(0)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(
    requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : today,
  )
  const [removingId, setRemovingId] = useState('')
  const fetchKey = `${user.uid}:${today}:${range}:${reload}`
  const [tracked, setTracked] = useState(fetchKey)
  const [loading, setLoading] = useState(true)

  if (tracked !== fetchKey) {
    setTracked(fetchKey)
    setLoading(true)
  }

  useEffect(() => {
    let ignore = false
    Promise.all([
      getIntakeHistory(user.uid, today, range),
      getProfile(user.uid),
    ])
      .then(([record, profile]) => {
        if (ignore) return
        setHistory(record)
        setTargetCalories(profile?.targets?.calories || 0)
        setError('')
        const dates = record.days.map((day) => day.date)
        setSelected((current) => (dates.includes(current) ? current : dates[dates.length - 1]))
      })
      .catch((requestError) => {
        if (ignore) return
        setError(readApiError(requestError))
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [fetchKey, range, today, user.uid])

  const days = history?.days || []
  const chartRows = days.map((day) => ({
    date: day.date,
    label: formatShortDay(day.date),
    fullLabel: formatDateLabel(day.date),
    calories: day.totals?.calories || 0,
    protein: day.totals?.proteinGrams || 0,
    carbs: day.totals?.carbGrams || 0,
    fat: day.totals?.fatGrams || 0,
  }))
  const active = days.find((day) => day.date === selected) || days[days.length - 1]
  const peak = days.reduce((max, day) => Math.max(max, day.totals?.calories || 0), 0)
  const loggedDays = days.filter((day) => (day.entries || []).length > 0).length
  const average = days.length
    ? Math.round(days.reduce((sum, day) => sum + (day.totals?.calories || 0), 0) / days.length)
    : 0

  async function removeEntry(entry) {
    if (!active) return
    setRemovingId(entry.id)
    setError('')
    try {
      await removeIntake(user.uid, entry.id, active.date)
      setReload((value) => value + 1)
    } catch (requestError) {
      setError(readApiError(requestError))
    } finally {
      setRemovingId('')
    }
  }

  return (
    <div className="min-h-svh bg-paper text-ink">
      <PageMeta
        title="History"
        description="Day by day calories and macros from the foods you have logged."
        path="/history"
      />
      <SkipLink />
      <AppHeader />
      <main id="main" className="mx-auto max-w-6xl px-5 py-8">
        <header className="flex flex-col gap-6 rounded-3xl bg-forest px-6 py-8 text-white sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-white/70">Saved meals, one day at a time</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Your history</h1>
            <p className="mt-3 max-w-xl text-white/75">
              Foods you log leave the daily plan and collect here. Pick a day to see the plate, and follow calories against your current target.
            </p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="How many days to show">
            {RANGES.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={range === value}
                onClick={() => setRange(value)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${range === value ? 'bg-white text-forest' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {value} days
              </button>
            ))}
          </div>
        </header>

        {error ? <p role="alert" className="mt-6 text-sm text-danger">{error}</p> : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Period summary">
          <Summary label="Days with food" value={String(loggedDays)} tone="bg-accent text-accent-foreground" />
          <Summary label="Average calories" value={formatNumber(average)} tone="bg-carb text-white" />
          <Summary label="Current target" value={targetCalories ? formatNumber(targetCalories) : '—'} tone="bg-clay text-white" />
        </section>

        <section aria-labelledby="calorie-chart-title" className="mt-6 rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 id="calorie-chart-title" className="text-xl font-semibold tracking-tight">Calories by day</h2>
            <p className="text-sm text-muted">Click a point to open that day.</p>
          </div>
          <div className="mt-4 h-64" aria-hidden="true">
            {loading ? <p className="text-sm text-muted">Loading the chart…</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartRows} margin={{ top: 12, right: 8, left: 0, bottom: 0 }} onClick={(state) => state?.activePayload?.[0]?.payload?.date && setSelected(state.activePayload[0].payload.date)}>
                  <defs>
                    <linearGradient id="calorie-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0e6b4f" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#0e6b4f" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e7eee9" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#4c6358', fontSize: 12 }} />
                  <YAxis domain={[0, 'auto']} axisLine={false} tickLine={false} width={42} tick={{ fill: '#4c6358', fontSize: 12 }} />
                  <Tooltip content={<DayTooltip />} />
                  <Area type="monotone" dataKey="calories" stroke="#0e6b4f" strokeWidth={2.5} fill="url(#calorie-fill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section aria-labelledby="macro-chart-title" className="mt-4 rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <h2 id="macro-chart-title" className="text-xl font-semibold tracking-tight">Protein, carbs, and fat</h2>
          <ul className="mt-3 flex flex-wrap gap-4 text-sm text-ink">
            <li className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-accent" />Protein</li>
            <li className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-carb" />Carbs</li>
            <li className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-clay" />Fat</li>
          </ul>
          <div className="mt-4 h-56" aria-hidden="true">
            {!loading ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#e7eee9" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#4c6358', fontSize: 12 }} />
                  <YAxis domain={[0, 'auto']} axisLine={false} tickLine={false} width={36} tick={{ fill: '#4c6358', fontSize: 12 }} />
                  <Tooltip content={<MacroTooltip />} />
                  <Bar dataKey="protein" fill="#0e6b4f" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="carbs" fill="#1a6f8a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fat" fill="#9a4e1c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </section>

        <table className="sr-only">
          <caption>Daily intake for the selected range</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Calories</th>
              <th scope="col">Protein</th>
              <th scope="col">Carbs</th>
              <th scope="col">Fat</th>
            </tr>
          </thead>
          <tbody>
            {chartRows.map((row) => (
              <tr key={row.date}>
                <th scope="row">{row.fullLabel}</th>
                <td>{formatNumber(row.calories)} kcal</td>
                <td>{formatNumber(row.protein, 1)} g</td>
                <td>{formatNumber(row.carbs, 1)} g</td>
                <td>{formatNumber(row.fat, 1)} g</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section aria-labelledby="day-picker-title" className="mt-8">
          <h2 id="day-picker-title" className="text-xl font-semibold tracking-tight">Open a day</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {days.map((day) => {
              const count = day.entries?.length || 0
              const calories = day.totals?.calories || 0
              const isSelected = day.date === active?.date
              const width = peak ? Math.max(calories ? 8 : 0, Math.round((calories / peak) * 100)) : 0
              return (
                <button
                  key={day.date}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelected(day.date)}
                  className={`rounded-2xl border px-3 py-3 text-left ${isSelected ? 'border-accent bg-accent text-accent-foreground' : count ? 'border-line bg-white text-ink hover:border-accent' : 'border-line bg-paper text-muted'}`}
                >
                  <span className="block text-sm font-semibold">{formatShortDay(day.date)}</span>
                  <span className={`mt-1 block text-xs ${isSelected ? 'text-white/80' : ''}`}>
                    {count ? `${formatNumber(calories)} kcal` : 'Empty'}
                  </span>
                  <svg viewBox="0 0 100 4" className="mt-2 h-1 w-full" aria-hidden="true">
                    <rect x="0" y="0" width="100" height="4" rx="2" className={isSelected ? 'fill-white/25' : 'fill-line'} />
                    <rect x="0" y="0" width={width} height="4" rx="2" className={isSelected ? 'fill-white' : 'fill-accent'} />
                  </svg>
                </button>
              )
            })}
          </div>
        </section>

        {active ? <DayDetail day={active} removingId={removingId} onRemove={removeEntry} /> : null}
      </main>
      <SiteFooter />
    </div>
  )
}

function Summary({ label, value, tone }) {
  return (
    <article className={`rounded-3xl px-5 py-4 ${tone}`}>
      <p className="text-sm text-white/80">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </article>
  )
}

function DayTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm">
      <p className="font-semibold">{row.fullLabel}</p>
      <p className="text-muted">{formatNumber(row.calories)} kcal</p>
    </div>
  )
}

function MacroTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm">
      <p className="font-semibold">{row.fullLabel}</p>
      <p className="text-accent">Protein {formatNumber(row.protein, 1)} g</p>
      <p className="text-carb">Carbs {formatNumber(row.carbs, 1)} g</p>
      <p className="text-clay">Fat {formatNumber(row.fat, 1)} g</p>
    </div>
  )
}

function DayDetail({ day, removingId, onRemove }) {
  const entries = day.entries || []
  return (
    <section aria-labelledby="selected-day-title" className="mt-6 rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6">
      <h2 id="selected-day-title" className="text-2xl font-semibold tracking-tight">{formatDateLabel(day.date)}</h2>
      <p className="mt-1 text-sm text-muted">
        {formatNumber(day.totals?.calories || 0)} kcal · P {formatNumber(day.totals?.proteinGrams || 0, 1)} · C {formatNumber(day.totals?.carbGrams || 0, 1)} · F {formatNumber(day.totals?.fatGrams || 0, 1)}
      </p>
      {entries.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-sand px-4 py-5 text-sm text-clay">Nothing was logged on this day.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {MEAL_SLOTS.map((slot) => {
            const items = entries.filter((entry) => entry.mealSlot === slot.value)
            if (items.length === 0) return null
            return (
              <div key={slot.value}>
                <h3 className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide uppercase ${SLOT_TONE[slot.value]}`}>
                  {slot.label}
                </h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {items.map((entry) => (
                    <li key={entry.id} className="flex flex-col gap-3 rounded-2xl bg-paper px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{entry.name}</p>
                        <p className="mt-1 text-sm text-muted">
                          {formatClockTime(entry.loggedAt) ? `${formatClockTime(entry.loggedAt)} · ` : ''}
                          {entry.servings} × {entry.servingLabel} · {formatNumber(entry.calories)} kcal
                        </p>
                      </div>
                      <Button
                        variant="quiet"
                        disabled={removingId === entry.id}
                        aria-label={`Remove ${entry.name}`}
                        onClick={() => onRemove(entry)}
                      >
                        {removingId === entry.id ? 'Removing…' : 'Remove'}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
