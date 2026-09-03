require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

// DB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ovms';
connectDB(MONGO_URI);

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/elections', require('./routes/elections'));
app.use('/api/admin', require('./routes/admin'));

// Seed endpoint for manual or frontend trigger (Supports loksabha, vidhansabha, or all)
app.all('/api/seed', async (req, res) => {
    try {
        const seedDatabase = require('./seed');
        const forceReset = req.query.reset === 'true' || req.body?.reset === true;
        const type = req.query.type || req.body?.type || 'all';
        const result = await seedDatabase(type, forceReset);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// basic root
app.get('/api', (req, res) => res.send('DIGI-VOTER API running'));
app.get('/api/', (req, res) => res.send('DIGI-VOTER API running'));

// Serve Frontend static assets if directory exists
const frontendDir = path.join(__dirname, '../Frontend');
if (fs.existsSync(frontendDir)) {
    app.use(express.static(frontendDir));
    app.get('/', (req, res) => {
        res.sendFile(path.join(frontendDir, 'index.html'));
    });
} else {
    app.get('/', (req, res) => res.send('OVMS backend running'));
}

// 404
app.use((req, res) => res.status(404).json({ message: 'Not Found' }));

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));