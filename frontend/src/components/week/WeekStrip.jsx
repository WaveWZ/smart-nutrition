import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getIntakeHistory, readApiError } from '../../services/api'
import { formatShortDay, localDateISO } from '../../utils/dates'
import { dayStanding, STANDING_LABEL } from '../../utils/week'

const DOT = {
  empty: 'bg-line',
  open: 'bg-carb',
  under: 'bg-fat',
  on: 'bg-accent',
  over: 'bg-clay',
  logged: 'bg-accent',
}

export function WeekStrip({ profileId, targets }) {
  const today = localDateISO()
  const [days, setDays] = useState([])
  const [error, setError] = useState('')
  const fetchKey = `${profileId}:${today}`
  const [tracked, setTracked] = useState(fetchKey)
  const [loading, setLoading] = useState(true)

  if (tracked !== fetchKey) {
    setTracked(fetchKey)
    setLoading(true)
  }

  useEffect(() => {
    let ignore = false
    getIntakeHistory(profileId, today, 7)
      .then((history) => {
        if (ignore) return
        setDays(history.days || [])
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
  }, [fetchKey, profileId, today])

  const scored = days.map((day) => {
    const calories = day.totals?.calories || 0
    const logged = (day.entries || []).length > 0
    const standing = dayStanding({
      calories,
      logged,
      isToday: day.date === today,
      target: targets?.calories || 0,
    })
    return { date: day.date, standing, label: formatShortDay(day.date) }
  })
  const onTarget = scored.filter((day) => day.standing === 'on').length

  return (
    <section aria-labelledby="week-strip-title" className="mt-12 rounded-3xl border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="week-strip-title" className="text-2xl font-semibold tracking-tight">This week</h2>
          <p className="mt-2 text-sm text-muted">
            {loading ? 'Checking the last seven days.' : `${onTarget} of 7 days are on the calorie target.`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/week" className="inline-flex rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest/90">
            Open week
          </Link>
          <Link to="/history" className="inline-flex rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-paper">
            History
          </Link>
        </div>
      </div>
      {error ? <p role="alert" className="mt-4 text-sm text-danger">{error}</p> : null}
      <ol className="mt-5 grid grid-cols-7 gap-2">
        {scored.map((day) => (
          <li key={day.date}>
            <Link to={`/history?date=${day.date}`} className="block rounded-2xl bg-paper px-1 py-3 text-center hover:bg-sand">
              <span className={`mx-auto block size-2.5 rounded-full ${DOT[day.standing]}`} />
              <span className="mt-2 block text-[11px] font-semibold text-ink sm:text-xs">{day.label}</span>
              <span className="sr-only">{STANDING_LABEL[day.standing]}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
