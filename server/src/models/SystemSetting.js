const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['general', 'security', 'notifications'],
      required: true
    },
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    label: {
      type: String,
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    description: {
      type: String
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

systemSettingSchema.index({ category: 1, key: 1 });

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
