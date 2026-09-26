const MACRO_KEYS = Object.freeze(['calories', 'proteinGrams', 'carbGrams', 'fatGrams']);

function roundTo(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function emptyMacros() {
  return {
    calories: 0,
    proteinGrams: 0,
    carbGrams: 0,
    fatGrams: 0,
  };
}

function roundMacros(macros) {
  return {
    calories: Math.round(macros.calories),
    proteinGrams: roundTo(macros.proteinGrams, 1),
    carbGrams: roundTo(macros.carbGrams, 1),
    fatGrams: roundTo(macros.fatGrams, 1),
  };
}

function remainingMacros(targets, consumed = {}) {
  const remaining = {};
  for (const key of MACRO_KEYS) {
    remaining[key] = Math.max(0, (targets[key] || 0) - (consumed[key] || 0));
  }
  return remaining;
}

function subtractMacros(base, portion) {
  const next = {};
  for (const key of MACRO_KEYS) {
    next[key] = Math.max(0, base[key] - (portion[key] || 0));
  }
  return next;
}

function addMacros(base, portion) {
  const next = {};
  for (const key of MACRO_KEYS) {
    next[key] = (base[key] || 0) + (portion[key] || 0);
  }
  return next;
}

function scaleMacrosToCalories(source, calories) {
  const ratio = source.calories > 0 ? calories / source.calories : 0;
  return {
    calories,
    proteinGrams: source.proteinGrams * ratio,
    carbGrams: source.carbGrams * ratio,
    fatGrams: source.fatGrams * ratio,
  };
}

function sumMacros(portions) {
  return roundMacros(portions.reduce((total, portion) => addMacros(total, portion), emptyMacros()));
}

module.exports = {
  MACRO_KEYS,
  roundTo,
  emptyMacros,
  roundMacros,
  remainingMacros,
  subtractMacros,
  addMacros,
  scaleMacrosToCalories,
  sumMacros,
};
