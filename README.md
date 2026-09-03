# Bharat Vote 🇮🇳 (DIGI-VOTER)
Online Voting Management System (OVMS)

A secure, responsive web application for managing online elections, voter authentication, ballot casting, candidate registration, and real-time election analytics.

---

## 🚀 Technology Stack
- **Frontend**: Vanilla JavaScript (ES6 Modules), HTML5, CSS3 (Glassmorphism & Indian Tricolor Palette)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: Firebase Auth (Email/Password, Google Sign-In) & JWT with local demo fallback

---

## 📁 Project Structure
```
DIGI-VOTER/
├── Backend/
│   ├── config/
│   │   ├── db.js
│   │   └── firebaseAdmin.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── electionController.js
│   │   └── voteController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── models/
│   │   ├── Candidate.js
│   │   ├── Election.js
│   │   ├── User.js
│   │   └── Vote.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   └── elections.js
│   ├── package.json
│   ├── seed.js
│   ├── server.js
│   └── start-dev.ps1
└── Frontend/
    ├── index.html
    ├── voting.html
    ├── script.js
    ├── style.css
    └── variables.css
```

---

## ⚡ Quick Start

### 1. Install Backend Dependencies
```bash
cd Backend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` in the `Backend/` directory and configure your `MONGO_URI`, `JWT_SECRET`, and Firebase credentials:
```bash
cp .env.example .env
```

### 3. Seed Database (Optional)
```bash
npm run seed
```

### 4. Start Server
```bash
npm start
# or for live reloading during development:
npm run dev
```

Server runs on: **`http://localhost:5002`**

### 5. Open Frontend
Open `Frontend/index.html` in your browser or serve using Live Server.
