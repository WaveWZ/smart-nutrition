const { randomUUID } = require('crypto');
const { FieldValue } = require('firebase-admin/firestore');
const { getDb } = require('../config/firestore');
const collections = require('../domain/collections');
const { AppError } = require('../domain/appError');
const { MEAL_SLOTS } = require('../domain/nutrition');
const { emptyMacros, addMacros, roundMacros, roundTo } = require('../domain/macros');
const { getFoodById } = require('./foodService');

async function listIntakeHistory(profileId, endDate, dayCount) {
  const dates = [];
  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    dates.push(shiftIsoDate(endDate, -offset));
  }

  const days = await Promise.all(dates.map(async (date) => {
    const snap = await intakeRef(profileId, date).get();
    if (!snap.exists) return emptyDay(profileId, date);
    return serializeIntake(snap);
  }));

  return { profileId, endDate, days };
}

async function getDailyIntake(profileId, date) {
  const snap = await intakeRef(profileId, date).get();
  if (!snap.exists) return emptyDay(profileId, date);
  return serializeIntake(snap);
}

async function recordIntakeEntry(profileId, input) {
  const food = await getFoodById(input.foodId);
  const ref = intakeRef(profileId, input.date);

  const entry = {
    id: randomUUID(),
    foodId: food.id,
    name: food.name,
    mealSlot: input.mealSlot,
    servings: input.servings,
    servingLabel: food.servingLabel,
    calories: Math.round(food.calories * input.servings),
    proteinGrams: roundTo(food.proteinGrams * input.servings, 1),
    carbGrams: roundTo(food.carbGrams * input.servings, 1),
    fatGrams: roundTo(food.fatGrams * input.servings, 1),
    loggedAt: new Date().toISOString(),
  };

  await getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const entries = snap.exists ? [...(snap.get('entries') || []), entry] : [entry];
    const payload = {
      profileId,
      date: input.date,
      entries,
      ...summarizeEntries(entries),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!snap.exists) payload.createdAt = FieldValue.serverTimestamp();
    tx.set(ref, payload, { merge: true });
  });

  const saved = await ref.get();
  return serializeIntake(saved);
}

async function removeIntakeEntry(profileId, date, entryId) {
  const ref = intakeRef(profileId, date);

  let removed = false;
  await getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;

    const entries = (snap.get('entries') || []).filter((entry) => entry.id !== entryId);
    removed = entries.length !== (snap.get('entries') || []).length;
    if (!removed) return;

    tx.set(ref, {
      entries,
      ...summarizeEntries(entries),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  const snap = await ref.get();
  if (!snap.exists || !removed) {
    throw new AppError(404, 'intake_entry_not_found', 'Intake entry was not found');
  }

  return serializeIntake(snap);
}

function shiftIsoDate(isoDate, deltaDays) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
}

function intakeRef(profileId, date) {
  return getDb().collection(collections.dailyIntakes).doc(`${profileId}_${date}`);
}

function summarizeEntries(entries) {
  const totalsBySlot = {};
  for (const slot of MEAL_SLOTS) totalsBySlot[slot] = emptyMacros();

  let totals = emptyMacros();
  for (const entry of entries) {
    totals = addMacros(totals, entry);
    totalsBySlot[entry.mealSlot] = addMacros(totalsBySlot[entry.mealSlot], entry);
  }

  return {
    totals: roundMacros(totals),
    totalsBySlot: Object.fromEntries(
      Object.entries(totalsBySlot).map(([slot, macros]) => [slot, roundMacros(macros)]),
    ),
  };
}

function emptyDay(profileId, date) {
  const summary = summarizeEntries([]);
  return {
    id: `${profileId}_${date}`,
    profileId,
    date,
    entries: [],
    ...summary,
    createdAt: null,
    updatedAt: null,
  };
}

function serializeIntake(snap) {
  const data = snap.data();
  return {
    id: snap.id,
    profileId: data.profileId,
    date: data.date,
    entries: data.entries || [],
    totals: data.totals,
    totalsBySlot: data.totalsBySlot,
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
  getDailyIntake,
  listIntakeHistory,
  recordIntakeEntry,
  removeIntakeEntry,
};
