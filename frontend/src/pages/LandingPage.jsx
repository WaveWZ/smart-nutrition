import { ArrowRight, Gauge, Leaf, Scale, Sparkles, UtensilsCrossed } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SiteFooter, SiteHeader, SkipLink } from '../components/layout/SiteHeader'
import { PageMeta } from '../components/seo/PageMeta'
import { useAuth } from '../context/useAuth'

const STEP_TONES = [
  'border-accent/20 bg-accent text-accent-foreground',
  'border-carb/20 bg-carb text-white',
  'border-clay/20 bg-clay text-white',
]

const STEPS = [
  {
    icon: Scale,
    number: '01',
    title: 'Set your targets',
    body: 'Age, weight, height, activity, and goal become a daily calorie and macro budget.',
  },
  {
    icon: UtensilsCrossed,
    number: '02',
    title: 'Log what you eat',
    body: 'Each serving updates the day. The rings move as soon as the intake record changes.',
  },
  {
    icon: Sparkles,
    number: '03',
    title: 'Eat what still fits',
    body: 'Foods and plates are ranked against the protein, carbs, fat, and calories you have left.',
  },
]

const FEATURE_TONES = [
  'border-forest/20 bg-forest text-white',
  'border-carb/20 bg-carb text-white',
  'border-clay/20 bg-clay text-white',
]

const MACROS = [
  {
    label: 'Calories',
    title: 'The budget',
    body: 'What the day is allowed to spend, after activity and goal. The floor stays at basal rate.',
    tone: 'bg-forest text-white',
  },
  {
    label: 'Protein',
    title: 'The priority',
    body: 'Set from body weight and goal, so a cut does not quietly drop the protein target.',
    tone: 'bg-accent text-accent-foreground',
  },
  {
    label: 'Carbs',
    title: 'The fuel',
    body: 'What remains after protein and fat take their share of the calorie budget.',
    tone: 'bg-carb text-white',
  },
  {
    label: 'Fat',
    title: 'The rest',
    body: 'A share of energy, with a floor so the day does not collapse into protein alone.',
    tone: 'bg-clay text-white',
  },
]

const DAY_PARTS = [
  {
    title: 'A profile and a target',
    body: 'Age, sex, weight, height, activity, and goal produce BMR, TDEE, and the four macro targets.',
    tone: 'bg-accent',
  },
  {
    title: 'Meals and single foods',
    body: 'The list is ranked to the gap. A plate is several foods; a suggestion can also be one serving.',
    tone: 'bg-carb',
  },
  {
    title: 'A log you can edit',
    body: 'Add a serving from the catalog, log a whole recommended meal, or remove an entry from today.',
    tone: 'bg-clay',
  },
  {
    title: 'Rings that follow the log',
    body: 'The day document updates as you eat, and the chart reads the same totals.',
    tone: 'bg-forest',
  },
]

const SLOTS = [
  { label: 'Breakfast', body: 'Opening meal', tone: 'bg-accent text-accent-foreground' },
  { label: 'Lunch', body: 'Midday plate', tone: 'bg-carb text-white' },
  { label: 'Dinner', body: 'Evening plate', tone: 'bg-clay text-white' },
  { label: 'Snack', body: 'What is left', tone: 'bg-forest text-white' },
]

const GOALS = [
  {
    shift: '−500 kcal',
    title: 'Fat loss',
    body: 'Calories sit 500 under TDEE, with protein at 2 g per kilogram. The target will not drop below BMR.',
  },
  {
    shift: 'At TDEE',
    title: 'Maintenance',
    body: 'Calories match expenditure. Protein is 1.6 g per kilogram, and fat takes a slightly larger share.',
  },
  {
    shift: '+300 kcal',
    title: 'Muscle gain',
    body: 'Calories sit 300 above TDEE, with protein at 1.8 g per kilogram so the surplus is not only carbohydrate.',
  },
]

const FEATURES = [
  {
    icon: Scale,
    title: 'Equation-backed targets',
    body: 'Mifflin–St Jeor basal rate, an activity multiplier, and a goal adjustment. The calorie floor stays at or above BMR.',
  },
  {
    icon: Gauge,
    title: 'Remaining-macro matching',
    body: 'Suggestions are scored on the gap. The closest fit rises to the top of the day, not a generic menu.',
  },
  {
    icon: Leaf,
    title: 'Meals and single foods',
    body: 'Log a full plate or one serving. Both write the same daily intake document and refresh the chart.',
  },
]

export default function LandingPage() {
  const { user, profileStatus } = useAuth()
  const destination = user && profileStatus === 'missing' ? '/onboarding' : '/dashboard'
  const signedIn = Boolean(user && profileStatus !== 'idle' && profileStatus !== 'loading')
  const startHref = signedIn ? destination : '/signup'

  return (
    <div className="min-h-svh bg-paper text-ink">
      <PageMeta
        title="Daily meals for the macros you have left"
        description="Smart Nutrition Recommend calculates calorie and macro targets, then ranks foods and meals against what is still open today."
        path="/"
      />
      <SkipLink />
      <main id="main">
      <div className="relative overflow-hidden bg-forest text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(46,160,120,0.35),transparent_55%)]" aria-hidden="true" />
        <SiteHeader tone="dark">
          <a href="#how-it-works" className="hidden px-3 py-2 text-sm text-white/75 hover:text-white sm:inline">
            How it works
          </a>
          <a href="#features" className="hidden px-3 py-2 text-sm text-white/75 hover:text-white md:inline">
            Features
          </a>
          <a href="#day" className="hidden px-3 py-2 text-sm text-white/75 hover:text-white lg:inline">
            The day
          </a>
          {signedIn ? (
            <Link to={destination} className="rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-forest hover:bg-white/90">
              Open app
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 text-sm font-medium text-white/90 hover:text-white">
                Sign in
              </Link>
              <Link to="/signup" className="rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-forest hover:bg-white/90">
                Get started
              </Link>
            </>
          )}
        </SiteHeader>
        <section className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pt-28 pb-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:pt-32 lg:pb-24">
          <div>
            <p className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90">
              Nutrition software for the rest of the day
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-6xl sm:leading-[1.02]">
              Meals that match the macros you have left.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/75">
              Set a target once. Log servings as you eat. The next recommendation is ranked to the calories, protein, carbohydrate, and fat still open.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={startHref}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-forest hover:bg-white/90"
              >
                Get started
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <a href="#how-it-works" className="rounded-xl px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                See how it works
              </a>
            </div>
          </div>
          <HeroPreview />
        </section>
      </div>

      <section aria-label="Product highlights" className="bg-white">
        <ul className="mx-auto grid max-w-6xl sm:grid-cols-3">
          {[
            ['bg-accent', '4 macros', 'Calories, protein, carbohydrate, and fat on one day.'],
            ['bg-carb', 'Ranked to the gap', 'Foods and plates scored against what is still open.'],
            ['bg-clay', 'Live intake', 'The chart follows the day document as you log.'],
          ].map(([bar, title, body]) => (
            <li key={title} className="border-b border-line px-6 py-7 sm:border-r sm:border-b-0 last:sm:border-r-0">
              <span className={`mb-4 block h-1.5 w-10 rounded-full ${bar}`} aria-hidden="true" />
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ul>
      </section>

        <section id="how-it-works" aria-labelledby="how-title" className="bg-sand">
          <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-accent">How it works</p>
            <h2 id="how-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Three steps to the next meal</h2>
            <p className="mt-3 text-muted">A biometric profile, a log, and a short list of what still fits.</p>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.number}>
                <article className={`flex h-full flex-col rounded-3xl border p-6 shadow-sm ${STEP_TONES[index]}`}>
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-2xl bg-white text-ink">
                      <step.icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="text-sm font-semibold">{step.number}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/90">{step.body}</p>
                </article>
              </li>
            ))}
          </ol>
          </div>
        </section>

        <section id="features" aria-labelledby="features-title" className="border-y border-line bg-white">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="max-w-xl">
              <p className="text-sm font-semibold text-accent">Product</p>
              <h2 id="features-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Built around the gap</h2>
              <p className="mt-3 text-muted">The matching is the product. The menu changes with what you have already eaten.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <article key={feature.title} className={`rounded-3xl border p-6 ${FEATURE_TONES[index]}`}>
                  <span className="grid size-11 place-items-center rounded-2xl bg-white text-forest">
                    <feature.icon aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/90">{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="macros" aria-labelledby="macros-title" className="bg-sand">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="max-w-xl">
              <p className="text-sm font-semibold text-clay">The budget</p>
              <h2 id="macros-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Four numbers, one day</h2>
              <p className="mt-3 text-muted">Every recommendation is scored against what is still open in these four. The rings on the dashboard are the same four.</p>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {MACROS.map((macro) => (
                <li key={macro.label}>
                  <article className={`h-full rounded-3xl p-5 ${macro.tone}`}>
                    <p className="text-xs font-semibold tracking-wide uppercase">{macro.label}</p>
                    <h3 className="mt-3 text-lg font-semibold tracking-tight">{macro.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/90">{macro.body}</p>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="day" aria-labelledby="day-title" className="bg-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-carb">After you sign in</p>
              <h2 id="day-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">What the day actually contains</h2>
              <p className="mt-3 text-muted">A profile, a target, a log, and a short list. Nothing else is required to use the plan.</p>
              <ol className="mt-8 flex flex-col gap-4">
                {DAY_PARTS.map((part, index) => (
                  <li key={part.title} className="flex gap-4">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold text-white ${part.tone}`}>{index + 1}</span>
                    <div>
                      <h3 className="font-semibold tracking-tight">{part.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{part.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-3xl bg-sky p-6 sm:p-8">
              <p className="text-sm font-semibold text-carb">Meal slots</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">Breakfast through snack</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">A plate is logged into the slot it belongs to. The suggestion list can be a full meal or a single food.</p>
              <ul className="mt-6 grid grid-cols-2 gap-3">
                {SLOTS.map((slot) => (
                  <li key={slot.label} className={`rounded-2xl px-4 py-4 ${slot.tone}`}>
                    <p className="text-xs font-semibold tracking-wide uppercase">{slot.label}</p>
                    <p className="mt-1 text-sm">{slot.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="goals" aria-labelledby="goals-title" className="bg-sand">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="max-w-xl">
              <p className="text-sm font-semibold text-clay">Your goal</p>
              <h2 id="goals-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">The target moves with the goal</h2>
              <p className="mt-3 text-muted">Activity turns basal rate into TDEE. The goal then shifts calories, and protein is set per kilogram. The calorie target does not fall below BMR.</p>
            </div>
            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {GOALS.map((goal) => (
                <li key={goal.title}>
                  <article className="h-full rounded-3xl border border-clay/15 bg-white p-6">
                    <p className="text-sm font-semibold text-clay">{goal.shift}</p>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight">{goal.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{goal.body}</p>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="overflow-hidden rounded-3xl bg-forest px-6 py-12 text-white sm:px-12 sm:py-14">
            <h2 className="max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">Open today’s plan.</h2>
            <p className="mt-3 max-w-md text-white/75">Create an account, enter your biometrics, and the first recommendations are ready for the macros still open.</p>
            <Link
              to={startHref}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-forest hover:bg-white/90"
            >
              Get started
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function HeroPreview() {
  const rings = [
    { label: 'Calories', percent: '64%', tone: 'bg-[conic-gradient(#16352b_0_64%,#e6efe9_64%_100%)]' },
    { label: 'Protein', percent: '82%', tone: 'bg-[conic-gradient(#0e6b4f_0_82%,#e6efe9_82%_100%)]' },
    { label: 'Carbs', percent: '41%', tone: 'bg-[conic-gradient(#1a6f8a_0_41%,#e6efe9_41%_100%)]' },
    { label: 'Fat', percent: '55%', tone: 'bg-[conic-gradient(#b86a14_0_55%,#e6efe9_55%_100%)]' },
  ]

  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur-sm" aria-hidden="true">
      <div className="rounded-2xl bg-white p-5 text-ink">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Today</p>
          <p className="text-xs text-muted">Consumed vs target</p>
        </div>
        <ul className="mt-5 grid grid-cols-4 gap-3">
          {rings.map((ring) => (
            <li key={ring.label} className="text-center">
              <div className={`mx-auto grid size-14 place-items-center rounded-full p-1 ${ring.tone}`}>
                <span className="grid size-full place-items-center rounded-full bg-white text-[11px] font-semibold">{ring.percent}</span>
              </div>
              <p className="mt-2 text-[11px] text-muted">{ring.label}</p>
            </li>
          ))}
        </ul>
        <div className="mt-5 rounded-2xl bg-paper p-4">
          <p className="text-xs font-medium text-accent">Closest plate</p>
          <p className="mt-1 text-sm font-semibold">Chicken, rice, greens</p>
          <p className="mt-1 text-xs text-muted">940 kcal still open · 42 g protein</p>
        </div>
      </div>
    </div>
  )
}
