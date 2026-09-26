const express = require('express');
const foodController = require('../controllers/foodController');
const {
  requireFoodBody,
  requireFoodBulkBody,
  requireFoodQuery,
  requirePathId,
} = require('../middlewares/validateRequest');

const router = express.Router();

router.get('/', requireFoodQuery, foodController.listFoods);
router.post('/', requireFoodBody, foodController.ingestFood);
router.post('/bulk', requireFoodBulkBody, foodController.ingestFoods);
router.get('/:foodId', requirePathId('foodId'), foodController.getFood);

module.exports = router;
