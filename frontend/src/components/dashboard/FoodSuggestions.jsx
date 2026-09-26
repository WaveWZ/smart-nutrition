import { formatNumber } from '../../utils/format'
import { Button } from '../ui/Button'

export function FoodSuggestions({ foods, onAdd }) {
  return (
    <section aria-labelledby="food-suggestions-title" className="mt-12">
      <h2 id="food-suggestions-title" className="text-2xl font-semibold tracking-tight text-ink">Foods that fit the gap</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Ranked by how closely a serving matches the macros still open.
      </p>
      {foods.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-line bg-white p-5 text-sm text-muted shadow-sm">No single food fits what is left today.</p>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {foods.map((food, index) => (
            <li key={food.foodId}>
              <article className={`flex h-full flex-col rounded-3xl border bg-white p-5 shadow-sm ${index === 0 ? 'border-accent' : 'border-line'}`}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-ink">{food.name}</h3>
                  {index === 0 ? (
                    <span className="shrink-0 rounded-full border border-line bg-paper px-2 py-0.5 text-xs font-medium text-ink">
                      Closest fit
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted capitalize">{food.cuisine} · {food.category}</p>
                <p className="mt-3 text-sm text-ink">
                  {food.servings} × {food.servingLabel}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatNumber(food.calories)} kcal · P {formatNumber(food.proteinGrams, 1)} · C {formatNumber(food.carbGrams, 1)} · F {formatNumber(food.fatGrams, 1)}
                </p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  aria-label={`Log ${food.name}`}
                  onClick={() => onAdd(food)}
                >
                  Log serving
                </Button>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
