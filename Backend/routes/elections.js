const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const electionCtrl = require('../controllers/electionController');
const voteCtrl = require('../controllers/voteController');

// --- Public routes ---
router.get('/active', electionCtrl.getActiveElections);
router.get('/', electionCtrl.listAllElections); // For admin page

// **FIX:** All routes now use ':electionId' for consistency
router.get('/:electionId', electionCtrl.getElectionDetails);
router.get('/:electionId/results', electionCtrl.getResults);

// --- Admin-only routes ---
router.post('/', auth, role('admin'), electionCtrl.createElection);
// **FIX:** This route uses ':electionId'
router.post('/:electionId/candidates', auth, role('admin'), electionCtrl.addCandidate); 
router.put('/:electionId', auth, role('admin'), electionCtrl.updateElection);
router.delete('/:electionId', auth, role('admin'), electionCtrl.deleteElection);

// --- Voter-only routes ---
// **FIX:** This route uses ':electionId'
router.post('/:electionId/vote', auth, role('voter'), voteCtrl.castVote); 

module.exports = router;