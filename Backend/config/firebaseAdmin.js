const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let initialized = false;

function init() {
    if (initialized) return admin;
    let serviceAccount;
    // Check if JSON is provided directly via environment variable (useful for Render/Vercel)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        } catch (e) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON environment variable.');
            return null;
        }
    } else {
        const keyPath = process.env.SERVICE_ACCOUNT_PATH || path.join(__dirname, '..', 'serviceAccountKey.json');
        if (!fs.existsSync(keyPath)) {
            console.warn('Firebase service account key not found at', keyPath, 'and FIREBASE_SERVICE_ACCOUNT_JSON env var is missing — Firebase admin not initialized.');
            return null;
        }
        serviceAccount = require(keyPath);
    }
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    initialized = true;
    console.log('Firebase Admin initialized');
    return admin;
}

module.exports = init();
