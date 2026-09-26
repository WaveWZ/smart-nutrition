import { useEffect, useRef, useState } from 'react'
import { AddFoodDialog } from '../components/dashboard/AddFoodDialog'
import { FoodSuggestions } from '../components/dashboard/FoodSuggestions'
import { LogIntakeDialog } from '../components/dashboard/LogIntakeDialog'
import { MacroProgress } from '../components/dashboard/MacroProgress'
import { MealPlan } from '../components/dashboard/MealPlan'
import { AppHeader, SiteFooter, SkipLink } from '../components/layout/SiteHeader'
import { WeekStrip } from '../components/week/WeekStrip'
import { PageMeta } from '../components/seo/PageMeta'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/useAuth'
import { useNutritionDay } from '../hooks/useNutritionDay'
import { readApiError, recordIntake } from '../services/api'
import { formatDateLabel } from '../utils/dates'
import { formatNumber, labelFor } from '../utils/format'
import { GOAL_OPTIONS } from '../utils/nutrition'

export default function DashboardPage() {
  const { user } = useAuth()
  const profileId = user.uid
  const day = useNutritionDay(profileId)
  const [logOpen, setLogOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [customSession, setCustomSession] = useState(0)
  const [logSession, setLogSession] = useState(0)
  const [preset, setPreset] = useState(null)
  const [loggingKey, setLoggingKey] = useState('')
  const [actionError, setActionError] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const intakeAnnounced = useRef(false)

  useEffect(() => {
    const count = day.intake?.entries?.length
    if (count == null) return
    if (!intakeAnnounced.current) {
      intakeAnnounced.current = true
      return
    }
    setAnnouncement(`${count} ${count === 1 ? 'serving' : 'servings'} logged today.`)
  }, [day.intake?.entries?.length])

  function openLog(food) {
    setPreset(food || null)
    setLogSession((value) => value + 1)
    setLogOpen(true)
    setActionError('')
  }

  function openCustom() {
    setCustomSession((value) => value + 1)
    setCustomOpen(true)
    setActionError('')
  }

  async function submitServing(payload) {
    const next = await recordIntake(profileId, { ...payload, date: day.date })
    day.replaceIntake(next)
  }

  async function logMeal(meal, key) {
    setLoggingKey(key)
    setActionError('')
    try {
      let latest = null
      for (const item of meal.items) {
        latest = await recordIntake(profileId, {
          foodId: item.foodId,
          date: day.date,
          mealSlot: meal.mealSlot,
          servings: item.servings,
        })
      }
      if (latest) day.replaceIntake(latest)
    } catch (error) {
      setActionError(readApiError(error))
    } finally {
      setLoggingKey('')
    }
  }

  const blocked = day.profileError || (day.planError && !day.plan)

  return (
    <div className="min-h-svh bg-paper text-ink">
      <PageMeta
        title="Today’s plan"
        description="Daily calorie, protein, carbohydrate, and fat progress with meals ranked to the macros still open."
        path="/dashboard"
      />
      <SkipLink />
      <AppHeader />
      <main id="main" className="mx-auto max-w-6xl px-5 py-8">
        <p className="sr-only" aria-live="polite">{announcement}</p>
        <header className="overflow-hidden rounded-3xl bg-forest px-6 py-8 text-white sm:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm text-white/70">{formatDateLabel(day.date)}</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                {day.profile?.displayName || 'Today'}
              </h1>
              <p className="mt-3 max-w-xl text-white/75">
                {day.remaining
                  ? `${formatNumber(day.remaining.calories)} kcal still open, with ${formatNumber(day.remaining.proteinGrams)} g protein, ${formatNumber(day.remaining.carbGrams)} g carbohydrate, and ${formatNumber(day.remaining.fatGrams)} g fat.`
                  : 'Loading today’s targets.'}
              </p>
              {day.intakeStatus === 'live' ? (
                <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">Intake is live</p>
              ) : null}
            </div>
            {day.targets ? (
              <dl className="grid grid-cols-3 gap-3 text-left">
                {[
                  ['BMR', formatNumber(day.targets.bmr), 'bg-white/10'],
                  ['TDEE', formatNumber(day.targets.tdee), 'bg-carb/50'],
                  ['Goal', labelFor(GOAL_OPTIONS, day.profile?.goal), 'bg-clay/80'],
                ].map(([label, value, tone]) => (
                  <div key={label} className={`rounded-2xl px-4 py-3 ${tone}`}>
                    <dt className="text-[11px] font-medium tracking-wide text-white/80 uppercase">{label}</dt>
                    <dd className="mt-1 text-lg font-semibold tracking-tight">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => openLog(null)} aria-label="Log a food serving" className="!bg-white !text-forest hover:!bg-white/90">
              Log a serving
            </Button>
            <Button onClick={openCustom} aria-label="Add your own food" className="!bg-clay !text-white hover:!bg-clay/90">
              Add your own food
            </Button>
          </div>
        </header>

        {day.targets?.calorieFloorApplied ? (
          <p className="mt-6 rounded-xl border border-line bg-white px-4 py-3 text-sm text-muted shadow-sm">
            The calorie target is held at basal rate so the day does not drop below BMR.
          </p>
        ) : null}

        {blocked ? (
          <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm" role="alert">
            <p className="text-ink">{day.profileError || day.planError}</p>
            <Button className="mt-4" onClick={day.reloadPlan}>Try again</Button>
          </div>
        ) : (
          <>
            {day.planError ? <p role="alert" className="mt-6 text-sm text-danger">{day.planError}</p> : null}
            {actionError ? <p role="alert" className="mt-6 text-sm text-danger">{actionError}</p> : null}
            {day.intakeError && day.intakeStatus !== 'live' ? (
              <p role="status" className="mt-6 text-sm text-muted">{day.intakeError}</p>
            ) : null}
            <div className="mt-8">
              {day.targets ? <MacroProgress targets={day.targets} consumed={day.consumed} /> : <ProgressSkeleton />}
            </div>
            <MealPlan
              meals={day.plan?.meals || []}
              status={day.plan?.status}
              loggingKey={loggingKey}
              onLogMeal={logMeal}
            />
            <FoodSuggestions foods={day.plan?.foods || []} onAdd={openLog} />
            <WeekStrip profileId={profileId} targets={day.targets} />
          </>
        )}
      </main>
      <SiteFooter />
      <LogIntakeDialog
        key={`log-${logSession}`}
        open={logOpen}
        preset={preset}
        onClose={() => setLogOpen(false)}
        onSubmit={submitServing}
      />
      <AddFoodDialog
        key={`custom-${customSession}`}
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        onCreated={submitServing}
      />
    </div>
  )
}

function ProgressSkeleton() {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
      {['calories', 'protein', 'carbs', 'fat'].map((key) => (
        <div key={key} className="h-56 animate-pulse rounded-2xl border border-line bg-white motion-reduce:animate-none" />
      ))}
    </div>
  )
}
