const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password required' });

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already registered' });

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        const user = await User.create({ name, email, password: hashed, role: 'voter' });
        const token = generateToken(user);

        res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = generateToken(user);
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Accept a Firebase ID token from client, verify it and return/create a backend JWT
exports.firebaseLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ message: 'idToken required' });
        const admin = require('../config/firebaseAdmin');
        // if firebase-admin is not configured, allow a dev fallback when not in production
        if (!admin) {
            if (process.env.NODE_ENV === 'production') return res.status(500).json({ message: 'Firebase admin not configured on server' });
            // development mock mode: accept idToken in the form 'dev:email' or 'dev:uid:email'
            if (typeof idToken === 'string' && idToken.startsWith('dev:')) {
                const parts = idToken.split(':');
                let uid, email, name;
                if (parts.length === 2) { email = parts[1]; uid = 'dev:' + email; }
                else { uid = parts[1]; email = parts[2]; }

                // find existing user
                let user = await User.findOne({ firebaseUid: uid });
                if (!user) user = await User.findOne({ email });
                if (!user) {
                    user = await User.create({ name: name || (email ? email.split('@')[0] : 'dev'), email, role: 'voter', firebaseUid: uid, provider: 'google' });
                } else {
                    if (!user.firebaseUid) { user.firebaseUid = uid; user.provider = user.provider || 'google'; await user.save(); }
                }
                const token = generateToken(user);
                return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
            }
            return res.status(501).json({ message: 'Firebase admin not configured. For local testing send idToken as "dev:you@example.com"' });
        }
        const decoded = await admin.auth().verifyIdToken(idToken);
        // decoded contains uid and email
        const { uid, email, name } = decoded;
        if (!email) return res.status(400).json({ message: 'Firebase token missing email claim' });

        // find user by firebaseUid or email
        let user = await User.findOne({ firebaseUid: uid });
        if (!user) {
            user = await User.findOne({ email });
        }

        if (!user) {
            // create a new backend user mapped to this firebase uid
            user = await User.create({ name: name || email.split('@')[0], email, role: 'voter', firebaseUid: uid, provider: 'google' });
        } else {
            // ensure firebaseUid is set
            if (!user.firebaseUid) { user.firebaseUid = uid; user.provider = user.provider || 'google'; await user.save(); }
        }

        const token = generateToken(user);
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Firebase login failed', err);
        res.status(401).json({ message: 'Firebase login failed: ' + (err.message || err) });
    }
};