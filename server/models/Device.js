const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  voltage: {
    type: Number,
    required: true
  },
  current: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['ON', 'OFF'],
    default: 'OFF'
  },
  lastTurnedOn: {
    type: Date,
    default: null
  },
  autoOffThreshold: { type: Number, default: 0 }, // in minutes, 0 means disabled
  schedule: {
    startTime: { type: String, default: "" }, // "HH:mm" 
    endTime: { type: String, default: "" },   // "HH:mm"
    enabled: { type: Boolean, default: false }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);
