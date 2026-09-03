// **FIX:** Import all the models you need at the top
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');

// GET /api/elections
exports.listAllElections = async (req, res) => {
    try {
        const elections = await Election.find().sort({ createdAt: -1 });
        // attach candidates for each election so frontend can render them directly
        const results = await Promise.all(elections.map(async (e) => {
            const candidates = await Candidate.find({ election: e._id }).select('_id name party');
            return Object.assign({}, e.toObject(), { candidates });
        }));
        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// GET /api/elections/active
exports.getActiveElections = async (req, res) => {
    try {
        const now = new Date();
        const elections = await Election.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).sort({ endDate: 1 });
        const results = await Promise.all(elections.map(async (e) => {
            const candidates = await Candidate.find({ election: e._id }).select('_id name party');
            return Object.assign({}, e.toObject(), { candidates });
        }));
        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// GET /api/elections/:electionId
// **THIS FUNCTION SHOWS CANDIDATES**
exports.getElectionDetails = async (req, res) => {
    try {
        const { electionId } = req.params; // **FIXED**
        const election = await Election.findById(electionId);
        if (!election) {
            return res.status(404).json({ message: 'Election not found' });
        }
        const candidates = await Candidate.find({ election: electionId });
        res.json({
            election: election,
            candidates: candidates
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/elections
exports.createElection = async (req, res) => {
    const { title, description, startDate, endDate, isActive } = req.body;
    try {
        const newElection = new Election({
            title,
            description,
            startDate,
            endDate,
            isActive: isActive !== undefined ? isActive : true,
            createdBy: req.user.id
        });
        await newElection.save();
        res.status(201).json(newElection);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/elections/:electionId/candidates
// **THIS FUNCTION ADDS CANDIDATES**
exports.addCandidate = async (req, res) => {
    const { name, party } = req.body;
    const { electionId } = req.params; // **FIXED**
    try {
        const election = await Election.findById(electionId);
        if (!election) {
            return res.status(404).json({ message: "Election not found." });
        }
        const newCandidate = new Candidate({
            name,
            party,
            election: electionId 
        });
        await newCandidate.save();
        res.status(201).json(newCandidate); // This sends the success response
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' }); // This sends the error response
    }
};

// PUT /api/elections/:electionId
exports.updateElection = async (req, res) => {
    try {
        const { electionId } = req.params; // **FIXED**
        const updatedElection = await Election.findByIdAndUpdate(
            electionId,
            req.body,
            { new: true }
        );
        if (!updatedElection) {
            return res.status(404).json({ message: 'Election not found' });
        }
        res.json(updatedElection);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/elections/:electionId
exports.deleteElection = async (req, res) => {
    try {
        const { electionId } = req.params; // **FIXED**
        const deletedElection = await Election.findByIdAndDelete(electionId);
        if (!deletedElection) {
            return res.status(404).json({ message: 'Election not found' });
        }
        await Candidate.deleteMany({ election: electionId });
        await Vote.deleteMany({ election: electionId });
        res.json({ message: 'Election and all associated data deleted.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/elections/:electionId/results
exports.getResults = async (req, res) => {
    try {
        const { electionId } = req.params; // **FIXED**
        const votes = await Vote.find({ election: electionId });
        const results = {};
        for (const vote of votes) {
            const candidateId = vote.candidate.toString();
            results[candidateId] = (results[candidateId] || 0) + 1;
        }
        const candidateIds = Object.keys(results);
        const candidates = await Candidate.find({ _id: { $in: candidateIds } }).select('name party');
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