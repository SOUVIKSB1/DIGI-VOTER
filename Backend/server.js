require('dotenv').config();
const express = require('express');
const cors = require('cors');
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
app.get('/', (req, res) => res.send('OVMS backend running'));
app.get('/api', (req, res) => res.send('OVMS API running'));
app.get('/api/', (req, res) => res.send('OVMS API running'));

// 404
app.use((req, res) => res.status(404).json({ message: 'Not Found' }));

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));