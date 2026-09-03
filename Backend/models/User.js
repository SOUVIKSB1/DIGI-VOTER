const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // password is optional to support federated (Firebase) users
    password: { type: String },
    role: { type: String, enum: ['voter', 'admin'], default: 'voter' },
    isVerified: { type: Boolean, default: true }, // simple flow; can be extended
    firebaseUid: { type: String, unique: true, sparse: true },
    provider: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);