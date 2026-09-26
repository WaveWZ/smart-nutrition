const ACTIVITY_MULTIPLIERS = Object.freeze({
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
});

const GOAL_CALORIE_ADJUSTMENTS = Object.freeze({
  fat_loss: -500,
  maintenance: 0,
  muscle_gain: 300,
});

const PROTEIN_GRAMS_PER_KG = Object.freeze({
  fat_loss: 2,
  maintenance: 1.6,
  muscle_gain: 1.8,
});

const FAT_ENERGY_SHARE = Object.freeze({
  fat_loss: 0.25,
  maintenance: 0.28,
  muscle_gain: 0.25,
});

const MEAL_SLOTS = Object.freeze(['breakfast', 'lunch', 'dinner', 'snack']);

const SLOT_ENERGY_SHARE = Object.freeze({
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
});

const FOOD_CATEGORIES = Object.freeze([
  'protein',
  'carbohydrate',
  'fat',
  'vegetable',
  'fruit',
  'dairy',
  'mixed',
]);

const MIN_FAT_GRAMS_PER_KG = 0.6;

function isEnergyConsistent(food) {
  const predicted = food.proteinGrams * 4 + food.carbGrams * 4 + food.fatGrams * 9;
  const tolerance = Math.max(30, food.calories * 0.15);
  return Math.abs(predicted - food.calories) <= tolerance;
}

module.exports = {
  ACTIVITY_MULTIPLIERS,
  GOAL_CALORIE_ADJUSTMENTS,
  PROTEIN_GRAMS_PER_KG,
  FAT_ENERGY_SHARE,
  MEAL_SLOTS,
  SLOT_ENERGY_SHARE,
  FOOD_CATEGORIES,
  MIN_FAT_GRAMS_PER_KG,
  isEnergyConsistent,
};
