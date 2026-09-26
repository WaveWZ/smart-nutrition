const intakeService = require('../services/intakeService');
const profileService = require('../services/profileService');

async function getIntakeHistory(req, res) {
  await profileService.getProfile(req.params.profileId);
  const history = await intakeService.listIntakeHistory(
    req.params.profileId,
    req.historyQuery.end,
    req.historyQuery.days,
  );
  res.json(history);
}

async function getDailyIntake(req, res) {
  await profileService.getProfile(req.params.profileId);
  const intake = await intakeService.getDailyIntake(req.params.profileId, req.intakeQuery.date);
  res.json(intake);
}

async function recordIntakeEntry(req, res) {
  await profileService.getProfile(req.params.profileId);
  const intake = await intakeService.recordIntakeEntry(req.params.profileId, req.body);
  res.status(201).json(intake);
}

async function removeIntakeEntry(req, res) {
  await profileService.getProfile(req.params.profileId);
  const intake = await intakeService.removeIntakeEntry(
    req.params.profileId,
    req.intakeQuery.date,
    req.params.entryId,
  );
  res.json(intake);
}

module.exports = {
  getDailyIntake,
  getIntakeHistory,
  recordIntakeEntry,
  removeIntakeEntry,
};
