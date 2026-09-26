const { FieldValue } = require('firebase-admin/firestore');
const { bootstrap } = require('../config/bootstrap');
const { getDb } = require('../config/firestore');
const collections = require('../domain/collections');
const { FOOD_CATALOG } = require('../data/foodCatalog');
const { DEMO_PROFILE } = require('../data/demoProfile');
const { calculateDailyMacroNeeds } = require('../services/bmrService');

async function main() {
  bootstrap();
  const db = getDb();
  const targets = calculateDailyMacroNeeds(DEMO_PROFILE);

  await upsertDemoProfile(db, targets);
  await upsertFoods(db);

  console.log(`Seeded profile ${DEMO_PROFILE.id}`);
  console.log(JSON.stringify(targets, null, 2));
  console.log(`Upserted ${FOOD_CATALOG.length} foods`);
}

async function upsertDemoProfile(db, targets) {
  const ref = db.collection(collections.profiles).doc(DEMO_PROFILE.id);
  const snap = await ref.get();
  const metrics = { ...DEMO_PROFILE };
  delete metrics.id;
  const payload = {
    ...metrics,
    targets,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (!snap.exists) payload.createdAt = FieldValue.serverTimestamp();
  await ref.set(payload, { merge: true });
}

async function upsertFoods(db) {
  for (const food of FOOD_CATALOG) {
    const { id, ...nutrition } = food;
    const ref = db.collection(collections.foods).doc(id);
    const snap = await ref.get();
    const payload = {
      ...nutrition,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (!snap.exists) payload.createdAt = FieldValue.serverTimestamp();
    await ref.set(payload, { merge: true });
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
