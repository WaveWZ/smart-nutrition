const { AppError } = require('../domain/appError');
const {
  ACTIVITY_MULTIPLIERS,
  GOAL_CALORIE_ADJUSTMENTS,
  PROTEIN_GRAMS_PER_KG,
  FAT_ENERGY_SHARE,
  MIN_FAT_GRAMS_PER_KG,
} = require('../domain/nutrition');

function calculateBasalMetabolicRate(profile) {
  // Mifflin–St Jeor (1990): male constant +5, female constant −161.
  const sexConstant = profile.gender === 'male' ? 5 : -161;
  return 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + sexConstant;
}

function reconcileMacros(weightKg, calories, goal) {
  let proteinGrams = Math.round(weightKg * PROTEIN_GRAMS_PER_KG[goal]);
  const minFatGrams = Math.max(1, Math.round(weightKg * MIN_FAT_GRAMS_PER_KG));
  let fatGrams = Math.round((calories * FAT_ENERGY_SHARE[goal]) / 9);
  if (fatGrams < minFatGrams) fatGrams = minFatGrams;

  let carbCalories = calories - proteinGrams * 4 - fatGrams * 9;

  if (carbCalories < 0) {
    const fatCaloriesAboveMinimum = (fatGrams - minFatGrams) * 9;
    if (fatCaloriesAboveMinimum > 0) {
      const reclaim = Math.min(fatCaloriesAboveMinimum, -carbCalories);
      fatGrams -= Math.round(reclaim / 9);
      if (fatGrams < minFatGrams) fatGrams = minFatGrams;
      carbCalories = calories - proteinGrams * 4 - fatGrams * 9;
    }
  }

  // Very large bodies on a calorie floor can prescribe more protein than the
  // budget can hold once minimum fat is reserved. Scale protein down and keep
  // a small carbohydrate allowance so the day still has a usable macro split.
  if (carbCalories < 0) {
    const carbReserveGrams = 20;
    const reservedCalories = fatGrams * 9 + carbReserveGrams * 4;
    const proteinCalories = Math.max(0, calories - reservedCalories);
    proteinGrams = Math.round(proteinCalories / 4);
    carbCalories = calories - proteinGrams * 4 - fatGrams * 9;
  }

  return {
    proteinGrams,
    carbGrams: Math.max(0, Math.round(carbCalories / 4)),
    fatGrams,
  };
}

function calculateDailyMacroNeeds(profile) {
  const multiplier = ACTIVITY_MULTIPLIERS[profile.activityLevel];
  const adjustment = GOAL_CALORIE_ADJUSTMENTS[profile.goal];

  if (multiplier === undefined || adjustment === undefined) {
    throw new AppError(400, 'validation_error', 'Activity level or goal is not supported');
  }

  if (!['male', 'female'].includes(profile.gender)) {
    throw new AppError(400, 'validation_error', 'Gender must be male or female');
  }

  const bmr = calculateBasalMetabolicRate(profile);
  const tdee = bmr * multiplier;
  const proposedCalories = tdee + adjustment;
  const calorieFloorApplied = proposedCalories < bmr;
  const calories = Math.round(Math.max(bmr, proposedCalories));
  const macros = reconcileMacros(profile.weightKg, calories, profile.goal);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories,
    ...macros,
    calorieFloorApplied,
  };
}

module.exports = {
  calculateBasalMetabolicRate,
  calculateDailyMacroNeeds,
};
