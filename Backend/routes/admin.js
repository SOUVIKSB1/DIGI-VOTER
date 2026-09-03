const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const User = require('../models/User');
const Vote = require('../models/Vote');
// const Election = require('../models/Election'); // Not needed in this file

// Get all voters
router.get('/voters', auth, role('admin'), async (req, res) => {
  try {
    const voters = await User.find({ role: 'voter' }).select('-password');
    res.json(voters);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// View votes
router.get('/votes', auth, role('admin'), async (req, res) => {
  try {
    const votes = await Vote.find().populate('voter candidate election');
    res.json(votes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a voter
router.delete('/voter/:id', auth, role('admin'), async (req, res) => {
  try {
    const voter = await User.findByIdAndDelete(req.params.id);
    if (!voter) return res.status(404).json({ message: 'Voter not found' });
    res.json({ message: 'Voter deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete voter', error: err.message });
  }
});

// Admin analytics: total voters, total candidates, total votes
router.get('/analytics', auth, role('admin'), async (req, res) => {
  try {
    const voterCount = await User.countDocuments({ role: 'voter' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    const voteCount = await Vote.countDocuments();
    res.json({ voterCount, adminCount, voteCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: err.message });
  }
});

// Paginated voters list
router.get('/voters/paginated', auth, role('admin'), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const voters = await User.find({ role: 'voter' })
      .select('-password')
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ role: 'voter' });

    res.json({
      page,
      totalPages: Math.ceil(total / limit),
      totalVoters: total,
      voters
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch paginated voters', error: err.message });
  }
});

// Secure populate queries
router.get('/votes/secure', auth, role('admin'), async (req, res) => {
  try {
    const votes = await Vote.find()
      .populate({ path: 'voter', select: 'name email' })
      .populate({ path: 'candidate', select: 'name party' })
      .populate({ path: 'election', select: 'title description' });

    res.json(votes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch secure votes', error: err.message });
  }
});

// --- REMOVED ELECTION ROUTES ---
// The routes for POST /election, PUT /election/:id, and DELETE /election/:id
// were removed. They are incorrect (singular) and belong in your
// separate 'elections.js' file (as plural: /elections).

module.exports = router;