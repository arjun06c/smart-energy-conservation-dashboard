const mongoose = require('mongoose');

const energyUsageSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  energyKwh: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('EnergyUsage', energyUsageSchema);
