const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const jwt = require('jsonwebtoken');

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.post('/firebase', authCtrl.firebaseLogin);

// Instant role test token generation without credentials
router.get('/token', (req, res) => {
    const role = req.query.role === 'admin' ? 'admin' : 'voter';
    const secret = process.env.JWT_SECRET || 'secret-jwt-key';
    const user = {
        id: role === 'admin' ? '64b0f0000000000000000001' : '64b0f0000000000000000002',
        name: role === 'admin' ? 'Chief Election Admin' : 'Souvik (Voter)',
        email: role === 'admin' ? 'rajarshighs1@gmail.com' : 'voter@bharatvote.in',
        role: role
    };
    const token = jwt.sign(user, secret, { expiresIn: '30d' });
    res.json({ token, user });
});

module.exports = router;