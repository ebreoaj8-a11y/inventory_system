
const express = require('express');
const Activity = require('../models/Activity');

const router = express.Router();

// GET RECENT ACTIVITIES
router.get('/', async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json(activities);
  } catch (error) {
    console.error(
      'Failed to fetch activities:',
      error.message
    );

    return res.status(500).json({
      message: 'Unable to load recent activities.'
    });
  }
});

module.exports = router;
