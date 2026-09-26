const express = require('express');
const profileController = require('../controllers/profileController');
const recommendationController = require('../controllers/recommendationController');
const intakeController = require('../controllers/intakeController');
const {
  requireProfileBody,
  requireProfilePatch,
  requirePathId,
  requireRecommendationQuery,
  requireIntakeQuery,
  requireHistoryQuery,
  requireIntakeBody,
} = require('../middlewares/validateRequest');

const router = express.Router();

router.post('/', requireProfileBody, profileController.createProfile);
router.get('/:profileId', requirePathId('profileId'), profileController.getProfile);
router.patch('/:profileId', requirePathId('profileId'), requireProfilePatch, profileController.updateProfileMetrics);

router.get(
  '/:profileId/recommendations',
  requirePathId('profileId'),
  requireRecommendationQuery,
  recommendationController.getRecommendations,
);

router.get(
  '/:profileId/intake/history',
  requirePathId('profileId'),
  requireHistoryQuery,
  intakeController.getIntakeHistory,
);
router.get(
  '/:profileId/intake',
  requirePathId('profileId'),
  requireIntakeQuery,
  intakeController.getDailyIntake,
);
router.post(
  '/:profileId/intake',
  requirePathId('profileId'),
  requireIntakeBody,
  intakeController.recordIntakeEntry,
);
router.delete(
  '/:profileId/intake/:entryId',
  requirePathId('profileId'),
  requirePathId('entryId'),
  requireIntakeQuery,
  intakeController.removeIntakeEntry,
);

module.exports = router;
