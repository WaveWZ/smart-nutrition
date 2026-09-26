const foodService = require('../services/foodService');

async function ingestFood(req, res) {
  const food = await foodService.ingestFood(req.body);
  res.status(201).json(food);
}

async function ingestFoods(req, res) {
  const foods = await foodService.ingestFoods(req.body.items);
  res.status(201).json(foods);
}

async function getFood(req, res) {
  const food = await foodService.getFoodById(req.params.foodId);
  res.json(food);
}

async function listFoods(req, res) {
  const foods = await foodService.searchFoods(req.foodQuery);
  res.json(foods);
}

module.exports = {
  ingestFood,
  ingestFoods,
  getFood,
  listFoods,
};
