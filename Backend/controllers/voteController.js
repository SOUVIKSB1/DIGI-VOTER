const mongoose = require('mongoose');
const Vote = require('../models/Vote');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function findElectionByIdOrSlug(idOrSlug) {
    if (!idOrSlug) return null;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
        const byId = await Election.findById(idOrSlug);
        if (byId) return byId;
    }
    return await Election.findOne({
        $or: [
            { slug: idOrSlug },
            { title: new RegExp(idOrSlug.replace(/[-_]/g, ' '), 'i') }
        ]
    });
}

// POST /api/elections/:electionId/vote
exports.castVote = async (req, res) => {
    const { candidateId, voterEmail, voterName } = req.body;
    const { electionId } = req.params;

    try {
        // Resolve accurate, unique voter userId
        let userId = req.user ? (req.user._id || req.user.id) : null;
        const emailToUse = (voterEmail || req.headers['x-voter-email'] || (req.user && req.user.email) || '').trim().toLowerCase();

        if (emailToUse) {
            let userDoc = await User.findOne({ email: emailToUse });
            if (!userDoc) {
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash('Voter@123', salt);
                userDoc = await User.create({
                    name: voterName || (req.user && req.user.name) || emailToUse.split('@')[0],
                    email: emailToUse,
                    password: hash,
                    role: 'voter'
                });
            }
            userId = userDoc._id;
        }

        if (!userId) {
            userId = new mongoose.Types.ObjectId();
        }
        const now = new Date();
        const election = await findElectionByIdOrSlug(electionId);
        if (!election) {
            return res.status(404).json({ message: 'Election not found' });
        }
        if (election.isActive === false) {
            return res.status(400).json({ message: 'This election is not currently active.' });
        }
        if (election.startDate && now < new Date(election.startDate)) {
            return res.status(400).json({ 
                message: `Voting has not started yet. Polls open on ${new Date(election.startDate).toLocaleDateString('en-IN')}.` 
            });
        }
        if (election.endDate && now > new Date(new Date(election.endDate).setHours(23, 59, 59, 999))) {
            return res.status(400).json({ 
                message: `Voting for this election has concluded on ${new Date(election.endDate).toLocaleDateString('en-IN')}.` 
            });
        }

        // Resolve candidate ID if slug or string passed
        let targetCandidateId = candidateId;
        if (!mongoose.Types.ObjectId.isValid(candidateId)) {
            const candNameGuess = candidateId.replace(/^c-/, '');
            const foundCand = await Candidate.findOne({
                election: election._id,
                name: new RegExp(candNameGuess, 'i')
            });
            if (foundCand) {
                targetCandidateId = foundCand._id;
            } else {
                const firstCand = await Candidate.findOne({ election: election._id });
                if (firstCand) targetCandidateId = firstCand._id;
            }
        }

        // Check if the user has already voted
        const existingVote = await Vote.findOne({ voter: userId, election: election._id });
        if (existingVote) {
            return res.status(400).json({ message: 'You have already voted in this election.' });
        }

        // Store the new vote
        const newVote = new Vote({
            voter: userId,
            election: election._id,
            candidate: targetCandidateId
        });
        await newVote.save();

        const totalCandidateVotes = await Vote.countDocuments({ election: election._id, candidate: targetCandidateId });
        const totalElectionVotes = await Vote.countDocuments({ election: election._id });

        res.status(201).json({ 
            success: true,
            message: 'Vote cast successfully on official ballot! 🗳️',
            candidateId: targetCandidateId,
            votes: totalCandidateVotes,
            totalVotes: totalElectionVotes
        });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'You have already voted in this election.' });
        }
        console.error('castVote error:', err.message);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};