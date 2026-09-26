import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AppHeader, SiteFooter, SkipLink } from '../components/layout/SiteHeader'
import { PageMeta } from '../components/seo/PageMeta'
import { useAuth } from '../context/useAuth'
import { getIntakeHistory, getProfile, readApiError } from '../services/api'
import { formatDateLabel, formatShortDay, localDateISO } from '../utils/dates'
import { formatNumber } from '../utils/format'
import { MEAL_SLOTS } from '../utils/nutrition'
import { dayStanding, percentOf, STANDING_LABEL } from '../utils/week'

const BAR_FILL = {
  empty: '#d5e3db',
  open: '#1a6f8a',
  under: '#b86a14',
  on: '#0e6b4f',
  over: '#9a4e1c',
  logged: '#0e6b4f',
}

const CARD_TONE = {
  empty: 'border-line bg-paper text-muted',
  open: 'border-carb/30 bg-sky text-ink',
  under: 'border-fat/30 bg-sand text-ink',
  on: 'border-accent bg-accent text-accent-foreground',
  over: 'border-clay bg-clay text-white',
  logged: 'border-line bg-white text-ink',
}

export default function WeekPage() {
  const { user } = useAuth()
  const today = localDateISO()
  const [record, setRecord] = useState(null)
  const [targets, setTargets] = useState(null)
  const [error, setError] = useState('')
  const fetchKey = `${user.uid}:${today}`
  const [tracked, setTracked] = useState(fetchKey)
  const [loading, setLoading] = useState(true)

  if (tracked !== fetchKey) {
    setTracked(fetchKey)
    setLoading(true)
  }

  useEffect(() => {
    let ignore = false
    Promise.all([
      getIntakeHistory(user.uid, today, 7),
      getProfile(user.uid),
    ])
      .then(([history, profile]) => {
        if (ignore) return
        setRecord(history)
        setTargets(profile?.targets || null)
        setError('')
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
  }, [fetchKey, today, user.uid])

  const days = (record?.days || []).map((day) => {
    const calories = day.totals?.calories || 0
    const logged = (day.entries || []).length > 0
    const standing = dayStanding({
      calories,
      logged,
      isToday: day.date === today,
      target: targets?.calories || 0,
    })
    return {
      ...day,
      calories,
      logged,
      standing,
      percent: percentOf(calories, targets?.calories),
      label: formatShortDay(day.date),
      fullLabel: formatDateLabel(day.date),
    }
  })
  const loggedDays = days.filter((day) => day.logged)
  const onTarget = days.filter((day) => day.standing === 'on').length
  const averageCalories = loggedDays.length
    ? Math.round(loggedDays.reduce((sum, day) => sum + day.calories, 0) / loggedDays.length)
    : 0
  const chartMax = Math.max(120, ...days.map((day) => day.percent), 0)
  const gaps = macroGaps(loggedDays, targets)
  const widestGap = [...gaps].sort((left, right) => left.percent - right.percent)[0]
  const slotCoverage = MEAL_SLOTS.map((slot) => ({
    ...slot,
    count: days.filter((day) => (day.entries || []).some((entry) => entry.mealSlot === slot.value)).length,
  }))

  return (
    <div className="min-h-svh bg-paper text-ink">
      <PageMeta
        title="Week"
        description="Seven days scored against your calorie and macro targets."
        path="/week"
      />
      <SkipLink />
      <AppHeader />
      <main id="main" className="mx-auto max-w-6xl px-5 py-8">
        <header className="rounded-3xl bg-forest px-6 py-8 text-white sm:px-8">
          <p className="text-sm text-white/70">Seven days against the targets you set</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">This week</h1>
          <p className="mt-3 max-w-xl text-white/75">
            A day is on target when logged calories land between 90% and 110% of your current calorie goal. Today stays open until it reaches that band.
          </p>
        </header>

        {error ? <p role="alert" className="mt-6 text-sm text-danger">{error}</p> : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Week summary">
          <Summary label="Days on target" value={`${onTarget} of 7`} tone="bg-accent text-accent-foreground" />
          <Summary label="Average on logged days" value={loggedDays.length ? formatNumber(averageCalories) : '—'} tone="bg-carb text-white" />
          <Summary label="Days with food" value={`${loggedDays.length} of 7`} tone="bg-clay text-white" />
        </section>

        <section aria-labelledby="adherence-title" className="mt-6 rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 id="adherence-title" className="text-xl font-semibold tracking-tight">Calories against the target</h2>
            <p className="text-sm text-muted">100% is today’s calorie goal.</p>
          </div>
          <ul className="mt-3 flex flex-wrap gap-4 text-sm text-ink">
            <li className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-accent" />On target</li>
            <li className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-carb" />Still open</li>
            <li className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-fat" />Under</li>
            <li className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-clay" />Over</li>
          </ul>
          <div className="mt-4 h-64" aria-hidden="true">
            {loading ? <p className="text-sm text-muted">Loading the week…</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={days} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#e7eee9" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#4c6358', fontSize: 12 }} />
                  <YAxis domain={[0, chartMax]} axisLine={false} tickLine={false} width={42} tick={{ fill: '#4c6358', fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                  <Tooltip content={<WeekTooltip />} />
                  <ReferenceLine y={100} stroke="#0c241c" strokeDasharray="4 4" />
                  <Bar dataKey="percent" radius={[6, 6, 0, 0]}>
                    {days.map((day) => (
                      <Cell key={day.date} fill={BAR_FILL[day.standing]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section aria-labelledby="macro-gap-title" className="mt-4">
          <h2 id="macro-gap-title" className="text-xl font-semibold tracking-tight">Macro averages</h2>
          <p className="mt-1 text-sm text-muted">Averages use only the days that have food logged.</p>
          {loggedDays.length > 0 && widestGap?.target ? (
            <p className="mt-4 rounded-2xl bg-sand px-4 py-3 text-sm text-ink">
              {widestGap.label} is the open gap: {formatNumber(widestGap.average, widestGap.digits)} {widestGap.unit} a day against a {formatNumber(widestGap.target, widestGap.digits)} {widestGap.unit} target.
            </p>
          ) : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {gaps.map((gap) => (
              <article key={gap.key} className="rounded-3xl border border-line bg-white p-5 shadow-sm">
                <p className="text-sm text-muted">{gap.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {loggedDays.length ? formatNumber(gap.average, gap.digits) : '—'}
                  <span className="ml-1 text-sm font-medium text-muted">{gap.unit}</span>
                </p>
                <p className="mt-1 text-sm text-muted">Target {formatNumber(gap.target, gap.digits)} {gap.unit}</p>
                <Meter percent={loggedDays.length ? gap.percent : 0} fill={gap.fill} />
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="meals-title" className="mt-8 rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <h2 id="meals-title" className="text-xl font-semibold tracking-tight">Meals covered</h2>
          <p className="mt-1 text-sm text-muted">How many of the seven days include each meal.</p>
          <ul className="mt-5 flex flex-col gap-4">
            {slotCoverage.map((slot) => (
              <li key={slot.value}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{slot.label}</span>
                  <span className="text-muted">{slot.count} of 7</span>
                </div>
                <svg viewBox="0 0 100 6" className="mt-2 h-1.5 w-full" aria-hidden="true">
                  <rect x="0" y="0" width="100" height="6" rx="3" className="fill-line" />
                  <rect x="0" y="0" width={(slot.count / 7) * 100} height="6" rx="3" className="fill-accent" />
                </svg>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="week-days-title" className="mt-8">
          <h2 id="week-days-title" className="text-xl font-semibold tracking-tight">Open a day</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {days.map((day) => (
              <Link
                key={day.date}
                to={`/history?date=${day.date}`}
                className={`rounded-2xl border px-3 py-3 ${CARD_TONE[day.standing]}`}
              >
                <span className="block text-sm font-semibold">{day.label}</span>
                <span className={`mt-2 block text-xs ${day.standing === 'on' || day.standing === 'over' ? 'text-white/80' : ''}`}>
                  {STANDING_LABEL[day.standing]}
                </span>
                <span className="mt-2 block text-sm font-medium">
                  {day.logged ? `${formatNumber(day.calories)} kcal` : '—'}
                </span>
                <span className={`mt-1 block text-xs ${day.standing === 'on' || day.standing === 'over' ? 'text-white/80' : 'text-muted'}`}>
                  {day.logged ? `${day.percent}% of target` : 'Open in history'}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <table className="sr-only">
          <caption>This week against the calorie target</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Calories</th>
              <th scope="col">Percent of target</th>
              <th scope="col">Standing</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date}>
                <th scope="row">{day.fullLabel}</th>
                <td>{formatNumber(day.calories)} kcal</td>
                <td>{day.percent}%</td>
                <td>{STANDING_LABEL[day.standing]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
      <SiteFooter />
    </div>
  )
}

function macroGaps(loggedDays, targets) {
  const fields = [
    { key: 'proteinGrams', label: 'Protein', unit: 'g', digits: 0, fill: 'fill-accent' },
    { key: 'carbGrams', label: 'Carbs', unit: 'g', digits: 0, fill: 'fill-carb' },
    { key: 'fatGrams', label: 'Fat', unit: 'g', digits: 0, fill: 'fill-fat' },
  ]
  return fields.map((field) => {
    const average = loggedDays.length
      ? loggedDays.reduce((sum, day) => sum + (day.totals?.[field.key] || 0), 0) / loggedDays.length
      : 0
    const target = targets?.[field.key] || 0
    return { ...field, average, target, percent: percentOf(average, target) }
  })
}

function Summary({ label, value, tone }) {
  return (
    <article className={`rounded-3xl px-5 py-4 ${tone}`}>
      <p className="text-sm text-white/80">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </article>
  )
}

function Meter({ percent, fill }) {
  const width = Math.max(0, Math.min(100, percent))
  return (
    <svg viewBox="0 0 100 6" className="mt-4 h-1.5 w-full" aria-hidden="true">
      <rect x="0" y="0" width="100" height="6" rx="3" className="fill-line" />
      <rect x="0" y="0" width={width} height="6" rx="3" className={fill} />
    </svg>
  )
}

function WeekTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm">
      <p className="font-semibold">{row.fullLabel}</p>
      <p className="text-muted">{formatNumber(row.calories)} kcal · {row.percent}%</p>
      <p className="text-muted">{STANDING_LABEL[row.standing]}</p>
    </div>
  )
}
