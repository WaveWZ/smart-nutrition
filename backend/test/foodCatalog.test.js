const test = require('node:test');
const assert = require('node:assert/strict');
const { FOOD_CATALOG } = require('../data/foodCatalog');
const { isEnergyConsistent, MEAL_SLOTS, FOOD_CATEGORIES } = require('../domain/nutrition');

test('catalog ids are unique and every food can be ingested', () => {
  const ids = new Set(FOOD_CATALOG.map((food) => food.id));
  assert.equal(ids.size, FOOD_CATALOG.length);
  assert.ok(FOOD_CATALOG.length >= 40);

  for (const food of FOOD_CATALOG) {
    assert.equal(typeof food.name, 'string');
    assert.ok(FOOD_CATEGORIES.includes(food.category), food.name);
    assert.ok(food.mealSlots.length > 0, food.name);
    assert.ok(food.mealSlots.every((slot) => MEAL_SLOTS.includes(slot)), food.name);
    assert.ok(isEnergyConsistent(food), `${food.name} calories do not match its macros`);
  }
});
