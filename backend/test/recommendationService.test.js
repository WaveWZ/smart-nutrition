const test = require('node:test');
const assert = require('node:assert/strict');
const {
  fetchOptimalMealRecommendations,
  allocateSlotCalorieBudgets,
} = require('../services/recommendationService');

const foods = [
  {
    id: 'chicken',
    name: 'Grilled chicken breast',
    cuisine: 'western',
    category: 'protein',
    mealSlots: ['lunch', 'dinner'],
    servingLabel: '150 g',
    calories: 248,
    proteinGrams: 46,
    carbGrams: 0,
    fatGrams: 5,
  },
  {
    id: 'rice',
    name: 'Brown rice',
    cuisine: 'global',
    category: 'carbohydrate',
    mealSlots: ['lunch', 'dinner'],
    servingLabel: '200 g',
    calories: 246,
    proteinGrams: 5,
    carbGrams: 51,
    fatGrams: 2,
  },
  {
    id: 'oil',
    name: 'Olive oil',
    cuisine: 'mediterranean',
    category: 'fat',
    mealSlots: ['lunch', 'dinner'],
    servingLabel: '15 ml',
    calories: 119,
    proteinGrams: 0,
    carbGrams: 0,
    fatGrams: 13.5,
  },
  {
    id: 'broccoli',
    name: 'Steamed broccoli',
    cuisine: 'western',
    category: 'vegetable',
    mealSlots: ['lunch', 'dinner'],
    servingLabel: '150 g',
    calories: 52,
    proteinGrams: 3.6,
    carbGrams: 11,
    fatGrams: 0.6,
  },
  {
    id: 'feast',
    name: 'Feast platter',
    cuisine: 'global',
    category: 'mixed',
    mealSlots: ['dinner'],
    servingLabel: '1 platter',
    calories: 900,
    proteinGrams: 40,
    carbGrams: 80,
    fatGrams: 35,
  },
];

const targets = {
  bmr: 1800,
  tdee: 2200,
  calories: 2200,
  proteinGrams: 150,
  carbGrams: 200,
  fatGrams: 60,
};

test('open protein deficit ranks chicken ahead of fat and starch', () => {
  const result = fetchOptimalMealRecommendations({
    targets,
    consumed: {
      calories: 1800,
      proteinGrams: 40,
      carbGrams: 190,
      fatGrams: 55,
    },
    foods,
    mealSlot: 'lunch',
  });

  assert.equal(result.status, 'ok');
  assert.equal(result.remaining.proteinGrams, 110);
  assert.equal(result.foods[0].foodId, 'chicken');
  assert.ok(result.foods[0].score > result.foods.find((food) => food.foodId === 'oil')?.score || !result.foods.some((food) => food.foodId === 'oil'));
  assert.ok(result.meals.some((meal) => meal.items.some((item) => item.foodId === 'chicken')));
  assert.ok(result.meals.every((meal) => meal.mealSlot === 'lunch'));
});

test('a single portion that blows the calorie budget is left out', () => {
  const result = fetchOptimalMealRecommendations({
    targets,
    consumed: {
      calories: 2050,
      proteinGrams: 80,
      carbGrams: 150,
      fatGrams: 40,
    },
    foods,
    mealSlot: 'dinner',
  });

  assert.ok(!result.foods.some((food) => food.foodId === 'feast'));
});

test('finished days do not keep recommending food', () => {
  const result = fetchOptimalMealRecommendations({
    targets,
    consumed: {
      calories: 2180,
      proteinGrams: 150,
      carbGrams: 200,
      fatGrams: 60,
    },
    foods,
  });

  assert.equal(result.status, 'targets_met');
  assert.deepEqual(result.foods, []);
  assert.deepEqual(result.meals, []);
});

test('a full-day plan stays inside the calories still available', () => {
  const consumed = {
    calories: 1800,
    proteinGrams: 40,
    carbGrams: 190,
    fatGrams: 55,
  };
  const result = fetchOptimalMealRecommendations({ targets, consumed, foods });
  const planned = result.meals.reduce((sum, meal) => sum + meal.calories, 0);

  assert.ok(result.meals.length >= 1);
  assert.ok(planned <= result.remaining.calories + 40);
});

test('slot budgets cover the remaining calories without reopening a finished meal', () => {
  const budgets = allocateSlotCalorieBudgets(2800, 2100, {
    breakfast: { calories: 700 },
  });

  assert.deepEqual(budgets.map((slot) => slot.slot), ['lunch', 'dinner', 'snack']);
  const sum = budgets.reduce((total, slot) => total + slot.calories, 0);
  assert.ok(Math.abs(sum - 2100) < 0.001);
});
