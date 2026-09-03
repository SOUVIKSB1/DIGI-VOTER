const Vote = require('../models/Vote');
const Election = require('../models/Election');

// POST /api/elections/:electionId/vote
// This is the function your route file is looking for
exports.castVote = async (req, res) => {
    const { candidateId } = req.body;
    const { electionId } = req.params; // It correctly reads 'electionId'
    const userId = req.user.id; // From your authMiddleware

    try {
        // 1. Check if the election is active
        const now = new Date();
        const election = await Election.findById(electionId);
        if (!election) {
            return res.status(404).json({ message: 'Election not found' });
        }
        if (!election.isActive || now < election.startDate || now > election.endDate) {
            return res.status(400).json({ message: 'This election is not currently active.' });
        }

        // 2. Check if the user has already voted
        const existingVote = await Vote.findOne({ voter: userId, election: electionId });
        if (existingVote) {
            return res.status(400).json({ message: 'You have already voted in this election.' });
        }

        // 3. Store the new vote
        const newVote = new Vote({
            voter: userId,
            election: electionId,
            candidate: candidateId
        });
        await newVote.save();

        res.status(201).json({ message: 'Vote cast successfully!' });

    } catch (err) {
        // This will catch the duplicate vote error
        if (err.code === 11000) {
            return res.status(400).json({ message: 'You have already voted in this election.' });
        }
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};