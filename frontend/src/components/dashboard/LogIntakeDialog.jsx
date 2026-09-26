import { useEffect, useMemo, useState } from 'react'
import { readApiError, searchFoods } from '../../services/api'
import { suggestedMealSlot } from '../../utils/dates'
import { MEAL_SLOTS } from '../../utils/nutrition'
import { Button } from '../ui/Button'
import { fieldClass } from '../ui/fieldClass'
import { Dialog } from '../ui/Dialog'

function parseServings(value) {
  const servings = Number(value)
  if (!Number.isFinite(servings) || servings < 0.25 || servings > 5) return null
  const rounded = Math.round(servings * 100) / 100
  if (Math.abs(rounded - servings) > 1e-8) return null
  return rounded
}

export function LogIntakeDialog({ open, preset, onClose, onSubmit }) {
  const [foods, setFoods] = useState([])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(preset?.foodId || '')
  const [mealSlot, setMealSlot] = useState(preset?.mealSlot || suggestedMealSlot())
  const [servings, setServings] = useState(String(preset?.servings || 1))
  const [error, setError] = useState('')
  const [loadingFoods, setLoadingFoods] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    let ignore = false
    searchFoods({ limit: 100 })
      .then((records) => {
        if (!ignore) setFoods(records)
      })
      .catch((requestError) => {
        if (!ignore) setError(readApiError(requestError))
      })
      .finally(() => {
        if (!ignore) setLoadingFoods(false)
      })
    return () => {
      ignore = true
    }
  }, [open])

  const visibleFoods = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const catalog = preset && !foods.some((food) => food.id === preset.foodId)
      ? [{ id: preset.foodId, name: preset.name, cuisine: preset.cuisine, servingLabel: preset.servingLabel }, ...foods]
      : foods
    if (!needle) return catalog
    return catalog.filter((food) => `${food.name} ${food.cuisine}`.toLowerCase().includes(needle))
  }, [foods, query, preset])

  const selected = visibleFoods.find((food) => food.id === selectedId)
    || foods.find((food) => food.id === selectedId)

  async function handleSubmit(event) {
    event.preventDefault()
    const parsedServings = parseServings(servings)
    if (!selectedId) {
      setError('Choose a food to log.')
      return
    }
    if (parsedServings == null) {
      setError('Servings must be between 0.25 and 5, with at most two decimal places.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSubmit({ foodId: selectedId, mealSlot, servings: parsedServings })
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
      title="Log a serving"
      description="This writes today’s intake. The macro rings update as soon as the day document changes."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="food-search" className="text-sm font-medium text-ink">Find a food</label>
          <input
            id="food-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Chicken, oats, injera…"
            className={fieldClass}
            autoComplete="off"
          />
        </div>
        <div className="max-h-48 overflow-y-auto rounded-xl border border-line bg-white" role="listbox" aria-label="Foods">
          {loadingFoods ? <p className="px-3 py-3 text-sm text-muted">Loading the catalog…</p> : null}
          {!loadingFoods && !error && visibleFoods.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted">No foods match that search.</p>
          ) : null}
          {visibleFoods.map((food) => {
            const selectedFood = food.id === selectedId
            return (
              <button
                key={food.id}
                type="button"
                role="option"
                aria-selected={selectedFood}
                onClick={() => setSelectedId(food.id)}
                className={`block w-full border-b border-line px-3 py-2 text-left text-sm last:border-b-0 ${selectedFood ? 'bg-ink text-white' : 'text-ink hover:bg-paper'}`}
              >
                <span className="font-medium">{food.name}</span>
                <span className={`ml-2 ${selectedFood ? 'text-white/80' : 'text-muted'}`}>
                  {food.servingLabel}
                </span>
              </button>
            )
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="meal-slot" className="text-sm font-medium text-ink">Meal</label>
            <select
              id="meal-slot"
              value={mealSlot}
              onChange={(event) => setMealSlot(event.target.value)}
              className={fieldClass}
            >
              {MEAL_SLOTS.map((slot) => (
                <option key={slot.value} value={slot.value}>{slot.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="servings" className="text-sm font-medium text-ink">
              Servings{selected?.servingLabel ? ` (${selected.servingLabel})` : ''}
            </label>
            <input
              id="servings"
              inputMode="decimal"
              value={servings}
              onChange={(event) => setServings(event.target.value)}
              className={fieldClass}
            />
          </div>
        </div>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Add to today'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
