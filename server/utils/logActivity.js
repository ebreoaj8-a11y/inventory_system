
const Activity = require('../models/Activity');

// SAVE ACTIVITY TO DATABASE
async function logActivity(kind, text) {
  const activity = await Activity.create({
    kind,
    text
  });

  return activity;
}

module.exports = logActivity;
