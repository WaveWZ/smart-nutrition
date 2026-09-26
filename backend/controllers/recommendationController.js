const profileService = require('../services/profileService');
const foodService = require('../services/foodService');
const intakeService = require('../services/intakeService');
const { fetchOptimalMealRecommendations } = require('../services/recommendationService');

async function getRecommendations(req, res) {
  const { profileId } = req.params;
  const { date, mealSlot, limit } = req.recommendationQuery;

  const [profile, intake, foods] = await Promise.all([
    profileService.getProfile(profileId),
    intakeService.getDailyIntake(profileId, date),
    foodService.listAllFoods(),
  ]);

  const recommendation = fetchOptimalMealRecommendations({
    targets: profile.targets,
    consumed: intake.totals,
    consumedBySlot: intake.totalsBySlot,
    foods,
    mealSlot,
    limit,
  });

  res.json({
    profileId,
    date,
    mealSlot,
    targets: profile.targets,
    consumed: intake.totals,
    ...recommendation,
  });
}

module.exports = { getRecommendations };
