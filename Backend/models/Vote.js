// models/Vote.js
const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    voter: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    election: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Election', 
        required: true 
    },
    candidate: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Candidate', 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// **IMPORTANT:** This prevents a user from voting more than once in the same election
voteSchema.index({ voter: 1, election: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);