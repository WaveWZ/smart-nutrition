const { FieldValue } = require('firebase-admin/firestore');
const { getDb } = require('../config/firestore');
const collections = require('../domain/collections');
const { AppError } = require('../domain/appError');

async function ingestFood(input) {
  const ref = getDb().collection(collections.foods).doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({
    ...foodFields(input),
    createdAt: now,
    updatedAt: now,
  });
  const saved = await ref.get();
  return serializeFood(saved);
}

async function ingestFoods(items) {
  const created = [];
  for (const item of items) {
    created.push(await ingestFood(item));
  }
  return created;
}

async function getFoodById(foodId) {
  const snap = await getDb().collection(collections.foods).doc(foodId).get();
  if (!snap.exists) {
    throw new AppError(404, 'food_not_found', 'Food was not found');
  }
  return serializeFood(snap);
}

async function listAllFoods() {
  const snap = await getDb().collection(collections.foods).limit(1000).get();
  return snap.docs.map(serializeFood);
}

async function searchFoods({ query = '', cuisine, category, mealSlot, limit = 50 }) {
  const foods = await listAllFoods();
  const needle = query.trim().toLowerCase();

  return foods
    .filter((food) => {
      if (needle) {
        const haystack = `${food.name} ${food.cuisine}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (cuisine && food.cuisine !== cuisine) return false;
      if (category && food.category !== category) return false;
      if (mealSlot && !food.mealSlots.includes(mealSlot)) return false;
      return true;
    })
    .slice(0, limit);
}

function foodFields(input) {
  return {
    name: input.name,
    cuisine: input.cuisine,
    category: input.category,
    mealSlots: input.mealSlots,
    servingLabel: input.servingLabel,
    servingGrams: input.servingGrams,
    calories: input.calories,
    proteinGrams: input.proteinGrams,
    carbGrams: input.carbGrams,
    fatGrams: input.fatGrams,
    fiberGrams: input.fiberGrams,
  };
}

function serializeFood(snap) {
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name,
    cuisine: data.cuisine,
    category: data.category,
    mealSlots: data.mealSlots || [],
    servingLabel: data.servingLabel,
    servingGrams: data.servingGrams ?? null,
    calories: data.calories,
    proteinGrams: data.proteinGrams,
    carbGrams: data.carbGrams,
    fatGrams: data.fatGrams,
    fiberGrams: data.fiberGrams ?? 0,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

function toIso(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  return value;
}

module.exports = {
  ingestFood,
  ingestFoods,
  getFoodById,
  listAllFoods,
  searchFoods,
};
