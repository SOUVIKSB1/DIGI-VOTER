const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Election = require('./models/Election');
const Candidate = require('./models/Candidate');
const Vote = require('./models/Vote');

async function seedDatabase(forceReset = false) {
    try {
        const count = await Election.countDocuments();
        if (count > 0 && !forceReset) {
            console.log(`[SEED] Database already has ${count} elections. Skipping seed.`);
            return { message: `Database already initialized with ${count} elections.`, count };
        }

        console.log('[SEED] Seeding database with official elections, candidates, and initial votes...');

        if (forceReset) {
            await Vote.deleteMany({});
            await Candidate.deleteMany({});
            await Election.deleteMany({});
            await User.deleteMany({ email: { $in: ['admin@digivoter.in', 'voter1@digivoter.in', 'voter2@digivoter.in', 'voter3@digivoter.in', 'voter4@digivoter.in', 'voter5@digivoter.in'] } });
        }

        // 1. Create Users (1 Admin + 5 Distinct Voters for casting votes)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('DemoPass@123', salt);

        let adminUser = await User.findOne({ email: 'souvik@admin.com' });
        if (!adminUser) {
            const adminPassHash = await bcrypt.hash('admin123', salt);
            adminUser = await User.create({
                name: 'Chief Election Admin',
                email: 'souvik@admin.com',
                password: adminPassHash,
                role: 'admin'
            });
        }

        const voterData = [
            { name: 'Souvik (Voter)', email: 'souvik@digivoter.in' },
            { name: 'Priya Sharma', email: 'priya@digivoter.in' },
            { name: 'Rahul Verma', email: 'rahul@digivoter.in' },
            { name: 'Ananya Roy', email: 'ananya@digivoter.in' },
            { name: 'Amit Patel', email: 'amit@digivoter.in' }
        ];

        const voters = [];
        for (const vd of voterData) {
            let u = await User.findOne({ email: vd.email });
            if (!u) {
                u = await User.create({
                    name: vd.name,
                    email: vd.email,
                    password: hashedPassword,
                    role: 'voter'
                });
            }
            voters.push(u);
        }

        const now = new Date();
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        const end = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);   // 60 days ahead

        // 2. Election 1: Lok Sabha Varanasi (5 votes seeded)
        const el1 = await Election.create({
            title: 'Lok Sabha General Election — Varanasi Parliamentary Constituency',
            description: 'Constituency No. 77, Parliamentary General Election for Member of Parliament.',
            startDate: start,
            endDate: end,
            isActive: true,
            createdBy: adminUser._id
        });

        const c1_1 = await Candidate.create({ name: 'Narendra Modi', party: 'Bharatiya Janata Party (BJP)', election: el1._id });
        const c1_2 = await Candidate.create({ name: 'Ajay Rai', party: 'Indian National Congress (INC)', election: el1._id });
        const c1_3 = await Candidate.create({ name: 'Athar Jamal Lari', party: 'Bahujan Samaj Party (BSP)', election: el1._id });

        // Cast 5 distinct votes in Election 1:
        // 3 votes for Narendra Modi, 1 for Ajay Rai, 1 for Athar Jamal Lari
        await Vote.create([
            { voter: voters[0]._id, election: el1._id, candidate: c1_1._id },
            { voter: voters[1]._id, election: el1._id, candidate: c1_1._id },
            { voter: voters[2]._id, election: el1._id, candidate: c1_1._id },
            { voter: voters[3]._id, election: el1._id, candidate: c1_2._id },
            { voter: voters[4]._id, election: el1._id, candidate: c1_3._id }
        ]);

        // 3. Election 2: Delhi Legislative Assembly (5 votes seeded)
        const el2 = await Election.create({
            title: 'Delhi Legislative Assembly — New Delhi Constituency',
            description: 'State Legislative Assembly election for representative in Vidhan Sabha (AC-40).',
            startDate: start,
            endDate: end,
            isActive: true,
            createdBy: adminUser._id
        });

        const c2_1 = await Candidate.create({ name: 'Arvind Kejriwal', party: 'Aam Aadmi Party (AAP)', election: el2._id });
        const c2_2 = await Candidate.create({ name: 'Sunil Yadav', party: 'Bharatiya Janata Party (BJP)', election: el2._id });
        const c2_3 = await Candidate.create({ name: 'Romesh Sabharwal', party: 'Indian National Congress (INC)', election: el2._id });

        // Cast 5 distinct votes in Election 2:
        // 3 votes for Arvind Kejriwal, 2 for Sunil Yadav
        await Vote.create([
            { voter: voters[0]._id, election: el2._id, candidate: c2_1._id },
            { voter: voters[1]._id, election: el2._id, candidate: c2_1._id },
            { voter: voters[2]._id, election: el2._id, candidate: c2_1._id },
            { voter: voters[3]._id, election: el2._id, candidate: c2_2._id },
            { voter: voters[4]._id, election: el2._id, candidate: c2_2._id }
        ]);

        // 4. Election 3: Student Council Presidential Election (4 votes seeded)
        const el3 = await Election.create({
            title: 'National University Student Council Presidential Election',
            description: 'Annual democratic election for the President of the Central University Student Council.',
            startDate: start,
            endDate: end,
            isActive: true,
            createdBy: adminUser._id
        });

        const c3_1 = await Candidate.create({ name: 'Priya Sharma', party: 'Progressive Students Union', election: el3._id });
        const c3_2 = await Candidate.create({ name: 'Rahul Verma', party: 'United Youth Alliance', election: el3._id });
        const c3_3 = await Candidate.create({ name: 'Ananya Roy', party: 'Independent Youth Voice', election: el3._id });

        // Cast 4 distinct votes in Election 3:
        // 2 votes for Priya Sharma, 2 for Rahul Verma
        await Vote.create([
            { voter: voters[0]._id, election: el3._id, candidate: c3_1._id },
            { voter: voters[1]._id, election: el3._id, candidate: c3_1._id },
            { voter: voters[2]._id, election: el3._id, candidate: c3_2._id },
            { voter: voters[3]._id, election: el3._id, candidate: c3_2._id }
        ]);

        console.log('✅ [SEED] Database successfully seeded with 3 elections and 14 total verified votes!');
        return {
            success: true,
            message: 'Database successfully seeded with 3 elections and 14 verified votes (4-5 per election).'
        };
    } catch (err) {
        console.error('[SEED] Error seeding database:', err);
        throw err;
    }
}

module.exports = seedDatabase;