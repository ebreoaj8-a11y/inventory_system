
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      required: [true, 'Activity type is required.'],
      enum: {
        values: [
          'new',
          'edit',
          'del',
          'in',
          'out',
          'order'
        ],
        message: 'Invalid activity type.'
      }
    },

    text: {
      type: String,
      required: [true, 'Activity description is required.'],
      trim: true,
      minlength: [
        2,
        'Activity description must have at least 2 characters.'
      ],
      maxlength: [
        500,
        'Activity description cannot exceed 500 characters.'
      ]
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Activity', activitySchema);
