const mongoose = require('mongoose');

const activitySchema = mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Can be null if action is from system (like lead creation from public site)
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
