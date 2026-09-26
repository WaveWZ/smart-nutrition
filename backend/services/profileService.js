const { FieldValue } = require('firebase-admin/firestore');
const { getDb } = require('../config/firestore');
const collections = require('../domain/collections');
const { AppError } = require('../domain/appError');
const { calculateDailyMacroNeeds } = require('./bmrService');

const TARGET_FIELDS = ['bmr', 'tdee', 'calories', 'proteinGrams', 'carbGrams', 'fatGrams'];

async function createProfile(input) {
  const profileId = input.id;
  const metrics = { ...input };
  delete metrics.id;
  const targets = calculateDailyMacroNeeds(metrics);
  const profiles = getDb().collection(collections.profiles);
  const ref = profileId ? profiles.doc(profileId) : profiles.doc();

  if (profileId) {
    const existing = await ref.get();
    if (existing.exists) {
      throw new AppError(409, 'profile_exists', 'A profile already exists for this account');
    }
  }

  const now = FieldValue.serverTimestamp();

  await ref.set({
    displayName: metrics.displayName || 'Unnamed profile',
    age: metrics.age,
    gender: metrics.gender,
    weightKg: metrics.weightKg,
    heightCm: metrics.heightCm,
    activityLevel: metrics.activityLevel,
    goal: metrics.goal,
    targets,
    createdAt: now,
    updatedAt: now,
  });

  const saved = await ref.get();
  return serializeProfile(saved);
}

async function getProfile(profileId) {
  const ref = getDb().collection(collections.profiles).doc(profileId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new AppError(404, 'profile_not_found', 'Profile was not found');
  }

  if (!targetsLookValid(snap.get('targets'))) {
    const targets = calculateDailyMacroNeeds(snap.data());
    await ref.set({ targets, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    const refreshed = await ref.get();
    return serializeProfile(refreshed);
  }

  return serializeProfile(snap);
}

async function updateProfileMetrics(profileId, patch) {
  const ref = getDb().collection(collections.profiles).doc(profileId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new AppError(404, 'profile_not_found', 'Profile was not found');
  }

  const current = snap.data();
  const next = {
    displayName: patch.displayName ?? current.displayName,
    age: patch.age ?? current.age,
    gender: patch.gender ?? current.gender,
    weightKg: patch.weightKg ?? current.weightKg,
    heightCm: patch.heightCm ?? current.heightCm,
    activityLevel: patch.activityLevel ?? current.activityLevel,
    goal: patch.goal ?? current.goal,
  };

  const targets = calculateDailyMacroNeeds(next);
  await ref.set(
    {
      ...next,
      targets,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const saved = await ref.get();
  return serializeProfile(saved);
}

function targetsLookValid(targets) {
  return Boolean(targets) && TARGET_FIELDS.every((field) => Number.isFinite(targets[field]));
}

function serializeProfile(snap) {
  const data = snap.data();
  return {
    id: snap.id,
    displayName: data.displayName,
    age: data.age,
    gender: data.gender,
    weightKg: data.weightKg,
    heightCm: data.heightCm,
    activityLevel: data.activityLevel,
    goal: data.goal,
    targets: data.targets,
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
  createProfile,
  getProfile,
  updateProfileMetrics,
};
