import { formatNumber, labelFor } from '../../utils/format'
import { MEAL_SLOTS } from '../../utils/nutrition'
import { Button } from '../ui/Button'

const SLOT_TONE = {
  breakfast: 'bg-sand text-clay',
  lunch: 'bg-sky text-carb',
  dinner: 'bg-accent/10 text-accent',
  snack: 'bg-clay/10 text-clay',
}

function MacroLine({ meal }) {
  return `${formatNumber(meal.calories)} kcal · P ${formatNumber(meal.proteinGrams)} · C ${formatNumber(meal.carbGrams)} · F ${formatNumber(meal.fatGrams)}`
}

export function MealPlan({ meals, status, loggingKey, onLogMeal }) {
  return (
    <section aria-labelledby="meal-plan-title" className="mt-12">
        <h2 id="meal-plan-title" className="text-2xl font-semibold tracking-tight text-ink">Recommended meals</h2>
      {status === 'targets_met' ? (
        <p className="mt-4 rounded-2xl border border-line bg-white p-5 text-sm text-muted shadow-sm">Today’s targets are covered.</p>
      ) : null}
      {status !== 'targets_met' && meals.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-line bg-white p-5 text-sm text-muted shadow-sm">
          Nothing on the shelf fits the calories that are still open.
        </p>
      ) : null}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {meals.map((meal) => {
          const key = `${meal.mealSlot}-${meal.name}`
          return (
            <article key={key} className="flex flex-col rounded-3xl border border-line bg-white p-5 shadow-sm">
              <p className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide uppercase ${SLOT_TONE[meal.mealSlot] || 'bg-paper text-ink'}`}>
                {labelFor(MEAL_SLOTS, meal.mealSlot)}
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-ink">{meal.name}</h3>
              <p className="mt-2 text-sm text-muted">{MacroLine({ meal })}</p>
              <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm text-ink">
                {meal.items.map((item) => (
                  <li key={`${item.foodId}-${item.servings}`} className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
                    <span>{item.name}</span>
                    <span className="shrink-0 text-muted">{item.servings} × {item.servingLabel}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="secondary"
                className="mt-5"
                disabled={loggingKey === key}
                aria-label={`Log ${meal.name}`}
                onClick={() => onLogMeal(meal, key)}
              >
                {loggingKey === key ? 'Logging…' : 'Log this meal'}
              </Button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
