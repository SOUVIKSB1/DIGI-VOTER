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

// basic root
app.get('/api', (req, res) => res.send('OVMS API running'));
app.get('/api/', (req, res) => res.send('OVMS API running'));

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