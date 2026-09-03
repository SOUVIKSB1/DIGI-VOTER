const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  party: { type: String },
  election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Candidate', candidateSchema);