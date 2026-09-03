const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Election = require('./models/Election');
const Candidate = require('./models/Candidate');
const Vote = require('./models/Vote');

async function seedDatabase(type = 'all', forceReset = false) {
    try {
        if (typeof type === 'boolean') {
            forceReset = type;
            type = 'all';
        }
        type = typeof type === 'string' ? type : 'all';

        const count = await Election.countDocuments();
        if (count > 0 && !forceReset) {
            console.log(`[SEED] Database already has ${count} elections. Skipping seed.`);
            return { message: `Database already initialized with ${count} elections.`, count };
        }

        console.log(`[SEED] Seeding database for type: ${type}...`);

        if (forceReset) {
            await Vote.deleteMany({});
            await Candidate.deleteMany({});
            await Election.deleteMany({});
        }

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
            { name: 'Subhasish Roy', email: 'subhasish@digivoter.in' },
            { name: 'Ananya Sen', email: 'ananya@digivoter.in' }
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
        const start = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
        const end = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

        let createdCount = 0;

        // --- LOK SABHA ELECTIONS ---
        if (type === 'all' || type === 'loksabha') {
            // 1. Varanasi (Uttar Pradesh)
            const elLS1 = await Election.findOneAndUpdate(
                { slug: 'ls-2026-varanasi' },
                {
                    title: 'Lok Sabha General Election — Varanasi Parliamentary Constituency',
                    description: 'Constituency No. 77, Parliamentary General Election for Member of Parliament.',
                    assembly: 'Varanasi (PC-77)',
                    assemblyNumber: 'PC-77',
                    state: 'Uttar Pradesh',
                    slug: 'ls-2026-varanasi',
                    startDate: start,
                    endDate: end,
                    isActive: true,
                    createdBy: adminUser._id
                },
                { upsert: true, new: true }
            );
            await Candidate.deleteMany({ election: elLS1._id });
            const c1 = await Candidate.create({ name: 'Narendra Modi', party: 'Bharatiya Janata Party (BJP)', election: elLS1._id });
            const c2 = await Candidate.create({ name: 'Ajay Rai', party: 'Indian National Congress (INC)', election: elLS1._id });
            const c3 = await Candidate.create({ name: 'Athar Jamal Lari', party: 'Bahujan Samaj Party (BSP)', election: elLS1._id });
            await Vote.deleteMany({ election: elLS1._id });
            await Vote.create([
                { voter: voters[0]._id, election: elLS1._id, candidate: c1._id },
                { voter: voters[1]._id, election: elLS1._id, candidate: c1._id },
                { voter: voters[2]._id, election: elLS1._id, candidate: c1._id },
                { voter: voters[3]._id, election: elLS1._id, candidate: c2._id },
                { voter: voters[4]._id, election: elLS1._id, candidate: c3._id }
            ]);

            // 2. Kolkata South (West Bengal)
            const elLS2 = await Election.findOneAndUpdate(
                { slug: 'ls-2026-kolkata-south' },
                {
                    title: 'Lok Sabha General Election — Kolkata South Parliamentary Constituency',
                    description: 'Constituency No. 23, Parliamentary General Election for Member of Parliament.',
                    assembly: 'Kolkata South (PC-23)',
                    assemblyNumber: 'PC-23',
                    state: 'West Bengal',
                    slug: 'ls-2026-kolkata-south',
                    startDate: start,
                    endDate: end,
                    isActive: true,
                    createdBy: adminUser._id
                },
                { upsert: true, new: true }
            );
            await Candidate.deleteMany({ election: elLS2._id });
            const c4 = await Candidate.create({ name: 'Mala Roy', party: 'All India Trinamool Congress (AITC)', election: elLS2._id });
            const c5 = await Candidate.create({ name: 'Debashree Chaudhuri', party: 'Bharatiya Janata Party (BJP)', election: elLS2._id });
            const c6 = await Candidate.create({ name: 'Saira Shah Halim', party: 'CPI(M) / Left Front', election: elLS2._id });
            await Vote.deleteMany({ election: elLS2._id });
            await Vote.create([
                { voter: voters[0]._id, election: elLS2._id, candidate: c4._id },
                { voter: voters[1]._id, election: elLS2._id, candidate: c4._id },
                { voter: voters[2]._id, election: elLS2._id, candidate: c4._id },
                { voter: voters[3]._id, election: elLS2._id, candidate: c5._id },
                { voter: voters[4]._id, election: elLS2._id, candidate: c6._id }
            ]);

            // 3. New Delhi (Delhi NCT)
            const elLS3 = await Election.findOneAndUpdate(
                { slug: 'ls-2026-new-delhi' },
                {
                    title: 'Lok Sabha General Election — New Delhi Parliamentary Constituency',
                    description: 'Constituency No. 04, Parliamentary General Election for Member of Parliament.',
                    assembly: 'New Delhi (PC-04)',
                    assemblyNumber: 'PC-04',
                    state: 'Delhi (NCT)',
                    slug: 'ls-2026-new-delhi',
                    startDate: start,
                    endDate: end,
                    isActive: true,
                    createdBy: adminUser._id
                },
                { upsert: true, new: true }
            );
            await Candidate.deleteMany({ election: elLS3._id });
            const c7 = await Candidate.create({ name: 'Bansuri Swaraj', party: 'Bharatiya Janata Party (BJP)', election: elLS3._id });
            const c8 = await Candidate.create({ name: 'Somnath Bharti', party: 'Aam Aadmi Party (AAP)', election: elLS3._id });
            await Vote.deleteMany({ election: elLS3._id });
            await Vote.create([
                { voter: voters[0]._id, election: elLS3._id, candidate: c7._id },
                { voter: voters[1]._id, election: elLS3._id, candidate: c7._id },
                { voter: voters[2]._id, election: elLS3._id, candidate: c8._id },
                { voter: voters[3]._id, election: elLS3._id, candidate: c8._id }
            ]);

            createdCount += 3;
        }

        // --- VIDHAN SABHA (STATE LEGISLATIVE ASSEMBLY) ELECTIONS ---
        if (type === 'all' || type === 'vidhansabha') {
            // 1. Delhi Vidhan Sabha (New Delhi AC-40)
            const elVS1 = await Election.findOneAndUpdate(
                { slug: 'delhi-assembly-2026' },
                {
                    title: 'Delhi Legislative Assembly — New Delhi Constituency',
                    description: 'State Legislative Assembly election for representative in Vidhan Sabha (AC-40).',
                    assembly: 'New Delhi (AC-40)',
                    assemblyNumber: 'AC-40',
                    state: 'Delhi (NCT)',
                    slug: 'delhi-assembly-2026',
                    startDate: start,
                    endDate: end,
                    isActive: true,
                    createdBy: adminUser._id
                },
                { upsert: true, new: true }
            );
            await Candidate.deleteMany({ election: elVS1._id });
            const c9 = await Candidate.create({ name: 'Arvind Kejriwal', party: 'Aam Aadmi Party (AAP)', election: elVS1._id });
            const c10 = await Candidate.create({ name: 'Sunil Yadav', party: 'Bharatiya Janata Party (BJP)', election: elVS1._id });
            const c11 = await Candidate.create({ name: 'Romesh Sabharwal', party: 'Indian National Congress (INC)', election: elVS1._id });
            await Vote.deleteMany({ election: elVS1._id });
            await Vote.create([
                { voter: voters[0]._id, election: elVS1._id, candidate: c9._id },
                { voter: voters[1]._id, election: elVS1._id, candidate: c9._id },
                { voter: voters[2]._id, election: elVS1._id, candidate: c9._id },
                { voter: voters[3]._id, election: elVS1._id, candidate: c10._id },
                { voter: voters[4]._id, election: elVS1._id, candidate: c11._id }
            ]);

            // 2. West Bengal Vidhan Sabha (Bhabanipur AC-159)
            const elVS2 = await Election.findOneAndUpdate(
                { slug: 'wb-assembly-bhabanipur' },
                {
                    title: 'West Bengal Vidhan Sabha — Bhabanipur Assembly Constituency',
                    description: 'State Legislative Assembly election for representative in West Bengal Vidhan Sabha (AC-159).',
                    assembly: 'Bhabanipur (AC-159)',
                    assemblyNumber: 'AC-159',
                    state: 'West Bengal',
                    slug: 'wb-assembly-bhabanipur',
                    startDate: start,
                    endDate: end,
                    isActive: true,
                    createdBy: adminUser._id
                },
                { upsert: true, new: true }
            );
            await Candidate.deleteMany({ election: elVS2._id });
            const c12 = await Candidate.create({ name: 'Mamata Banerjee', party: 'All India Trinamool Congress (AITC)', election: elVS2._id });
            const c13 = await Candidate.create({ name: 'Priyanka Tibrewal', party: 'Bharatiya Janata Party (BJP)', election: elVS2._id });
            const c14 = await Candidate.create({ name: 'Srijib Biswas', party: 'CPI(M)', election: elVS2._id });
            await Vote.deleteMany({ election: elVS2._id });
            await Vote.create([
                { voter: voters[0]._id, election: elVS2._id, candidate: c12._id },
                { voter: voters[1]._id, election: elVS2._id, candidate: c12._id },
                { voter: voters[2]._id, election: elVS2._id, candidate: c12._id },
                { voter: voters[3]._id, election: elVS2._id, candidate: c12._id },
                { voter: voters[4]._id, election: elVS2._id, candidate: c13._id }
            ]);

            // 3. Uttar Pradesh Vidhan Sabha (Varanasi South AC-392)
            const elVS3 = await Election.findOneAndUpdate(
                { slug: 'up-assembly-varanasi-south' },
                {
                    title: 'Uttar Pradesh Vidhan Sabha — Varanasi South Assembly Constituency',
                    description: 'State Legislative Assembly election for representative in Uttar Pradesh Vidhan Sabha (AC-392).',
                    assembly: 'Varanasi South (AC-392)',
                    assemblyNumber: 'AC-392',
                    state: 'Uttar Pradesh',
                    slug: 'up-assembly-varanasi-south',
                    startDate: start,
                    endDate: end,
                    isActive: true,
                    createdBy: adminUser._id
                },
                { upsert: true, new: true }
            );
            await Candidate.deleteMany({ election: elVS3._id });
            const c15 = await Candidate.create({ name: 'Dr. Neelkanth Tiwari', party: 'Bharatiya Janata Party (BJP)', election: elVS3._id });
            const c16 = await Candidate.create({ name: 'Kameshwar Dixit', party: 'Samajwadi Party (SP)', election: elVS3._id });
            await Vote.deleteMany({ election: elVS3._id });
            await Vote.create([
                { voter: voters[0]._id, election: elVS3._id, candidate: c15._id },
                { voter: voters[1]._id, election: elVS3._id, candidate: c15._id },
                { voter: voters[2]._id, election: elVS3._id, candidate: c16._id }
            ]);

            createdCount += 3;
        }

        const totalElections = await Election.countDocuments();
        const totalVotes = await Vote.countDocuments();
        console.log(`✅ [SEED] Done! Total Elections: ${totalElections}, Total Votes: ${totalVotes}`);

        return {
            success: true,
            message: `Official ${type.toUpperCase()} ballots seeded successfully with verified votes!`,
            totalElections,
            totalVotes
        };
    } catch (err) {
        console.error('[SEED] Error seeding database:', err);
        throw err;
    }
}

module.exports = seedDatabase;