require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Election = require('./models/Election');
const Candidate = require('./models/Candidate');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ovms';

async function seed() {
    await connectDB(MONGO_URI);

    // clear basic data (CAUTION in production)
    // await User.deleteMany();
    // await Election.deleteMany();
    // await Candidate.deleteMany();

    // create admin if not exists
    // seed admin with requested email and password
    const adminEmail = '123@admin.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
        const hashed = await bcrypt.hash('123456', 10);
        admin = await User.create({
            name: 'Admin',
            email: adminEmail,
            password: hashed,
            role: 'admin'
        });
        console.log('Admin created:', adminEmail, 'password: 123456');
    } else {
        console.log('Admin already exists:', adminEmail);
    }

    // create sample election if not exists
    let election = await Election.findOne({ title: 'Student Council 2025' });
    if (!election) {
        election = await Election.create({
            title: 'TMSL Student Council 2025',
            description: 'Sample election for demonstration',
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
            createdBy: admin._id
        });
        console.log('Sample election created:', election.title);

        // create two candidates
        await Candidate.create({ name: 'Rajarshi Chatterjee', party: 'CR CSE', election: election._id });
        await Candidate.create({ name: 'Souvik Sinhababu', party: 'CR CSE', election: election._id });
        console.log('Sample candidates created');
    } else {
        console.log('Sample election already exists:', election.title);
    }

    mongoose.connection.close();
}

seed().catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
});