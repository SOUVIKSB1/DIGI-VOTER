const mongoose = require('mongoose');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');

// Helper to resolve election by MongoDB ObjectId or text slug
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

// GET /api/elections
exports.listAllElections = async (req, res) => {
    try {
        let elections = await Election.find().sort({ createdAt: -1 });
        if (elections.length === 0) {
            try {
                const { seedDatabase } = require('../seed');
                await seedDatabase();
                elections = await Election.find().sort({ createdAt: -1 });
            } catch (seedErr) {
                console.warn('Auto-seed fallback error:', seedErr.message);
            }
        }
        const results = await Promise.all(elections.map(async (e) => {
            const candidates = await Candidate.find({ election: e._id }).select('_id name party');
            const votes = await Vote.find({ election: e._id });
            const counts = {};
            candidates.forEach(c => { counts[c._id.toString()] = 0; });
            votes.forEach(v => {
                const cid = v.candidate ? v.candidate.toString() : '';
                counts[cid] = (counts[cid] || 0) + 1;
            });
            return Object.assign({}, e.toObject(), { candidates, counts, totalVotes: votes.length });
        }));
        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// GET /api/elections/active?assembly=...
exports.getActiveElections = async (req, res) => {
    try {
        const { assembly } = req.query;
        let query = { isActive: { $ne: false } };
        if (assembly && assembly.toLowerCase() !== 'all') {
            query.assembly = new RegExp(assembly.trim(), 'i');
        }

        let elections = await Election.find(query).sort({ createdAt: -1 });
        if (elections.length === 0 && !assembly) {
            try {
                const { seedDatabase } = require('../seed');
                await seedDatabase();
                elections = await Election.find(query).sort({ createdAt: -1 });
            } catch (seedErr) {
                console.warn('Auto-seed fallback in getActiveElections error:', seedErr.message);
            }
        }

        const results = await Promise.all(elections.map(async (e) => {
            const candidates = await Candidate.find({ election: e._id }).select('_id name party');
            const votes = await Vote.find({ election: e._id });
            const counts = {};
            candidates.forEach(c => { counts[c._id.toString()] = 0; });
            votes.forEach(v => {
                const cid = v.candidate ? v.candidate.toString() : '';
                counts[cid] = (counts[cid] || 0) + 1;
            });
            return Object.assign({}, e.toObject(), { candidates, counts, totalVotes: votes.length });
        }));
        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// GET /api/elections/:electionId
exports.getElectionDetails = async (req, res) => {
    try {
        const { electionId } = req.params;
        const election = await findElectionByIdOrSlug(electionId);
        if (!election) {
            return res.status(404).json({ message: 'Election not found' });
        }
        const candidates = await Candidate.find({ election: election._id }).select('_id name party');
        const votes = await Vote.find({ election: election._id });
        const counts = {};
        candidates.forEach(c => { counts[c._id.toString()] = 0; });
        votes.forEach(v => {
            const cid = v.candidate ? v.candidate.toString() : '';
            counts[cid] = (counts[cid] || 0) + 1;
        });
        res.json({
            election: Object.assign({}, election.toObject(), { counts, totalVotes: votes.length }),
            candidates: candidates,
            counts: counts
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/elections
exports.createElection = async (req, res) => {
    const { title, description, assembly, assemblyNumber, state, startDate, endDate, isActive } = req.body;
    try {
        const slug = (title || 'election').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const newElection = new Election({
            title,
            description,
            assembly: assembly || 'Varanasi (PC-77)',
            assemblyNumber: assemblyNumber || '',
            state: state || '',
            slug,
            startDate: startDate || new Date(),
            endDate: endDate || new Date(Date.now() + 30*24*60*60*1000),
            isActive: isActive !== undefined ? isActive : true,
            createdBy: req.user.id || req.user._id
        });
        await newElection.save();
        res.status(201).json(newElection);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/elections/:electionId/candidates
exports.addCandidate = async (req, res) => {
    const { name, party } = req.body;
    const { electionId } = req.params;
    try {
        const election = await findElectionByIdOrSlug(electionId);
        if (!election) {
            return res.status(404).json({ message: "Election not found." });
        }
        const newCandidate = new Candidate({
            name,
            party,
            election: election._id 
        });
        await newCandidate.save();
        res.status(201).json(newCandidate);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/elections/:electionId/candidates/:candidateId
exports.editCandidate = async (req, res) => {
    const { name, party } = req.body;
    const { candidateId } = req.params;
    try {
        const candidate = await Candidate.findByIdAndUpdate(
            candidateId,
            { name, party },
            { new: true }
        );
        if (!candidate) {
            return res.status(404).json({ message: "Candidate not found." });
        }
        res.json(candidate);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/elections/:electionId/candidates/:candidateId
exports.deleteCandidate = async (req, res) => {
    const { candidateId } = req.params;
    try {
        const candidate = await Candidate.findByIdAndDelete(candidateId);
        if (!candidate) {
            return res.status(404).json({ message: "Candidate not found." });
        }
        await Vote.deleteMany({ candidate: candidateId });
        res.json({ message: 'Candidate and associated votes removed successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/elections/:electionId
exports.updateElection = async (req, res) => {
    try {
        const { electionId } = req.params;
        const election = await findElectionByIdOrSlug(electionId);
        if (!election) {
            return res.status(404).json({ message: 'Election not found' });
        }
        const updatedElection = await Election.findByIdAndUpdate(
            election._id,
            req.body,
            { new: true }
        );
        res.json(updatedElection);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/elections/:electionId
exports.deleteElection = async (req, res) => {
    try {
        const { electionId } = req.params;
        const election = await findElectionByIdOrSlug(electionId);
        if (!election) {
            return res.status(404).json({ message: 'Election not found' });
        }
        await Election.findByIdAndDelete(election._id);
        await Candidate.deleteMany({ election: election._id });
        await Vote.deleteMany({ election: election._id });
        res.json({ message: 'Election and all associated data deleted.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/elections/:electionId/results
exports.getResults = async (req, res) => {
    try {
        const { electionId } = req.params;
        const election = await findElectionByIdOrSlug(electionId);
        if (!election) {
            return res.status(404).json({ message: 'Election not found' });
        }
        const candidates = await Candidate.find({ election: election._id }).select('name party');
        const votes = await Vote.find({ election: election._id });
        const results = {};
        for (const vote of votes) {
            const cid = vote.candidate ? vote.candidate.toString() : '';
            results[cid] = (results[cid] || 0) + 1;
        }
        const formattedResults = candidates.map(c => ({
            candidate: {
                _id: c._id,
                name: c.name,
                party: c.party
            },
            votes: results[c._id.toString()] || 0
        }));
        formattedResults.sort((a, b) => b.votes - a.votes);
        res.json(formattedResults);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};