const { AppError } = require('../domain/appError');
const {
  ACTIVITY_MULTIPLIERS,
  GOAL_CALORIE_ADJUSTMENTS,
  MEAL_SLOTS,
  FOOD_CATEGORIES,
  isEnergyConsistent,
} = require('../domain/nutrition');

const ACTIVITY_LEVELS = Object.keys(ACTIVITY_MULTIPLIERS);
const GOALS = Object.keys(GOAL_CALORIE_ADJUSTMENTS);
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

function requireProfileBody(req, res, next) {
  req.body = parseProfilePayload(req.body, { partial: false });
  next();
}

function requireProfilePatch(req, res, next) {
  req.body = parseProfilePayload(req.body, { partial: true });
  next();
}

function requireFoodBody(req, res, next) {
  req.body = parseFoodPayload(req.body);
  next();
}

function requireFoodBulkBody(req, res, next) {
  const body = expectObject(req.body);
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 100) {
    throw new AppError(400, 'validation_error', 'items must be an array of 1 to 100 foods');
  }
  req.body = { items: body.items.map((item) => parseFoodPayload(item)) };
  next();
}

function requireIntakeBody(req, res, next) {
  const body = expectObject(req.body);
  const errors = [];
  const foodId = readId(body.foodId, 'foodId', errors);
  const date = readIsoDate(body.date, 'date', errors, { required: true });
  const mealSlot = readMealSlot(body.mealSlot, errors, { required: true });
  const servings = readNumber(body.servings, 'servings', errors, { min: 0.25, max: 5, decimals: 2 });

  if (errors.length > 0) {
    throw new AppError(400, 'validation_error', 'Intake payload is invalid', errors);
  }

  req.body = { foodId, date, mealSlot, servings };
  next();
}

function requireRecommendationQuery(req, res, next) {
  req.recommendationQuery = {
    date: readRequiredQueryDate(req.query.date),
    mealSlot: readOptionalQueryMealSlot(req.query.mealSlot),
    limit: readLimit(req.query.limit, 8, 20),
  };
  next();
}

function requireIntakeQuery(req, res, next) {
  req.intakeQuery = { date: readRequiredQueryDate(req.query.date) };
  next();
}

function requireHistoryQuery(req, res, next) {
  const end = single(req.query.end, 'end');
  if (!isIsoDate(end)) {
    throw new AppError(400, 'invalid_date', 'end must use YYYY-MM-DD in the user\'s local calendar');
  }
  req.historyQuery = {
    end,
    days: readLimit(req.query.days, 14, 60),
  };
  next();
}

function requireFoodQuery(req, res, next) {
  const errors = [];
  const query = readOptionalString(single(req.query.q, 'q'), 'q', errors, { max: 80 }) || '';
  const cuisine = readOptionalString(single(req.query.cuisine, 'cuisine'), 'cuisine', errors, { max: 40 });
  const category = readOptionalEnum(
    single(req.query.category, 'category'),
    'category',
    FOOD_CATEGORIES,
    errors,
  );
  const mealSlot = readOptionalEnum(
    single(req.query.mealSlot, 'mealSlot'),
    'mealSlot',
    MEAL_SLOTS,
    errors,
  );

  if (errors.length > 0) {
    throw new AppError(400, 'validation_error', 'Food query is invalid', errors);
  }

  req.foodQuery = {
    query,
    cuisine: cuisine || null,
    category: category || null,
    mealSlot: mealSlot || null,
    limit: readLimit(req.query.limit, 50, 100),
  };
  next();
}

function requirePathId(paramName) {
  return (req, res, next) => {
    if (!ID_PATTERN.test(req.params[paramName] || '')) {
      next(new AppError(400, 'invalid_id', `${paramName} is invalid`));
      return;
    }
    next();
  };
}

function parseProfilePayload(body, { partial }) {
  const source = expectObject(body);
  const errors = [];
  const value = {};

  if (!partial || Object.hasOwn(source, 'displayName')) {
    const displayName = readOptionalString(source.displayName, 'displayName', errors, { max: 80 });
    if (displayName) value.displayName = displayName;
  }

  if (!partial && Object.hasOwn(source, 'id')) {
    const id = readId(source.id, 'id', errors);
    if (id) value.id = id;
  }

  assignNumber(value, source, 'age', errors, { min: 16, max: 90, decimals: 0, integer: true, partial });
  assignEnum(value, source, 'gender', ['male', 'female'], errors, { partial });
  assignNumber(value, source, 'weightKg', errors, { min: 35, max: 300, decimals: 1, partial });
  assignNumber(value, source, 'heightCm', errors, { min: 120, max: 230, decimals: 1, partial });
  assignEnum(value, source, 'activityLevel', ACTIVITY_LEVELS, errors, { partial });
  assignEnum(value, source, 'goal', GOALS, errors, { partial });

  if (partial && Object.keys(value).length === 0) {
    errors.push('Provide at least one profile field to update');
  }

  if (errors.length > 0) {
    throw new AppError(400, 'validation_error', 'Profile payload is invalid', errors);
  }

  return value;
}

function parseFoodPayload(body) {
  const source = expectObject(body);
  const errors = [];
  const name = readRequiredString(source.name, 'name', errors, { min: 2, max: 100 });
  const cuisine = readRequiredString(source.cuisine, 'cuisine', errors, { min: 2, max: 40 });
  const servingLabel = readRequiredString(source.servingLabel, 'servingLabel', errors, { min: 1, max: 80 });
  const category = readRequiredEnum(source.category, 'category', FOOD_CATEGORIES, errors);
  const mealSlots = readMealSlots(source.mealSlots, errors);
  const calories = readNumber(source.calories, 'calories', errors, { min: 0, max: 2000, decimals: 0, integer: true });
  const proteinGrams = readNumber(source.proteinGrams, 'proteinGrams', errors, { min: 0, max: 200, decimals: 1 });
  const carbGrams = readNumber(source.carbGrams, 'carbGrams', errors, { min: 0, max: 300, decimals: 1 });
  const fatGrams = readNumber(source.fatGrams, 'fatGrams', errors, { min: 0, max: 200, decimals: 1 });
  const fiberGrams = source.fiberGrams === undefined
    ? 0
    : readNumber(source.fiberGrams, 'fiberGrams', errors, { min: 0, max: 80, decimals: 1 });
  const servingGrams = source.servingGrams === undefined || source.servingGrams === null
    ? null
    : readNumber(source.servingGrams, 'servingGrams', errors, { min: 1, max: 2000, decimals: 0, integer: true });

  const food = {
    name,
    cuisine,
    category,
    mealSlots,
    servingLabel,
    servingGrams,
    calories,
    proteinGrams,
    carbGrams,
    fatGrams,
    fiberGrams,
  };

  if (errors.length === 0 && !isEnergyConsistent(food)) {
    errors.push(`${name}: calories are inconsistent with protein, carbohydrate, and fat`);
  }

  if (errors.length > 0) {
    throw new AppError(400, 'validation_error', 'Food payload is invalid', errors);
  }

  return food;
}

function assignNumber(target, source, field, errors, options) {
  if (options.partial && !Object.hasOwn(source, field)) return;
  target[field] = readNumber(source[field], field, errors, options);
}

function assignEnum(target, source, field, allowed, errors, { partial }) {
  if (partial && !Object.hasOwn(source, field)) return;
  target[field] = readRequiredEnum(source[field], field, allowed, errors);
}

function expectObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(400, 'validation_error', 'Request body must be a JSON object');
  }
  return body;
}

function readNumber(value, field, errors, { min, max, decimals, integer = false }) {
  if (typeof value === 'string' && value.trim() !== '') value = Number(value);
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    errors.push(`${field} must be a number`);
    return undefined;
  }
  if (integer && !Number.isInteger(value)) {
    errors.push(`${field} must be an integer`);
    return undefined;
  }
  if (value < min || value > max) {
    errors.push(`${field} must be between ${min} and ${max}`);
    return undefined;
  }

  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  if (Math.abs(rounded - value) > 1e-8) {
    errors.push(`${field} supports at most ${decimals} decimal place${decimals === 1 ? '' : 's'}`);
    return undefined;
  }
  return rounded;
}

function readRequiredString(value, field, errors, { min, max }) {
  if (typeof value !== 'string') {
    errors.push(`${field} must be a string`);
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    errors.push(`${field} must be ${min}-${max} characters`);
    return undefined;
  }
  return trimmed;
}

function readOptionalString(value, field, errors, { max }) {
  if (value === undefined || value === null || value === '') return undefined;
  return readRequiredString(value, field, errors, { min: 1, max });
}

function readRequiredEnum(value, field, allowed, errors) {
  if (!allowed.includes(value)) {
    errors.push(`${field} must be one of: ${allowed.join(', ')}`);
    return undefined;
  }
  return value;
}

function readOptionalEnum(value, field, allowed, errors) {
  if (value === undefined || value === null || value === '') return undefined;
  return readRequiredEnum(value, field, allowed, errors);
}

function readMealSlots(value, errors) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`mealSlots must include at least one of: ${MEAL_SLOTS.join(', ')}`);
    return undefined;
  }
  const unique = [...new Set(value)];
  if (unique.some((slot) => !MEAL_SLOTS.includes(slot))) {
    errors.push(`mealSlots must include at least one of: ${MEAL_SLOTS.join(', ')}`);
    return undefined;
  }
  return unique;
}

function readId(value, field, errors) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    errors.push(`${field} is invalid`);
    return undefined;
  }
  return value;
}

function readIsoDate(value, field, errors, { required }) {
  if ((value === undefined || value === null || value === '') && !required) return undefined;
  if (typeof value !== 'string' || !isIsoDate(value)) {
    errors.push(`${field} must use YYYY-MM-DD`);
    return undefined;
  }
  return value;
}

function readMealSlot(value, errors, { required }) {
  if ((value === undefined || value === null || value === '') && !required) return undefined;
  if (!MEAL_SLOTS.includes(value)) {
    errors.push(`mealSlot must be one of: ${MEAL_SLOTS.join(', ')}`);
    return undefined;
  }
  return value;
}

function readRequiredQueryDate(value) {
  const date = single(value, 'date');
  if (!isIsoDate(date)) {
    throw new AppError(400, 'invalid_date', 'date must use YYYY-MM-DD in the user\'s local calendar');
  }
  return date;
}

function readOptionalQueryMealSlot(value) {
  const slot = single(value, 'mealSlot');
  if (slot === undefined || slot === '') return null;
  if (!MEAL_SLOTS.includes(slot)) {
    throw new AppError(400, 'invalid_meal_slot', `mealSlot must be one of: ${MEAL_SLOTS.join(', ')}`);
  }
  return slot;
}

function readLimit(value, fallback, max) {
  const raw = single(value, 'limit');
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
    throw new AppError(400, 'validation_error', `limit must be an integer from 1 to ${max}`);
  }
  return parsed;
}

function single(value, name) {
  if (Array.isArray(value)) {
    throw new AppError(400, 'validation_error', `${name} must be a single value`);
  }
  return value;
}

function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

module.exports = {
  requireProfileBody,
  requireProfilePatch,
  requireFoodBody,
  requireFoodBulkBody,
  requireIntakeBody,
  requireRecommendationQuery,
  requireIntakeQuery,
  requireHistoryQuery,
  requireFoodQuery,
  requirePathId,
};
