const { MEAL_SLOTS, SLOT_ENERGY_SHARE } = require('../domain/nutrition');
const {
  remainingMacros,
  subtractMacros,
  scaleMacrosToCalories,
  sumMacros,
  roundMacros,
  roundTo,
} = require('../domain/macros');

const ITEM_QUANTITIES = Object.freeze({
  protein: [0.5, 1, 1.5],
  carbohydrate: [0.5, 1, 1.5],
  fat: [0.5, 1],
  vegetable: [1, 1.5, 2],
  fruit: [0.5, 1],
  dairy: [0.5, 1, 1.5],
  mixed: [1],
});

const PLATE_QUANTITIES = Object.freeze({
  protein: [0.5, 1, 1.5, 2],
  carbohydrate: [0.5, 1, 1.5, 2],
  fat: [0.5, 1],
  vegetable: [1, 1.5, 2],
  fruit: [0.5, 1, 1.5],
  dairy: [0.5, 1, 1.5],
  mixed: [1],
});

const ROLE_CATEGORIES = Object.freeze({
  carbohydrate: new Set(['carbohydrate', 'fruit']),
  fat: new Set(['fat']),
  vegetable: new Set(['vegetable']),
});

function fetchOptimalMealRecommendations({
  targets,
  consumed = {},
  consumedBySlot = {},
  foods = [],
  mealSlot = null,
  limit = 8,
}) {
  const usableFoods = foods.filter(isUsableFood);
  const remaining = remainingMacros(targets, consumed);
  const rankedFoods = remaining.calories < 80
    ? []
    : rankFoods(usableFoods, remaining, targets, mealSlot, limit);

  let meals = [];
  if (remaining.calories >= 80) {
    meals = mealSlot
      ? mealsForSlot(usableFoods, remaining, targets, consumedBySlot, mealSlot)
      : planRemainingMeals(usableFoods, remaining, targets, consumedBySlot);
  }

  let status = 'ok';
  if (remaining.calories < 80) status = 'targets_met';
  else if (rankedFoods.length === 0 && meals.length === 0) status = 'no_matches';

  return {
    status,
    remaining: roundMacros(remaining),
    foods: rankedFoods,
    meals,
  };
}

function allocateSlotCalorieBudgets(dailyCalories, remainingCalories, consumedBySlot = {}) {
  const openSlots = MEAL_SLOTS.map((slot) => {
    const ideal = dailyCalories * SLOT_ENERGY_SHARE[slot];
    const already = consumedBySlot?.[slot]?.calories || 0;
    const room = Math.max(0, ideal - already);
    return { slot, room: room >= 80 ? room : 0 };
  }).filter((slot) => slot.room > 0);

  const roomSum = openSlots.reduce((sum, slot) => sum + slot.room, 0);
  if (roomSum === 0 || remainingCalories < 80) return [];

  return openSlots.map((slot) => ({
    slot: slot.slot,
    calories: (slot.room / roomSum) * remainingCalories,
  }));
}

function rankFoods(foods, remaining, targets, mealSlot, limit) {
  const ranked = [];

  for (const food of foods) {
    const best = selectBestServing(
      food,
      remaining,
      remaining,
      mealSlot,
      ITEM_QUANTITIES[food.category] || [1],
      'item',
      targets,
    );
    if (best) ranked.push(presentFood(best));
  }

  ranked.sort(byScoreDesc);
  return ranked.slice(0, limit);
}

function planRemainingMeals(foods, remaining, targets, consumedBySlot) {
  const allocations = allocateSlotCalorieBudgets(targets.calories, remaining.calories, consumedBySlot);
  let residual = { ...remaining };
  let rolledCalories = 0;
  const meals = [];
  const usedFoodIds = new Set();
  const slotCap = targets.calories * 0.45;

  // Slot shares describe an untouched day. Calories a plate does not use roll
  // forward so a light breakfast does not strand the rest of the deficit.
  // Macro shape is taken from the residual after earlier plates, which steers
  // later meals toward whichever macro is still open.
  for (const allocation of allocations) {
    if (residual.calories < 80) break;

    const slotCalories = Math.min(residual.calories, slotCap, allocation.calories + rolledCalories);
    if (slotCalories < 80) {
      rolledCalories += allocation.calories;
      continue;
    }

    const slotBudget = scaleMacrosToCalories(residual, slotCalories);
    const chosen = buildSlotPlates(foods, residual, slotBudget, allocation.slot, usedFoodIds)[0];
    if (!chosen) {
      rolledCalories += slotCalories;
      continue;
    }

    meals.push(chosen);
    for (const item of chosen.items) usedFoodIds.add(item.foodId);
    rolledCalories = Math.max(0, slotCalories - chosen.calories);
    residual = subtractMacros(residual, chosen);
  }

  return meals;
}

function mealsForSlot(foods, remaining, targets, consumedBySlot, slot) {
  const ideal = targets.calories * SLOT_ENERGY_SHARE[slot];
  const already = consumedBySlot?.[slot]?.calories || 0;
  const slotCalories = Math.min(remaining.calories, Math.max(0, ideal - already));
  if (slotCalories < 80) return [];

  const slotBudget = scaleMacrosToCalories(remaining, slotCalories);
  return buildSlotPlates(foods, remaining, slotBudget, slot).slice(0, 3);
}

function buildSlotPlates(foods, dayRemaining, slotBudget, slot, blockedIds = new Set()) {
  if (!slotBudget || slotBudget.calories < 80) return [];

  const pool = mealPool(foods, slot);
  const plates = [];

  for (const food of pool) {
    if (blockedIds.has(food.id) || food.category !== 'mixed' || slotAffinity(food, slot) < 1) continue;
    const plate = buildStandalonePlate(food, dayRemaining, slotBudget, slot);
    if (plate) plates.push(plate);
  }

  const anchors = selectAnchors(pool, dayRemaining, slot, blockedIds);

  for (const anchor of anchors) {
    const plate = buildComposedPlate(anchor, pool, dayRemaining, slotBudget, slot);
    if (plate) plates.push(plate);
  }

  const unique = [];
  const seen = new Set();
  for (const plate of plates.sort(byScoreDesc)) {
    const key = plate.items.map((item) => item.foodId).sort().join('+');
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(plate);
  }

  return unique;
}

function buildStandalonePlate(food, dayRemaining, slotBudget, slot) {
  const portion = selectBestServing(
    food,
    dayRemaining,
    slotBudget,
    slot,
    [0.5, 1, 1.5],
    'plate',
  );
  if (!portion) return null;
  if (portion.calories < slotBudget.calories * 0.45 && slotBudget.calories > 250) return null;
  return finalizePlate([portion], slot, slotBudget, dayRemaining);
}

function buildComposedPlate(anchor, foods, dayRemaining, slotBudget, slot) {
  const anchorPortion = selectBestServing(
    anchor,
    dayRemaining,
    slotBudget,
    slot,
    PLATE_QUANTITIES[anchor.category] || [1],
    'plate',
  );
  if (!anchorPortion) return null;

  const items = [anchorPortion];
  let ceiling = subtractMacros(dayRemaining, anchorPortion);
  let budgetLeft = subtractMacros(slotBudget, anchorPortion);
  const used = new Set([anchor.id]);

  for (const role of sideRoles(anchor)) {
    if (role === 'fat' && budgetLeft.fatGrams < 6) continue;
    if (role === 'vegetable' && budgetLeft.calories < 30) continue;
    if (role !== 'vegetable' && budgetLeft.calories < 40) continue;

    const side = pickRoleFood(foods, role, ceiling, budgetLeft, slot, used);
    if (!side) continue;

    items.push(side);
    used.add(side.foodId);
    ceiling = subtractMacros(ceiling, side);
    budgetLeft = subtractMacros(budgetLeft, side);
  }

  const hasCarb = items.some((item) => item.category === 'carbohydrate' || item.category === 'fruit');
  if (!hasCarb && budgetLeft.calories > 120) {
    const extraCarb = pickRoleFood(foods, 'carbohydrate', ceiling, budgetLeft, slot, used);
    if (extraCarb) items.push(extraCarb);
  }

  return finalizePlate(items, slot, slotBudget, dayRemaining);
}

function pickRoleFood(foods, role, dayRemaining, budgetLeft, slot, used) {
  const categories = ROLE_CATEGORIES[role];
  let best = null;

  for (const food of foods) {
    if (used.has(food.id) || !categories.has(food.category)) continue;
    const portion = selectBestServing(
      food,
      dayRemaining,
      budgetLeft,
      slot,
      PLATE_QUANTITIES[food.category] || [1],
      'plate',
    );
    if (!portion) continue;
    if (!best || portion.score > best.score) best = portion;
  }

  return best;
}

function selectBestServing(food, dayRemaining, budget, slot, quantities, mode, targets) {
  let best = null;

  for (const servings of quantities) {
    const portion = portionFrom(food, servings);
    if (exceedsCalorieCeiling(portion, dayRemaining)) continue;

    const score = mode === 'item'
      ? scoreFoodItem(portion, dayRemaining, targets, slot)
      : scorePlate([portion], budget, dayRemaining, slot);

    if (!best || score > best.score) {
      best = { ...portion, score };
    }
  }

  if (!best || best.score <= 0) return null;
  return best;
}

function scoreFoodItem(portion, remaining, targets, slot) {
  const alignment = alignmentScore(portion, remaining);
  const closure = gapClosure(portion, remaining, targets);
  const affinity = slotAffinity(portion, slot);
  const penalty = overshootPenalty(portion, remaining);

  // Gap closure moves the furthest-behind macro. Overshoot is measured in
  // remaining-deficit units, with a few grams of slack so a 2 g fat overrun
  // does not discard an otherwise fitting food.
  return 0.55 * alignment + 0.3 * closure + 0.15 * affinity - penalty;
}

function scorePlate(items, slotBudget, dayRemaining, slot) {
  const totals = sumMacros(items);
  const alignment = alignmentScore(totals, slotBudget);
  const fit = calorieFitScore(totals.calories, slotBudget.calories);
  const coverage = budgetCoverage(totals, slotBudget);
  const affinity = items.reduce((sum, item) => sum + slotAffinity(item, slot), 0) / items.length;
  const penalty = overshootPenalty(totals, dayRemaining) + 0.5 * overshootPenalty(totals, slotBudget);

  return 0.38 * alignment + 0.32 * fit + 0.2 * coverage + 0.1 * affinity - penalty;
}

function alignmentScore(portion, deficit) {
  const needed = [
    deficit.proteinGrams > 0 ? 1 : 0,
    deficit.carbGrams > 0 ? 1 : 0,
    deficit.fatGrams > 0 ? 1 : 0,
  ];
  if (needed.every((value) => value === 0)) return 0;

  // Scale each macro by the amount still open. Raw grams would let a large
  // carbohydrate deficit dominate protein and fat.
  const offered = [
    portion.proteinGrams / Math.max(deficit.proteinGrams, 1),
    portion.carbGrams / Math.max(deficit.carbGrams, 1),
    portion.fatGrams / Math.max(deficit.fatGrams, 1),
  ];
  return cosineSimilarity(offered, needed);
}

function gapClosure(portion, remaining, targets) {
  const key = mostOpenMacro(remaining, targets);
  if (!key || remaining[key] <= 0) return 0;
  return Math.min(1, Math.max(0, portion[key]) / remaining[key]);
}

function mostOpenMacro(remaining, targets) {
  let bestKey = null;
  let bestRatio = 0;

  for (const key of ['proteinGrams', 'fatGrams', 'carbGrams']) {
    const ratio = remaining[key] / Math.max(targets[key] || 0, 1);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestKey = key;
    }
  }

  return bestKey;
}

function budgetCoverage(totals, budget) {
  let covered = 0;
  let counted = 0;

  for (const key of ['proteinGrams', 'carbGrams', 'fatGrams']) {
    if (budget[key] <= 1) continue;
    covered += Math.min(1, Math.max(0, totals[key]) / budget[key]);
    counted += 1;
  }

  return counted === 0 ? 0 : covered / counted;
}

function overshootPenalty(portion, ceiling) {
  const slackByKey = {
    proteinGrams: 4,
    carbGrams: 6,
    fatGrams: 3,
  };

  let penalty = 0;
  for (const [key, slack] of Object.entries(slackByKey)) {
    const overflow = portion[key] - ceiling[key] - slack;
    if (overflow > 0) penalty += overflow / Math.max(ceiling[key], slack);
  }

  const calorieSlack = Math.max(40, ceiling.calories * 0.05);
  const calorieOverflow = portion.calories - ceiling.calories - calorieSlack;
  if (calorieOverflow > 0) penalty += calorieOverflow / Math.max(ceiling.calories, 1);

  return penalty;
}

function calorieFitScore(calories, budget) {
  if (budget <= 0) return 0;
  return Math.max(0, 1 - Math.abs(calories - budget) / budget);
}

function slotAffinity(food, slot) {
  if (!slot) return 1;
  if (!Array.isArray(food.mealSlots) || food.mealSlots.length === 0) return 0.7;
  return food.mealSlots.includes(slot) ? 1 : 0.45;
}

function cosineSimilarity(left, right) {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }

  if (leftNorm === 0 || rightNorm === 0) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function exceedsCalorieCeiling(portion, ceiling) {
  const slack = Math.max(40, ceiling.calories * 0.08);
  return portion.calories > ceiling.calories + slack;
}

function mealPool(foods, slot) {
  if (!slot) return foods;
  const inSlot = foods.filter((food) => (food.mealSlots || []).includes(slot));
  return inSlot.length >= 4 ? inSlot : foods;
}

function selectAnchors(pool, dayRemaining, slot, blockedIds) {
  const proteinStillOpen = dayRemaining.proteinGrams > 12;
  const categories = proteinStillOpen
    ? new Set(['protein', 'dairy'])
    : new Set(['carbohydrate', 'fruit', 'fat']);

  const ranked = pool
    .filter((food) => categories.has(food.category))
    .sort((left, right) => {
      const blockedDelta = Number(blockedIds.has(left.id)) - Number(blockedIds.has(right.id));
      if (blockedDelta !== 0) return blockedDelta;
      const slotDelta = Number(slotAffinity(right, slot) === 1) - Number(slotAffinity(left, slot) === 1);
      if (slotDelta !== 0) return slotDelta;
      return anchorDensity(right, proteinStillOpen) - anchorDensity(left, proteinStillOpen);
    });

  const fresh = ranked.filter((food) => !blockedIds.has(food.id));
  return (fresh.length > 0 ? fresh : ranked).slice(0, 5);
}

function sideRoles(anchor) {
  if (anchor.category === 'fat') return ['carbohydrate', 'vegetable'];
  if (anchor.category === 'carbohydrate' || anchor.category === 'fruit') return ['fat', 'vegetable'];
  return ['carbohydrate', 'fat', 'vegetable'];
}

function anchorDensity(food, proteinStillOpen) {
  if (food.calories <= 0) return 0;
  if (proteinStillOpen) return food.proteinGrams / food.calories;
  if (food.category === 'fat') return food.fatGrams / food.calories;
  return food.carbGrams / food.calories;
}

function portionFrom(food, servings) {
  return {
    foodId: food.id,
    name: food.name,
    cuisine: food.cuisine,
    category: food.category,
    mealSlots: food.mealSlots,
    servings,
    servingLabel: food.servingLabel,
    calories: Math.round(food.calories * servings),
    proteinGrams: roundTo(food.proteinGrams * servings, 1),
    carbGrams: roundTo(food.carbGrams * servings, 1),
    fatGrams: roundTo(food.fatGrams * servings, 1),
  };
}

function finalizePlate(items, slot, slotBudget, dayRemaining) {
  const totals = sumMacros(items);
  const score = scorePlate(items, slotBudget, dayRemaining, slot);
  if (score <= 0) return null;

  return {
    mealSlot: slot,
    name: items.map((item) => item.name).join(', '),
    score: roundTo(score, 3),
    ...totals,
    items: items.map(presentItem),
  };
}

function presentFood(portion) {
  return {
    ...presentItem(portion),
    score: roundTo(portion.score, 3),
  };
}

function presentItem(portion) {
  return {
    foodId: portion.foodId,
    name: portion.name,
    cuisine: portion.cuisine,
    category: portion.category,
    servings: portion.servings,
    servingLabel: portion.servingLabel,
    calories: portion.calories,
    proteinGrams: portion.proteinGrams,
    carbGrams: portion.carbGrams,
    fatGrams: portion.fatGrams,
  };
}

function byScoreDesc(left, right) {
  return right.score - left.score
    || right.proteinGrams - left.proteinGrams
    || left.calories - right.calories
    || left.name.localeCompare(right.name);
}

function isUsableFood(food) {
  if (!food || typeof food.id !== 'string' || typeof food.name !== 'string') return false;
  if (typeof food.category !== 'string' || !Array.isArray(food.mealSlots)) return false;
  return ['calories', 'proteinGrams', 'carbGrams', 'fatGrams'].every(
    (key) => Number.isFinite(food[key]) && food[key] >= 0,
  );
}

module.exports = {
  fetchOptimalMealRecommendations,
  allocateSlotCalorieBudgets,
};
