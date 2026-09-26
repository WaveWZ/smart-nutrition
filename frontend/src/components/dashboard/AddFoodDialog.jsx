import { useState } from 'react'
import { createFood, readApiError } from '../../services/api'
import { suggestedMealSlot } from '../../utils/dates'
import { FOOD_CATEGORIES, MEAL_SLOTS } from '../../utils/nutrition'
import { Button } from '../ui/Button'
import { fieldClass } from '../ui/fieldClass'
import { Dialog } from '../ui/Dialog'

function estimatedCalories(protein, carbs, fat) {
  return Math.round((Number(protein) || 0) * 4 + (Number(carbs) || 0) * 4 + (Number(fat) || 0) * 9)
}

function readMacro(value, { max, decimals }) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0 || number > max) return null
  const factor = 10 ** decimals
  const rounded = Math.round(number * factor) / factor
  if (Math.abs(rounded - number) > 1e-8) return null
  return rounded
}

export function AddFoodDialog({ open, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [servingLabel, setServingLabel] = useState('1 serving')
  const [cuisine, setCuisine] = useState('Home')
  const [category, setCategory] = useState('mixed')
  const [slots, setSlots] = useState(() => [suggestedMealSlot()])
  const [mealSlot, setMealSlot] = useState(() => suggestedMealSlot())
  const [servings, setServings] = useState('1')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const estimate = estimatedCalories(protein, carbs, fat)

  function toggleSlot(value) {
    setSlots((current) => {
      if (current.includes(value)) return current.filter((slot) => slot !== value)
      return [...current, value]
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const proteinGrams = readMacro(protein, { max: 200, decimals: 1 })
    const carbGrams = readMacro(carbs, { max: 300, decimals: 1 })
    const fatGrams = readMacro(fat, { max: 200, decimals: 1 })
    const calorieValue = calories.trim() === '' ? estimate : readMacro(calories, { max: 2000, decimals: 0 })
    const servingCount = readMacro(servings, { max: 5, decimals: 2 })

    if (name.trim().length < 2) {
      setError('Give the food a name of at least 2 characters.')
      return
    }
    if (cuisine.trim().length < 2) {
      setError('Cuisine needs at least 2 characters. “Home” is fine.')
      return
    }
    if (servingLabel.trim().length < 1) {
      setError('Describe one serving, such as 1 bowl or 150 g.')
      return
    }
    if (slots.length === 0) {
      setError('Choose at least one meal this food belongs to.')
      return
    }
    if (proteinGrams == null || carbGrams == null || fatGrams == null || calorieValue == null) {
      setError('Check the numbers. Calories are a whole number up to 2,000. Grams allow one decimal.')
      return
    }
    if (servingCount == null || servingCount < 0.25) {
      setError('Servings must be between 0.25 and 5.')
      return
    }
    const predicted = proteinGrams * 4 + carbGrams * 4 + fatGrams * 9
    const tolerance = Math.max(30, calorieValue * 0.15)
    if (Math.abs(predicted - calorieValue) > tolerance) {
      setError(`Calories should be near ${Math.round(predicted)} kcal for those grams. The allowed gap is ${Math.round(tolerance)} kcal.`)
      return
    }

    setSaving(true)
    setError('')
    try {
      const food = await createFood({
        name: name.trim(),
        cuisine: cuisine.trim(),
        category,
        mealSlots: slots,
        servingLabel: servingLabel.trim(),
        calories: calorieValue,
        proteinGrams,
        carbGrams,
        fatGrams,
      })
      await onCreated({
        foodId: food.id,
        mealSlot,
        servings: servingCount,
      })
      onClose()
    } catch (requestError) {
      setError(readApiError(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      variant="sheet"
      title="Add your own food"
      description="Save it to the catalog and log a serving on today’s plan."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="custom-name" className="text-sm font-medium text-ink">Name</label>
          <input id="custom-name" value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} placeholder="Lentil soup" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="custom-serving" className="text-sm font-medium text-ink">One serving</label>
            <input id="custom-serving" value={servingLabel} onChange={(event) => setServingLabel(event.target.value)} className={fieldClass} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="custom-cuisine" className="text-sm font-medium text-ink">Cuisine</label>
            <input id="custom-cuisine" value={cuisine} onChange={(event) => setCuisine(event.target.value)} className={fieldClass} required />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="custom-category" className="text-sm font-medium text-ink">Category</label>
          <select id="custom-category" value={category} onChange={(event) => setCategory(event.target.value)} className={fieldClass}>
            {FOOD_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <fieldset>
          <legend className="text-sm font-medium text-ink">Fits these meals</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {MEAL_SLOTS.map((slot) => {
              const checked = slots.includes(slot.value)
              return (
                <label key={slot.value} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${checked ? 'border-accent bg-accent text-accent-foreground' : 'border-line bg-white text-ink'}`}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggleSlot(slot.value)}
                  />
                  {slot.label}
                </label>
              )
            })}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="custom-protein" className="text-sm font-medium text-protein">Protein (g)</label>
            <input id="custom-protein" inputMode="decimal" value={protein} onChange={(event) => setProtein(event.target.value)} className={fieldClass} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="custom-carbs" className="text-sm font-medium text-carb">Carbs (g)</label>
            <input id="custom-carbs" inputMode="decimal" value={carbs} onChange={(event) => setCarbs(event.target.value)} className={fieldClass} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="custom-fat" className="text-sm font-medium text-clay">Fat (g)</label>
            <input id="custom-fat" inputMode="decimal" value={fat} onChange={(event) => setFat(event.target.value)} className={fieldClass} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="custom-calories" className="text-sm font-medium text-ink">Calories</label>
            <input id="custom-calories" inputMode="numeric" value={calories} onChange={(event) => setCalories(event.target.value)} placeholder={estimate ? String(estimate) : 'kcal'} className={fieldClass} />
          </div>
        </div>
        <p className="rounded-xl bg-sand px-3 py-2 text-sm text-clay">
          {estimate ? `From the grams, one serving is about ${estimate} kcal. Leave calories empty to use that.` : 'Enter protein, carbs, and fat. Calories can follow from those grams.'}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="custom-log-slot" className="text-sm font-medium text-ink">Log it as</label>
            <select id="custom-log-slot" value={mealSlot} onChange={(event) => setMealSlot(event.target.value)} className={fieldClass}>
              {MEAL_SLOTS.map((slot) => (
                <option key={slot.value} value={slot.value}>{slot.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="custom-servings" className="text-sm font-medium text-ink">Servings now</label>
            <input id="custom-servings" inputMode="decimal" value={servings} onChange={(event) => setServings(event.target.value)} className={fieldClass} required />
          </div>
        </div>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save and log'}</Button>
        </div>
      </form>
    </Dialog>
  )
}
