const profileService = require('../services/profileService');

async function createProfile(req, res) {
  const profile = await profileService.createProfile(req.body);
  res.status(201).json(profile);
}

async function getProfile(req, res) {
  const profile = await profileService.getProfile(req.params.profileId);
  res.json(profile);
}

async function updateProfileMetrics(req, res) {
  const profile = await profileService.updateProfileMetrics(req.params.profileId, req.body);
  res.json(profile);
}

module.exports = {
  createProfile,
  getProfile,
  updateProfileMetrics,
};
