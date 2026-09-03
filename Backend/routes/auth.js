const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.post('/firebase', authCtrl.firebaseLogin);

// Instant role test token generation with unique user identification
router.get('/token', async (req, res) => {
    try {
        const role = req.query.role === 'admin' ? 'admin' : 'voter';
        const email = (req.query.email || (role === 'admin' ? 'souvik@admin.com' : 'voter@digivoter.gov.in')).trim().toLowerCase();
        const name = (req.query.name || (role === 'admin' ? 'Chief Election Admin' : 'Registered Voter')).trim();
        const secret = process.env.JWT_SECRET || 'secret-jwt-key';

        let user = await User.findOne({ email });
        if (!user) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Voter@123', salt);
            user = await User.create({
                name,
                email,
                password: hashedPassword,
                role
            });
        }

        const token = jwt.sign({ id: user._id, role: user.role, email: user.email, name: user.name }, secret, { expiresIn: '30d' });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Token generation error:', err.message);
        const fallbackId = new (require('mongoose').Types.ObjectId)();
        const secret = process.env.JWT_SECRET || 'secret-jwt-key';
        const token = jwt.sign({ id: fallbackId, role: 'voter' }, secret, { expiresIn: '30d' });
        res.json({ token, user: { id: fallbackId, name: 'Voter', role: 'voter' } });
    }
});

module.exports = router;