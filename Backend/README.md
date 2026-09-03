# OVMS Backend (Node.js + Express + MongoDB)

## Requirements
- Node.js (16+ recommended)
- MongoDB (local or Atlas)

## Setup
1. clone repo
2. cd ovms-backend
3. npm install
4. copy `.env.example` to `.env` and fill values
5. Run DB locally or set MONGO_URI for Atlas
6. Run seed data:
   npm run seed
7. Start server:
   npm run dev  (uses nodemon)
   or
   npm start

## API Endpoints (summary)

POST /api/auth/register
POST /api/auth/login

GET  /api/elections/active
GET  /api/elections/:id
POST /api/elections/         (admin)
POST /api/elections/:electionId/candidates  (admin)
POST /api/elections/:electionId/vote  (voter)

GET /api/elections/:id/results

GET /api/admin/voters   (admin)
GET /api/admin/votes    (admin)