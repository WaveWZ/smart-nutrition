const test = require('node:test');
const assert = require('node:assert/strict');
const { DEMO_PROFILE } = require('../data/demoProfile');
const { calculateBasalMetabolicRate, calculateDailyMacroNeeds } = require('../services/bmrService');

test('Mifflin-St Jeor matches the 22-year-old male seed profile', () => {
  assert.equal(calculateBasalMetabolicRate(DEMO_PROFILE), 1813.75);

  const needs = calculateDailyMacroNeeds(DEMO_PROFILE);
  assert.deepEqual(needs, {
    bmr: 1814,
    tdee: 2811,
    calories: 2811,
    proteinGrams: 128,
    carbGrams: 379,
    fatGrams: 87,
    calorieFloorApplied: false,
  });

  const energy = needs.proteinGrams * 4 + needs.carbGrams * 4 + needs.fatGrams * 9;
  assert.equal(energy, needs.calories);
});

test('female Mifflin-St Jeor uses the -161 constant', () => {
  const bmr = calculateBasalMetabolicRate({
    gender: 'female',
    weightKg: 65,
    heightCm: 165,
    age: 30,
  });
  assert.equal(bmr, 1370.25);
});

test('fat-loss targets do not drop below BMR', () => {
  const needs = calculateDailyMacroNeeds({
    age: 60,
    gender: 'female',
    weightKg: 45,
    heightCm: 150,
    activityLevel: 'sedentary',
    goal: 'fat_loss',
  });

  assert.equal(needs.calorieFloorApplied, true);
  assert.equal(needs.bmr, 927);
  assert.equal(needs.tdee, 1112);
  assert.equal(needs.calories, 927);
  assert.equal(needs.proteinGrams, 90);
  assert.equal(needs.fatGrams, 27);
  assert.equal(needs.carbGrams, 81);
});

test('macro energy stays on the calorie target for every goal', () => {
  for (const goal of ['fat_loss', 'maintenance', 'muscle_gain']) {
    const needs = calculateDailyMacroNeeds({ ...DEMO_PROFILE, goal });
    const energy = needs.proteinGrams * 4 + needs.carbGrams * 4 + needs.fatGrams * 9;
    assert.ok(Math.abs(energy - needs.calories) <= 8, `${goal} drifted by ${energy - needs.calories}`);
    assert.ok(needs.calories >= needs.bmr);
    assert.ok(needs.carbGrams >= 0);
  }
});

test('protein is scaled down when it cannot fit beside minimum fat', () => {
  const needs = calculateDailyMacroNeeds({
    age: 90,
    gender: 'female',
    weightKg: 300,
    heightCm: 120,
    activityLevel: 'sedentary',
    goal: 'fat_loss',
  });

  assert.ok(needs.proteinGrams < 500);
  assert.ok(needs.carbGrams >= 0);
  assert.ok(needs.fatGrams >= Math.round(300 * 0.6) - 1);
  const energy = needs.proteinGrams * 4 + needs.carbGrams * 4 + needs.fatGrams * 9;
  assert.ok(Math.abs(energy - needs.calories) <= 8);
});
