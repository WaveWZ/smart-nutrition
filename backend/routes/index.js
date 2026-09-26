const express = require('express');
const profileRoutes = require('./profileRoutes');
const foodRoutes = require('./foodRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'smart-nutrition-recommend' });
});

router.use('/profiles', profileRoutes);
router.use('/foods', foodRoutes);

module.exports = router;
