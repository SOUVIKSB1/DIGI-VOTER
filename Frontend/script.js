/*
  Dynamic Firebase loader + offline demo mode.
  - Tries to dynamically import Firebase SDKs when online.
  - If imports fail (CDN unreachable/offline), falls back to a local demo mode
    where elections and votes are stored in localStorage and shown to the user.
  - Queues votes while offline and attempts to sync them when connectivity is restored.
*/

const NETWORK_STATUS = document.getElementById('networkStatus');
const authSection = document.getElementById('auth-section');
const voterSection = document.getElementById('voter-section');
const adminSection = document.getElementById('admin-section');
const voterNameSpan = document.getElementById('voterName');
function getElectionsDiv() { 
    if (adminSection && adminSection.style.display === 'block') {
        return document.getElementById('adminElectionsList');
    }
    return document.getElementById('elections'); 
}

// SPA Navigation & Role Switching Helpers
window.switchTestRole = function(role) {
    console.log('[ROLE SWITCHER] Switching to role:', role);
    localStorage.setItem('ovmsActiveRole', role);

    const voterBtn = document.getElementById('roleBtnVoter');
    const adminBtn = document.getElementById('roleBtnAdmin');
    const roleIndicator = document.getElementById('currentRoleBadge');

    // Immediately overwrite with a clean, valid token
    const isAdm = (role === 'admin');
    const defaultToken = isAdm ? 'mock-admin-token-2026' : 'mock-voter-token-2026';
    localStorage.setItem('backendToken', defaultToken);

    // Request fresh signed backend JWT in background to stay in sync with API
    try {
        fetch(`${API_BASE}/auth/token?role=${role}`)
            .then(r => r.json())
            .then(data => {
                if (data && data.token) {
                    localStorage.setItem('backendToken', data.token);
                    if (data.user) localStorage.setItem('backendUser', JSON.stringify(data.user));
                    console.log('[ROLE SWITCHER] Real backend JWT synced for role:', role);
                }
            })
            .catch(() => {});
    } catch(e) {}

    if (role === 'admin') {
        const adminUser = {
            id: '64b0f0000000000000000001',
            name: 'Chief Election Admin',
            email: 'rajarshighs1@gmail.com',
            role: 'admin'
        };
        localStorage.setItem('localUser', JSON.stringify(adminUser));
        localStorage.setItem('backendUser', JSON.stringify(adminUser));

        if (voterBtn) voterBtn.classList.remove('active');
        if (adminBtn) adminBtn.classList.add('active');
        if (roleIndicator) {
            roleIndicator.textContent = 'ADMIN MODE';
            roleIndicator.className = 'role-indicator admin';
        }

        if (authSection) authSection.style.display = 'none';
        if (voterSection) voterSection.style.display = 'none';
        if (adminSection) adminSection.style.display = 'block';

        if (window.showAdminTab) window.showAdminTab('manageElections');
        if (window.loadElections) window.loadElections();
        if (window.loadAnalytics) window.loadAnalytics();
    } else {
        const voterUser = {
            id: '64b0f0000000000000000002',
            name: 'Souvik (Voter)',
            email: 'voter@bharatvote.in',
            role: 'voter'
        };
        localStorage.setItem('localUser', JSON.stringify(voterUser));
        localStorage.setItem('backendUser', JSON.stringify(voterUser));

        if (adminBtn) adminBtn.classList.remove('active');
        if (voterBtn) voterBtn.classList.add('active');
        if (roleIndicator) {
            roleIndicator.textContent = 'VOTER MODE';
            roleIndicator.className = 'role-indicator voter';
        }

        if (authSection) authSection.style.display = 'none';
        if (adminSection) adminSection.style.display = 'none';
        if (voterSection) voterSection.style.display = 'block';

        const nameSpan = document.getElementById('voterName');
        if (nameSpan) nameSpan.textContent = voterUser.name;

        if (window.loadElections) window.loadElections();
    }
};

window.goHome = function() {
    window.switchTestRole('voter');
};

window.goAdmin = function() {
    window.switchTestRole('admin');
};

window.seedDemoElections = function() {
    const sample = [
        {
            id: 'ls-2026-varanasi',
            title: 'Lok Sabha General Election — Varanasi Constituency',
            description: 'Constituency No. 77, Parliamentary General Election for Member of Parliament.',
            startDate: '2026-04-01',
            endDate: '2026-06-01',
            isActive: true,
            active: true,
            candidates: [
                { id: 'c-modi', name: 'Narendra Modi', party: 'Bharatiya Janata Party (BJP)' },
                { id: 'c-rai', name: 'Ajay Rai', party: 'Indian National Congress (INC)' },
                { id: 'c-lari', name: 'Athar Jamal Lari', party: 'Bahujan Samaj Party (BSP)' }
            ],
            counts: { 'c-modi': 142, 'c-rai': 98, 'c-lari': 24 }
        },
        {
            id: 'delhi-assembly-2026',
            title: 'Delhi Legislative Assembly — New Delhi Constituency',
            description: 'State Legislative Assembly election for representation in Vidhan Sabha.',
            startDate: '2026-02-15',
            endDate: '2026-05-15',
            isActive: true,
            active: true,
            candidates: [
                { id: 'c-kejriwal', name: 'Arvind Kejriwal', party: 'Aam Aadmi Party (AAP)' },
                { id: 'c-yadav', name: 'Sunil Yadav', party: 'Bharatiya Janata Party (BJP)' },
                { id: 'c-sabharwal', name: 'Romesh Sabharwal', party: 'Indian National Congress (INC)' }
            ],
            counts: { 'c-kejriwal': 85, 'c-yadav': 67, 'c-sabharwal': 19 }
        },
        {
            id: 'student-council-2026',
            title: 'National University Student Council Presidential Election',
            description: 'Annual election for the President of the Central University Student Council.',
            startDate: '2026-03-01',
            endDate: '2026-03-31',
            isActive: true,
            active: true,
            candidates: [
                { id: 'c-priya', name: 'Priya Sharma', party: 'Progressive Students Union' },
                { id: 'c-rahul', name: 'Rahul Verma', party: 'United Youth Alliance' },
                { id: 'c-ananya', name: 'Ananya Roy', party: 'Independent Youth Voice' }
            ],
            counts: { 'c-priya': 52, 'c-rahul': 48, 'c-ananya': 22 }
        }
    ];
    localStorage.setItem('localElections', JSON.stringify(sample));
    if (typeof showToast === 'function') {
        showToast('Sample elections successfully loaded!', 'success');
    } else {
        alert('Sample elections successfully loaded!');
    }
    if (window.loadElections) window.loadElections();
    if (window.loadAnalytics) window.loadAnalytics();
};

window.filterElections = function(query) {
    const q = (query || '').toLowerCase().trim();
    const cards = document.querySelectorAll('.election-card');
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (!q || text.includes(q)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
};



// Ensure an edit modal exists in the DOM and return helper to show it.
function ensureEditModal() {
    if (document.getElementById('editElectionModal')) return;
    const modal = document.createElement('div');
    modal.id = 'editElectionModal';
    modal.style.position = 'fixed';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.display = 'none';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.background = 'rgba(0,0,0,0.5)';
    modal.innerHTML = `
        <div class="modal-card" id="editElectionModalCard">
            <h3 id="modalTitle">Edit Election</h3>
            <div style="display:flex;flex-direction:column;gap:8px;">
                <input id="modal_title" placeholder="Title" />
                <textarea id="modal_description" placeholder="Description" rows="3"></textarea>
                <div style="display:flex;gap:8px;align-items:center;">
                    <label>Start: <input id="modal_start" type="date"/></label>
                    <label>End: <input id="modal_end" type="date"/></label>
                </div>
                <label style="display:flex;align-items:center;gap:8px;"><input id="modal_active" type="checkbox"/> Active</label>
                <div class="error" id="modal_error" style="display:none;"></div>
                <div class="modal-actions">
                    <button id="modal_cancel" class="btn">Cancel</button>
                    <button id="modal_save" class="btn primary">Save</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // handlers will be attached by showEditModal when used
}

// Show modal and return a promise that resolves with updated data or null if cancelled
function showEditModal(election = {}) {
    ensureEditModal();
    const modal = document.getElementById('editElectionModal');
    const titleIn = document.getElementById('modal_title');
    const descIn = document.getElementById('modal_description');
    const startIn = document.getElementById('modal_start');
    const endIn = document.getElementById('modal_end');
    const activeIn = document.getElementById('modal_active');
    const saveBtn = document.getElementById('modal_save');
    const cancelBtn = document.getElementById('modal_cancel');

    titleIn.value = election.title || '';
    descIn.value = election.description || '';
    startIn.value = election.startDate ? new Date(election.startDate).toISOString().slice(0, 10) : '';
    endIn.value = election.endDate ? new Date(election.endDate).toISOString().slice(0, 10) : '';
    activeIn.checked = !!election.isActive;

    modal.style.display = 'flex';

    return new Promise((resolve) => {
        const cleanup = () => {
            saveBtn.removeEventListener('click', onSave);
            cancelBtn.removeEventListener('click', onCancel);
            modal.style.display = 'none';
        };
        const onSave = () => {
            const updated = {
                title: titleIn.value.trim(),
                description: descIn.value.trim(),
                startDate: startIn.value || null,
                endDate: endIn.value || null,
                isActive: activeIn.checked
            };
            // client-side validation
            const errEl = document.getElementById('modal_error');
            errEl.style.display = 'none';
            if (!updated.title) {
                errEl.textContent = 'Title is required.'; errEl.style.display = 'block'; return;
            }
            if (updated.startDate && updated.endDate) {
                const s = new Date(updated.startDate);
                const e = new Date(updated.endDate);
                if (isNaN(s.getTime()) || isNaN(e.getTime())) { errEl.textContent = 'Invalid dates.'; errEl.style.display = 'block'; return; }
                if (s > e) { errEl.textContent = 'Start date must be before or equal to end date.'; errEl.style.display = 'block'; return; }
            }
            cleanup();
            resolve(updated);
        };
        const onCancel = () => { cleanup(); resolve(null); };
        saveBtn.addEventListener('click', onSave);
        cancelBtn.addEventListener('click', onCancel);
    });
}

// Ensure an election modal exists (used on voting page to show candidates)
function ensureElectionModal() {
    if (document.getElementById('electionModal')) return;
    const modal = document.createElement('div');
    modal.id = 'electionModal';
    modal.style.position = 'fixed';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.display = 'none';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.background = 'rgba(0,0,0,0.5)';
    modal.innerHTML = `
        <div class="modal-card" id="electionModalCard" style="max-width:560px;">
            <h3 id="electionModalTitle">Election</h3>
            <div id="electionModalBody" style="display:flex;flex-direction:column;gap:8px;margin-top:8px;"></div>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
                <button id="electionModalClose" class="btn">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('electionModalClose').addEventListener('click', () => { modal.style.display = 'none'; });
}

// Show an election modal (loads candidates if needed). Closes on successful vote via event.
window.showElectionModal = async function showElectionModal(electionId, electionObj) {
    ensureElectionModal();
    const modal = document.getElementById('electionModal');
    const titleEl = document.getElementById('electionModalTitle');
    const bodyEl = document.getElementById('electionModalBody');
    modal.style.display = 'flex';
    bodyEl.innerHTML = 'Loading...';

    // helper to render candidates
    const renderCandidates = (e) => {
        titleEl.textContent = e.title || 'Election';
        bodyEl.innerHTML = '';
        const list = document.createElement('div');
        (e.candidates || []).forEach(c => {
            const cid = c.id || c._id;
            const party = c.party || c.partyName || 'Independent';
            const row = document.createElement('div');
            row.className = 'candidate';
            row.innerHTML = `<div><span>${c.name}</span><div class="meta">${party}</div></div>`;
            const btn = document.createElement('button');
            // decide handler
            const isBackendElection = !!e._isBackend || (window.electionSource && window.electionSource[electionId] === 'backend');
            btn.textContent = 'Vote';
            btn.className = 'btn primary';
            btn.addEventListener('click', async () => {
                try {
                    if (isBackendElection) await window.voteBackend(electionId, cid);
                    else await window.vote(electionId, cid);
                    // on success close modal
                    modal.style.display = 'none';
                } catch (err) { console.warn('Vote failed in modal', err); }
            });
            row.appendChild(btn);
            list.appendChild(row);
        });
        bodyEl.appendChild(list);
    };

    // if electionObj provided, use it; otherwise try cached or fetch
    const cache = window._electionCache = window._electionCache || {};
    if (electionObj) { cache[electionId] = electionObj; renderCandidates(electionObj); return; }
    if (cache[electionId]) { renderCandidates(cache[electionId]); return; }

    // fetch from Firestore or backend
    if (firebaseAvailable && firestoreModule && db) {
        try {
            const eRef = firestoreModule.doc(db, 'elections', electionId);
            const eSnap = await firestoreModule.getDoc(eRef);
            if (eSnap.exists()) {
                const e = eSnap.data(); cache[electionId] = e; renderCandidates(e); return;
            }
        } catch (err) { console.warn('Failed to load election from Firestore', err); }
    }
    if (navigator.onLine) {
        try {
            const res = await fetchWithLoader(`${API_BASE}/elections/${encodeURIComponent(electionId)}`);
            if (res.ok) {
                const d = await res.json();
                const e = d.election || d;
                const candidates = d.candidates || [];
                const obj = { title: e.title, description: e.description, candidates: candidates.map(c => ({ _id: c._id, name: c.name, party: c.party })), _isBackend: true };
                cache[electionId] = obj; window.electionSource = window.electionSource || {}; window.electionSource[electionId] = 'backend';
                renderCandidates(obj); return;
            }
        } catch (err) { console.warn('Failed to load election from backend', err); }
    }

    bodyEl.innerHTML = '<p>Could not load election details.</p>';
};


let firebaseAvailable = false;
let app, auth, db;
let authModule, firestoreModule; // references to dynamically imported modules
// expose a few flags/globals for other pages (admin.html) to use
window.firebaseAvailable = false;
window.authModule = null;
window.firestoreModule = null;
window.auth = null;
window.db = null;
// Ensure Firestore network is enabled when possible. Some environments
// may leave the client offline; enableNetwork allows us to recover so
// getDoc() succeeds after sign-in.
async function ensureFirestoreNetwork() {
    if (!firestoreModule || !db) return;
    try {
        if (typeof firestoreModule.enableNetwork === 'function') {
            await firestoreModule.enableNetwork(db);
        }
    } catch (e) {
        // ignore - enableNetwork may fail if offline or not supported
        console.warn('enableNetwork failed', e && e.message);
    }
}
// backend API base
// Smart detection: uses localhost in dev, Cloud Run in production
const API_BASE = (function() {
    // Use localhost for local development, otherwise use Render URL
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5002/api';
    }
    return 'https://ovms-yz85.onrender.com/api';
})();

const firebaseConfig = {
    apiKey: "AIzaSyBNvVG7Hlo6r7zxGn8UwJbWrGDh49aP6FY",
    authDomain: "ovms-81843.firebaseapp.com",
    projectId: "ovms-81843",
    storageBucket: "ovms-81843.firebasestorage.app",
    messagingSenderId: "924316611354",
    appId: "1:924316611354:web:70b52319725bcde506b2a3",
    measurementId: "G-8YMQ9MW0P9"
};

const OWNER_EMAIL = 'rajarshighs1@gmail.com';
const ADMIN_EMAIL = 'rajarshighs7@gmail.com';

function updateNetworkStatus() {
    if (!NETWORK_STATUS) return;
    const online = navigator.onLine;

    // Update the text and class based on the HTML's style
    if (NETWORK_STATUS) {
        NETWORK_STATUS.textContent = online ? 'Online ✔' : 'Offline — Using Demo Mode ⚠';
        NETWORK_STATUS.className = online ? 'online' : 'offline';
    }

    // Enable/disable google sign-in button
    const gBtn = document.getElementById('googleSignInBtn');
    if (gBtn) gBtn.disabled = !online;

    // Update the backend status
    updateBackendStatus();
}

window.addEventListener('online', async () => {
    updateNetworkStatus();
    await tryInitFirebase();
    await syncQueued();
});
window.addEventListener('offline', updateNetworkStatus);

updateNetworkStatus();

// try to load Firebase SDKs dynamically when online
async function tryInitFirebase() {
    if (!navigator.onLine) return;
    if (firebaseAvailable) return;
    try {
        const appModule = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js');
        // analytics optional
        try { await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js'); } catch (e) { /* ignore */ }
        authModule = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js');
        firestoreModule = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');

        app = appModule.initializeApp(firebaseConfig);
        try { auth = authModule.getAuth(app); } catch (e) { console.warn('auth init failed', e); }
        try { db = firestoreModule.getFirestore(app); } catch (e) { console.warn('firestore init failed', e); }

        // wire auth state change
        // wire auth state change (ONLY FOR INDEX.HTML)
        // We check if authSection exists, otherwise this breaks admin.html
        if (auth && authModule.onAuthStateChanged && document.getElementById('auth-section')) {
            authModule.onAuthStateChanged(auth, async (user) => {
                if (user) {
                    showVoterSectionFromFirebase(user);
                } else {
                    showAuthSection();
                }
            });
        }

        firebaseAvailable = true;
        // mirror to window so other pages/scripts can reference
        window.firebaseAvailable = true;
        window.authModule = authModule;
        window.firestoreModule = firestoreModule;
        window.auth = auth;
        window.db = db;
        console.info('Firebase initialized');
        // listen to ID token changes so we can re-exchange with backend when refreshed
        // listen to ID token changes (ONLY FOR INDEX.HTML)
        if (auth && authModule && authModule.onIdTokenChanged && document.getElementById('auth-section')) { // <-- SOLUTION
            authModule.onIdTokenChanged(auth, async (user) => {
                if (user) {
                    // attempt to exchange token with backend so backendToken stays current
                    tryExchangeFirebaseToken(user);
                }
            });
        }
    } catch (err) {
        firebaseAvailable = false;
        console.warn('Could not initialize Firebase (offline or blocked):', err);
        window.firebaseAvailable = false;
    }
}

// initial attempt
tryInitFirebase();

// ---------- UI helpers ----------
function updateNavbarAuth(user, isAdmin) {
    const navArea = document.getElementById('navAuthArea');
    if (!navArea) return;
    
    if (user) {
        let html = `<button class="btn btn-outline" onclick="logout()">Logout</button>`;
        if (isAdmin) {
            html = `<button class="btn btn-secondary" onclick="goAdmin()">Admin Panel</button>` + html;
        }
        navArea.innerHTML = html;
    } else {
        navArea.innerHTML = `<button class="btn btn-primary" onclick="showAuthSection()">Login</button>`;
    }
}

function showAuthSection() {
    if (!NETWORK_STATUS) return;
    if(authSection) authSection.style.display = 'block';
    if(voterSection) voterSection.style.display = 'none';
    if(adminSection) adminSection.style.display = 'none';
    if(voterNameSpan) voterNameSpan.textContent = '';
    const electionsDiv = getElectionsDiv();
    if (electionsDiv) electionsDiv.innerHTML = '';
    updateNavbarAuth(null, false);
}

function showVoterSectionLocal(user) {
    if (!authSection) return; 

    authSection.style.display = 'none';
    if(adminSection) adminSection.style.display = 'none';
    voterSection.style.display = 'block';
    voterNameSpan.textContent = user.name || user.email || 'Voter';
    
    // **FIX 2:** Default must be false.
    let showAdmin = false; 

    try {
        // Now this logic will work correctly
        if (user && (user.role === 'admin' || user.email === OWNER_EMAIL || user.email === ADMIN_EMAIL)) {
            showAdmin = true;
        }
        
        const raw = localStorage.getItem('backendUser');
        if (!showAdmin && raw) {
            try { 
                const bu = JSON.parse(raw); 
                if (bu && bu.role === 'admin') showAdmin = true; 
            } catch (e) { /* ignore */ }
        }
    } catch (e) { 
        showAdmin = false; 
    }

    console.log('[showVoterSectionLocal] showAdmin=' + showAdmin + ', user email=' + (user && user.email) + ', role=' + (user && user.role));
    updateNavbarAuth(user, showAdmin);
    
    // Show role badge instantly after login
    const role = (user && user.role) || (showAdmin ? 'admin' : 'user');
    console.log('[showVoterSectionLocal] Calling showRoleBadge with role=' + role);
    showRoleBadge(role);
    console.log('[showVoterSectionLocal] Role badge called successfully');
    
    if (window.loadElections) loadElections();
}
// Ensure admin button reflects persisted session or known owner emails
function updateAdminButtonFromStorage() {
    try {
        const adminBtn = document.getElementById('adminBtn');
        if (!adminBtn) return;
        // priority: persisted backendUser role, then localUser, then firebase currentUser email
        let show = false;
        try {
            const raw = localStorage.getItem('backendUser');
            if (raw) {
                const bu = JSON.parse(raw);
                if (bu && bu.role === 'admin') show = true;
                if (!show && bu && (bu.email === OWNER_EMAIL || bu.email === ADMIN_EMAIL)) show = true;
            }
        } catch (e) { /* ignore */ }
        if (!show) {
            try {
                const lu = JSON.parse(localStorage.getItem('localUser') || 'null');
                if (lu && (lu.email === OWNER_EMAIL || lu.email === ADMIN_EMAIL)) show = true;
            } catch (e) { /* ignore */ }
        }
        if (!show && window.firebaseAvailable && window.auth && window.auth.currentUser) {
            try { const e = window.auth.currentUser.email; if (e === OWNER_EMAIL || e === ADMIN_EMAIL) show = true; } catch (e) { }
        }
        updateAdminButtonVisibility(show);
    } catch (e) { console.warn('updateAdminButtonFromStorage failed', e); }
}

function showRoleBadge(role) {
    // Disabled intentionally to prevent UI overlap. The role is implied by the navbar buttons.
}

function hideRoleBadge() {
}

// Centralized function to update admin button visibility and styling
// This is called from all auth state changes to ensure consistent visibility
function updateAdminButtonVisibility(isAdmin) {
    try {
        const adminBtn = document.getElementById('adminBtn');
        console.log('[ADMIN BTN] updateAdminButtonVisibility called with isAdmin=' + isAdmin + ', button found=' + (!!adminBtn));
        if (!adminBtn) {
            console.warn('[ADMIN BTN] Button element not found in DOM');
            return;
        }
        adminBtn.classList.add('admin-panel-btn');
        // Force display: block with !important fallback if CSS doesn't override
        if (isAdmin) {
            adminBtn.style.display = 'block';
            adminBtn.style.visibility = 'visible';
            adminBtn.removeAttribute('disabled');
            console.log('[ADMIN BTN] Button set to VISIBLE for admin user');
        } else {
            adminBtn.style.display = 'none';
            console.log('[ADMIN BTN] Button hidden for non-admin user');
        }
    } catch (e) {
        console.warn('[ADMIN BTN] updateAdminButtonVisibility failed:', e);
    }
}

async function showVoterSectionFromFirebase(user) {
    if (!authSection) return; 

    authSection.style.display = 'none';
    if(adminSection) adminSection.style.display = 'none';
    voterSection.style.display = 'block';
    
    try {
        const uRef = firestoreModule.doc(db, 'users', user.uid);
        // ensure Firestore network is enabled (helps when client was offline)
        await ensureFirestoreNetwork();
        let uSnap;
        try {
            uSnap = await firestoreModule.getDoc(uRef);
        } catch (err) {
            // Retry once if Firestore client reports offline
            if (err && err.message && err.message.toLowerCase().includes('client is offline')) {
                console.warn('Firestore reported offline; retrying after enableNetwork');
                await ensureFirestoreNetwork();
                try { uSnap = await firestoreModule.getDoc(uRef); } catch (e) { throw e; }
            } else throw err;
        }
        
        const uData = (uSnap.exists() && uSnap.data()) ? uSnap.data() : {};
        const name = uData.name || user.email;
        voterNameSpan.textContent = name;

        let persistedBackendUser = null;
        try { 
            const raw = localStorage.getItem('backendUser'); 
            if (raw) persistedBackendUser = JSON.parse(raw); 
        } catch (e) { /* ignore */ }

        // This admin logic is correct
        const isAdmin = (uData.role === 'admin') ||
            (persistedBackendUser && persistedBackendUser.role === 'admin') ||
            (user.email === OWNER_EMAIL) ||
            (user.email === ADMIN_EMAIL);

        updateNavbarAuth(user, isAdmin);
        
    } catch (e) {
        console.error("Error in showVoterSectionFromFirebase:", e);
        if(voterNameSpan) voterNameSpan.textContent = user.email || 'Voter';
        
        let persistedBackendUser = null;
        try { 
            const raw = localStorage.getItem('backendUser'); 
            if (raw) persistedBackendUser = JSON.parse(raw); 
        } catch (err) { /* ignore */ }

        const isAdmin = (persistedBackendUser && persistedBackendUser.role === 'admin') ||
            (user.email === OWNER_EMAIL) ||
            (user.email === ADMIN_EMAIL);

        updateNavbarAuth(user, isAdmin);
    }

    // Load elections after showing the section
    if (window.loadElections) loadElections();
}

// navigate to admin page (Handled by goAdmin SPA helper above)

function getLocalElections() {
    const raw = localStorage.getItem('localElections');
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch(e) {}
    }
    // Rich realistic sample elections for instant testing & offline demo
    const sample = [
        {
            id: 'ls-2026-varanasi',
            title: 'Lok Sabha General Election — Varanasi Constituency',
            description: 'Constituency No. 77, Parliamentary General Election for Member of Parliament.',
            startDate: '2026-04-01',
            endDate: '2026-06-01',
            isActive: true,
            active: true,
            candidates: [
                { id: 'c-modi', name: 'Narendra Modi', party: 'Bharatiya Janata Party (BJP)' },
                { id: 'c-rai', name: 'Ajay Rai', party: 'Indian National Congress (INC)' },
                { id: 'c-lari', name: 'Athar Jamal Lari', party: 'Bahujan Samaj Party (BSP)' }
            ],
            counts: { 'c-modi': 142, 'c-rai': 98, 'c-lari': 24 }
        },
        {
            id: 'delhi-assembly-2026',
            title: 'Delhi Legislative Assembly — New Delhi Constituency',
            description: 'State Legislative Assembly election for representation in Vidhan Sabha.',
            startDate: '2026-02-15',
            endDate: '2026-05-15',
            isActive: true,
            active: true,
            candidates: [
                { id: 'c-kejriwal', name: 'Arvind Kejriwal', party: 'Aam Aadmi Party (AAP)' },
                { id: 'c-yadav', name: 'Sunil Yadav', party: 'Bharatiya Janata Party (BJP)' },
                { id: 'c-sabharwal', name: 'Romesh Sabharwal', party: 'Indian National Congress (INC)' }
            ],
            counts: { 'c-kejriwal': 85, 'c-yadav': 67, 'c-sabharwal': 19 }
        },
        {
            id: 'student-council-2026',
            title: 'National University Student Council Presidential Election',
            description: 'Annual election for the President of the Central University Student Council.',
            startDate: '2026-03-01',
            endDate: '2026-03-31',
            isActive: true,
            active: true,
            candidates: [
                { id: 'c-priya', name: 'Priya Sharma', party: 'Progressive Students Union' },
                { id: 'c-rahul', name: 'Rahul Verma', party: 'United Youth Alliance' },
                { id: 'c-ananya', name: 'Ananya Roy', party: 'Independent Youth Voice' }
            ],
            counts: { 'c-priya': 52, 'c-rahul': 48, 'c-ananya': 22 }
        }
    ];
    localStorage.setItem('localElections', JSON.stringify(sample));
    return sample;
}

function saveLocalElections(elections) {
    localStorage.setItem('localElections', JSON.stringify(elections));
}

function getVoteQueue() {
    return JSON.parse(localStorage.getItem('voteQueue') || '[]');
}

function pushVoteQueue(vote) {
    const q = getVoteQueue();
    q.push(vote);
    localStorage.setItem('voteQueue', JSON.stringify(q));
}

function clearVoteQueue() { localStorage.removeItem('voteQueue'); }

// ---------- Auth: register/login/logout (Firebase if available, otherwise local demo) ----------
window.register = async function register() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    if (!name || !email || !password) return alert('Please fill all registration fields.');

    if (firebaseAvailable && authModule && auth) {
        try {
            const userCred = await authModule.createUserWithEmailAndPassword(auth, email, password);
            const uid = userCred.user.uid;
            // **FIXED:** Added role: 'user' for consistency with Google Sign-In
            await firestoreModule.setDoc(firestoreModule.doc(db, 'users', uid), {
                name,
                email,
                role: 'user',
                createdAt: Date.now()
            });
            // after registration Firebase signs in the user; exchange token for backend JWT
            try { await tryExchangeFirebaseToken(auth.currentUser); } catch (e) { console.warn('Backend token exchange after register failed', e); }
            alert('Registration successful.');
        } catch (err) {
            console.error(err);
            alert('Registration error: ' + (err.message || err));
        }
    } else {
        // local demo registration
        const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
        if (users.find(u => u.email === email)) return alert('User already exists in demo mode.');
        users.push({ id: 'local-' + Date.now(), name, email, password });
        localStorage.setItem('localUsers', JSON.stringify(users));
        alert('Registered in demo mode. You can now login (offline).');
    }
};

window.login = async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) return alert('Please enter email and password.');

    if (firebaseAvailable && authModule && auth) {
        try {
            await authModule.signInWithEmailAndPassword(auth, email, password);
            // after Firebase sign-in, exchange ID token for backend JWT so backend-protected endpoints work
            try { await tryExchangeFirebaseToken(auth.currentUser); } catch (e) { console.warn('Backend token exchange after email login failed', e); }
        } catch (err) {
            console.error(err);
            alert('Login error: ' + (err.message || err));
        }
    } else {
        // try backend login first (if server running)
        if (navigator.onLine) {
            try {
                const res = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (res.ok && data.token) {
                    // store backend token and user
                    localStorage.setItem('backendToken', data.token);
                    localStorage.setItem('backendUser', JSON.stringify(data.user));
                    // show voter section using returned user
                    showVoterSectionLocal(data.user);
                    return;
                } else {
                    console.warn('Backend login failed', data);
                    // fall through to local demo
                }
            } catch (err) {
                console.warn('Backend login network error', err);
            }
        }
        // local demo login
        const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
        const u = users.find(x => x.email === email && x.password === password);
        if (!u) return alert('Invalid credentials for demo mode.');
        localStorage.setItem('localUser', JSON.stringify(u));
        showVoterSectionLocal(u);
    }
};

window.logout = async function logout() {
    localStorage.removeItem('localUser');
    localStorage.removeItem('backendToken');
    localStorage.removeItem('backendUser');
    sessionStorage.removeItem('hasRefreshedAfterLogin');
    try { hideRoleBadge(); } catch (e) { }

    if (firebaseAvailable && authModule && auth) {
        try { 
            await authModule.signOut(auth); 
            location.reload(); 
        } catch (err) { 
            console.error(err); 
            alert('Logout error: ' + (err.message || err)); 
        }
    } else {
        location.reload();
    }
};

// Google Sign-In (only works when online and Firebase initialized)
window.googleSignIn = async function googleSignIn() {
    if (!(firebaseAvailable && authModule && auth)) return alert('Google Sign-In requires network connection.');
    try {
        const provider = new authModule.GoogleAuthProvider();
        const result = await authModule.signInWithPopup(auth, provider);
        const gUser = result.user;
        // Ensure a users doc exists for this uid
            const uRef = firestoreModule.doc(db, 'users', gUser.uid);
            // Make sure Firestore network is enabled (helps when client was briefly offline)
            await ensureFirestoreNetwork();
            let uSnap;
            try {
                uSnap = await firestoreModule.getDoc(uRef);
            } catch (err) {
                if (err && err.message && err.message.toLowerCase().includes('client is offline')) {
                    console.warn('Firestore reported offline during googleSignIn; retrying');
                    await ensureFirestoreNetwork();
                    uSnap = await firestoreModule.getDoc(uRef);
                } else throw err;
            }
        // Users who sign in via Google should explicitly be saved as regular users (no admin/owner role)
        if (!uSnap.exists()) {
            await firestoreModule.setDoc(uRef, {
                name: gUser.displayName || '',
                email: gUser.email || '',
                photoURL: gUser.photoURL || '',
                role: 'user',
                provider: 'google',
                createdAt: Date.now()
            });
        } else {
            // If an existing doc exists, ensure we don't escalate role for Google sign-ins
            try {
                const data = uSnap.data() || {};
                if (data.role && data.role === 'admin') {
                    // keep existing admin role (do not downgrade automatically)
                } else {
                    // ensure provider is recorded and role is at least 'user'
                    await firestoreModule.setDoc(uRef, Object.assign({}, data, { role: data.role || 'user', provider: data.provider || 'google' }));
                }
            } catch (e) { /* ignore */ }
        }
        // Exchange Firebase ID token for backend JWT so backend-protected endpoints work seamlessly
        try {
            const idToken = await authModule.getIdToken(gUser);
            if (idToken && navigator.onLine) {
                try {
                    const res = await fetch(`${API_BASE}/auth/firebase`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken })
                    });
                    const data = await res.json();
                    if (res.ok && data.token) {
                        localStorage.setItem('backendToken', data.token);
                        if (data.user) localStorage.setItem('backendUser', JSON.stringify(data.user));
                        console.info('Obtained backend token via Firebase login');
                    } else {
                        console.warn('Backend firebase login failed', data);
                    }
                } catch (err) {
                    console.warn('Failed to call backend firebase login', err);
                }
            }
        } catch (err) { console.warn('Could not get Firebase ID token', err); }
    } catch (err) {
        console.error('Google sign-in error', err);
        alert('Google sign-in error: ' + (err.message || err));
    }
};

// Exchange Firebase ID token with backend and persist backend token/user
async function tryExchangeFirebaseToken(user) {
    if (!user) return;
    if (!authModule || !auth) return;
    try {
        const idToken = await authModule.getIdToken(user);
        if (!idToken) return;
        if (!navigator.onLine) return;
        try {
            const res = await fetch(`${API_BASE}/auth/firebase`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
            const data = await res.json();
            if (res.ok && data.token) {
                localStorage.setItem('backendToken', data.token);
                if (data.user) localStorage.setItem('backendUser', JSON.stringify(data.user));
                updateBackendStatus();
                console.info('Backend token obtained via firebase exchange');
                // Update UI immediately if backend returned user info (so admin button appears)
                try { if (data.user && window.showVoterSectionLocal) window.showVoterSectionLocal(data.user); } catch (e) { /* ignore */ }
                return true;
            } else {
                console.warn('Backend firebase exchange failed', data);
                updateBackendStatus(false, data.message || 'token exchange failed');
            }
        } catch (err) {
            console.warn('Backend token exchange network error', err);
            updateBackendStatus(false, err.message || 'network error');
        }
    } catch (err) { console.warn('Failed to get ID token', err); }
    return false;
}

// update small backend status UI (optional param ok to display explicit failure)
function updateBackendStatus(ok = undefined, errMsg = null) {
    const el = document.getElementById('backendStatus');
    if (!el) return;
    // if ok undefined, determine from network + token presence
    if (typeof ok === 'undefined') {
        if (!navigator.onLine) { el.textContent = 'Backend: offline'; el.style.color = '#a00'; return; }
        const token = localStorage.getItem('backendToken');
        if (token) { el.textContent = 'Backend: connected (token present)'; el.style.color = '#2a7a2a'; return; }
        // attempt a quick ping
        fetch(`${API_BASE}/`).then(r => { if (r.ok) { el.textContent = 'Backend: reachable (no token)'; el.style.color = '#2a7a2a'; } else { el.textContent = 'Backend: reachable but returned error'; el.style.color = '#a00'; } }).catch(() => { el.textContent = 'Backend: unreachable'; el.style.color = '#a00'; });
        return;
    }
    el.textContent = ok ? 'Backend: connected' : ('Backend: ' + (errMsg || 'unreachable or token exchange failed'));
    el.style.color = ok ? '#2a7a2a' : '#a00';
}

// ---------- Elections and voting ----------
window.loadElections = async function loadElections() {
    const electionsDiv = getElectionsDiv();
    if (electionsDiv) electionsDiv.innerHTML = 'Loading...';
    
    const isAdminPage = adminSection && adminSection.style.display === 'block';
    const endpoint = isAdminPage ? `${API_BASE}/elections` : `${API_BASE}/elections/active`;

    // Try to load analytics stats in background if on admin page
    if(isAdminPage && window.loadAnalytics) window.loadAnalytics();

    // **FIX: Clear election source cache to force fresh load**
    window.electionSource = {};

    // prefer Firebase when available
    if (firebaseAvailable && firestoreModule && db) {
        try {
            const snap = await firestoreModule.getDocs(firestoreModule.collection(db, 'elections'));
            const showView = false;
            if (electionsDiv) electionsDiv.innerHTML = '';
            if (snap.empty) {
                // If Firestore has no elections, try backend before giving up
                if (navigator.onLine) {
                    try {
                        // Use the new endpoint
                        const res = await fetch(endpoint);
                        if (res.ok) {
                            const list = await res.json();
                            if (Array.isArray(list) && list.length > 0) {
                                if (electionsDiv) electionsDiv.innerHTML = '';
                                const showView = false;
                                list.forEach(e => {
                                                    const eid = e._1d || e._id || e.id;
                                                    // prefer candidates returned by backend when available
                                                    const rawCandidates = e.candidates || e.candidate || e.candidatesList || [];
                                                    const candidates = (rawCandidates || []).map(c => ({ _id: c._id || c.id, name: c.name, party: c.party }));
                                                    const obj = { title: e.title, description: e.description, candidates: candidates, _isBackend: true };
                                                    window.electionSource = window.electionSource || {};
                                                    window.electionSource[eid] = 'backend';
                                                    renderElectionCard(eid, obj, showView);
                                                });
                                return;
                            }
                        }
                    } catch (err) { console.warn('Backend fetch failed while Firestore empty', err); }
                }
                if (electionsDiv) electionsDiv.innerHTML = '<p>No elections found.</p>';
                return;
            }
            let rendered = 0;
            snap.forEach(docSnap => {
                const e = docSnap.data();
                const eid = docSnap.id;
                
                // **FIX 1 (applied):** Only check for 'active' if NOT on admin page
                if (e.active === false && !isAdminPage) return;
                
                renderElectionCard(eid, e, showView);
                rendered++;
            });
            // if Firestore had documents but none were active, try backend active endpoint as a fallback
            if (rendered === 0 && navigator.onLine) {
                try {
                    // Use the new endpoint
                    const res2 = await fetch(endpoint);
                    if (res2.ok) {
                        const list = await res2.json();
                        if (Array.isArray(list) && list.length > 0) {
                            if (electionsDiv) electionsDiv.innerHTML = '';
                            list.forEach(e => {
                                    const eid = e._id || e.id;
                                    const rawCandidates = e.candidates || e.candidate || e.candidatesList || [];
                                    const candidates = (rawCandidates || []).map(c => ({ _id: c._id || c.id, name: c.name, party: c.party }));
                                    const obj = { title: e.title, description: e.description, candidates: candidates, _isBackend: true };
                                    window.electionSource = window.electionSource || {};
                                    window.electionSource[eid] = 'backend';
                                    renderElectionCard(eid, obj, showView);
                                });
                            return;
                        }
                    }
                } catch (err) { console.warn('Backend fetch failed in fallback', err); }
            }
        } catch (err) {
            console.error(err);
            if (electionsDiv) electionsDiv.innerHTML = '<p>Error loading elections.</p>';
        }
    } else {
        // try backend first (your seeded backend)
        if (navigator.onLine) {
            try {
                // **FIX 1 (applied):** Use the new endpoint
                const res = await fetch(endpoint);
                if (res.ok) {
                    const list = await res.json();
                    if (electionsDiv) electionsDiv.innerHTML = '';
                    const showView = false;
                    list.forEach(e => {
                            const eid = e._id || e.id;
                            const rawCandidates = e.candidates || e.candidate || e.candidatesList || [];
                            const candidates = (rawCandidates || []).map(c => ({ _id: c._id || c.id, name: c.name, party: c.party }));
                            const obj = { title: e.title, description: e.description, candidates: candidates, _isBackend: true };
                            window.electionSource = window.electionSource || {};
                            window.electionSource[eid] = 'backend';
                            renderElectionCard(eid, obj, showView);
                        });
                    return;
                }
            } catch (err) {
                console.warn('Backend fetch failed, falling back to local demo', err);
            }
        }
        // offline/demo mode: load from localStorage
        const list = getLocalElections();
        const electionsDiv2 = getElectionsDiv();
        if (electionsDiv2) electionsDiv2.innerHTML = '';
        list.forEach(e => renderElectionCard(e.id, e, false));
    }
};

window.confirmAndVote = function(eid, cid, cNameEnc, partyEnc, isBackendElection) {
    const cName = decodeURIComponent(cNameEnc);
    const party = decodeURIComponent(partyEnc);
    const conf = confirm(`🗳️ CONFIRM YOUR BALLOT\n\nElection ID: ${eid}\nCandidate: ${cName}\nParty: ${party}\n\nDo you want to confirm your vote? In accordance with the voting procedure, your vote is secret and cannot be reversed.`);
    if (!conf) return;

    if (isBackendElection) {
        return window.voteBackend(eid, cid);
    } else {
        return window.vote(eid, cid);
    }
};

function renderElectionCard(eid, e, showViewButton = false) {
    const title = e.title || 'Constituency General Election';
    const description = e.description || 'General Election Ballot';
    const candidates = e.candidates || [];
    const card = document.createElement('div');
    card.className = 'election-card';

    // Dates formatting
    let datesText = '';
    if (e.startDate || e.endDate) {
        const s = e.startDate ? new Date(e.startDate).toLocaleDateString() : 'Active';
        const end = e.endDate ? new Date(e.endDate).toLocaleDateString() : 'Ongoing';
        datesText = `📅 Poll Window: ${s} — ${end}`;
    }

    let html = `
        <div class="election-card-header">
            <div>
                <h3>${title}</h3>
                <p class="muted" style="font-size:0.85rem; margin-top:3px;">${description}</p>
            </div>
            <span class="status-badge online" style="font-size:0.75rem; flex-shrink:0;">Active Ballot</span>
        </div>
    `;

    if (datesText) {
        html += `<div class="election-dates">${datesText}</div>`;
    }

    if (showViewButton) {
        html += `<div style="margin-bottom:8px;"><button class="btn btn-outline btn-sm" onclick="window.location.href='voting.html?electionId=${encodeURIComponent(eid)}'">Open Official Ballot Page</button></div>`;
    }

    // Determine admin status
    try {
        const backendRaw = localStorage.getItem('backendUser');
        let backendUser = null;
        try { backendUser = backendRaw ? JSON.parse(backendRaw) : null; } catch (err) { backendUser = null; }
        const localRaw = localStorage.getItem('localUser');
        let localUser = null;
        try { localUser = localRaw ? JSON.parse(localRaw) : null; } catch (err) { localUser = null; }
        
        const isBackendAdmin = backendUser && backendUser.role === 'admin';
        const isOwnerEmail = (backendUser && (backendUser.email === OWNER_EMAIL || backendUser.email === ADMIN_EMAIL)) || 
                             (localUser && (localUser.email === OWNER_EMAIL || localUser.email === ADMIN_EMAIL));
        const isAdmin = !!(isBackendAdmin || isOwnerEmail || (localStorage.getItem('ovmsActiveRole') === 'admin'));

        if (isAdmin) {
            html += `<div class="election-id-admin"><strong>ELECTION ID:</strong> ${eid}</div>`;
            html += `<div class="admin-controls">
                        <button class="btn btn-outline btn-sm" onclick="editElection('${eid}')">Edit</button>
                        <button class="btn btn-outline btn-sm" onclick="toggleElectionActive('${eid}')">Toggle Active</button>
                        <button class="btn btn-outline btn-sm" onclick="showResults('${eid}')">Tally Results</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteElection('${eid}')">Delete</button>
                     </div>`;
        }
    } catch (err) { console.warn('Admin control render error', err); }

    // Check if voter has already voted in this election
    const localUser = JSON.parse(localStorage.getItem('localUser') || 'null');
    const localVotes = JSON.parse(localStorage.getItem('localVotes') || '[]');
    const existingVote = localUser ? localVotes.find(v => v.userEmail === localUser.email && String(v.electionId) === String(eid)) : null;

    html += `<div class="candidate-list" id="candidates-${eid}">`;
    if (candidates.length === 0) {
        html += '<p class="muted" style="padding:10px 0;">No nominated candidates found for this ballot.</p>';
    } else {
        candidates.forEach((c, idx) => {
            const party = c.party || c.partyName || 'Independent';
            const cid = c.id || c._id;
            const isBackendElection = !!e._isBackend || (window.electionSource && window.electionSource[eid] === 'backend');

            const isAdminRole = (localStorage.getItem('ovmsActiveRole') === 'admin');
            const hasVotedForThis = existingVote && String(existingVote.candidateId) === String(cid);
            const hasVotedOther = existingVote && String(existingVote.candidateId) !== String(cid);

            let actionButtonHtml = '';
            let lampClass = 'evm-lamp';

            if (isAdminRole) {
                actionButtonHtml = `<button class="btn btn-outline btn-sm" disabled title="Administrators cannot cast ballots">Admin</button>`;
            } else if (hasVotedForThis) {
                lampClass = 'evm-lamp voted';
                actionButtonHtml = `<button class="btn btn-evm-vote btn-voted" disabled>VOTED ✔</button>`;
            } else if (hasVotedOther) {
                actionButtonHtml = `<button class="btn btn-outline btn-sm" disabled style="opacity:0.55;">Ballot Cast</button>`;
            } else {
                actionButtonHtml = `<button class="btn btn-evm-vote" onclick="confirmAndVote('${eid}','${cid}','${encodeURIComponent(c.name)}','${encodeURIComponent(party)}',${isBackendElection})">Vote</button>`;
            }

            html += `
                <div class="candidate-item">
                    <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
                        <span class="${lampClass}" id="lamp-${eid}-${cid}" title="EVM Status Indicator"></span>
                        <div class="candidate-info">
                            <span class="candidate-name">
                                ${idx + 1}. ${c.name}
                                <small id="count-${eid}-${cid}" style="margin-left:6px; color:var(--deepgreen); font-weight:700;"></small>
                            </span>
                            <div class="candidate-party">
                                <span class="party-tag">${party}</span>
                            </div>
                        </div>
                    </div>
                    ${actionButtonHtml}
                </div>
            `;
        });
    }
    html += `</div>`;
    card.innerHTML = html;

    const container = getElectionsDiv();
    if (container) container.appendChild(card);

    // Clicking the card outside of buttons navigates to single election focus mode (voting.html)
    card.addEventListener('click', (ev) => {
        const tg = ev.target;
        if (tg && (tg.tagName === 'BUTTON' || (tg.closest && tg.closest('button')) || tg.tagName === 'INPUT')) return;
        try {
            window.location.href = `voting.html?electionId=${encodeURIComponent(eid)}`;
        } catch (err) {
            console.warn('Navigation to voting.html failed', err);
        }
    });

    // Populate counts if already stored
    try {
        const counts = e.counts || {};
        if (counts && Object.keys(counts).length > 0) {
            (e.candidates || []).forEach(c => {
                const cid = c.id || c._id;
                const el = document.getElementById(`count-${eid}-${cid}`);
                if (el && counts[cid] !== undefined) el.textContent = `(${counts[cid]} votes)`;
            });
        }
    } catch (err) { /* ignore */ }
}

// Fetch results for an election and update candidate counts in the UI
window.fetchAndShowResults = async function fetchAndShowResults(electionId) {
    try {
        const res = await fetch(`${API_BASE}/elections/${encodeURIComponent(electionId)}/results`);
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;
        data.forEach(r => {
            const cid = r.candidate._id || r.candidate;
            const el = document.getElementById(`count-${electionId}-${cid}`);
            if (el) el.textContent = `(${r.votes})`;
        });
    } catch (err) { console.warn('Failed to fetch/show results', err); }
};

// Admin: open a simple prompt to edit election metadata and send PUT to backend
window.editElection = async function editElection(electionId) {
    const token = localStorage.getItem('backendToken');
    if (!token) return alert('Admin token missing. Please login to admin.');
    try {
        const res = await fetchWithLoader(`${API_BASE}/elections/${encodeURIComponent(electionId)}`);
        if (!res.ok) return alert('Failed to fetch election details');
        const data = await res.json();
        const e = data.election || data;
        const updated = await showEditModal(e);
        if (!updated) return; // cancelled
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
        const put = await fetchWithLoader(`${API_BASE}/elections/${encodeURIComponent(electionId)}`, { method: 'PUT', headers, body: JSON.stringify(updated) });
        if (put.ok) { alert('Election updated'); if (window.loadElections) setTimeout(() => window.loadElections(), 200); }
        else { const d = await put.json(); alert('Update failed: ' + (d.message || put.status)); }
    } catch (err) { console.error(err); alert('Edit failed'); }
};

// Admin: toggle isActive quickly
window.toggleElectionActive = async function toggleElectionActive(electionId) {
    const token = localStorage.getItem('backendToken');
    if (!token) return alert('Admin token missing. Please login to admin.');
    try {
        // fetch current
        const res = await fetchWithLoader(`${API_BASE}/elections/${encodeURIComponent(electionId)}`);
        if (!res.ok) return alert('Failed to fetch election');
        const data = await res.json();
        const e = data.election || data;
        const newActive = !e.isActive;
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
        const put = await fetchWithLoader(`${API_BASE}/elections/${encodeURIComponent(electionId)}`, { method: 'PUT', headers, body: JSON.stringify({ isActive: newActive }) });
        if (put.ok) { alert('Toggled active: ' + newActive); if (window.loadElections) setTimeout(() => window.loadElections(), 200); }
        else { const d = await put.json(); alert('Toggle failed: ' + (d.message || put.status)); }
    } catch (err) { console.error(err); alert('Toggle failed'); }
};

// Show results for an election (admin)
window.showResults = async function showResults(electionId) {
    try {
        const res = await fetchWithLoader(`${API_BASE}/elections/${encodeURIComponent(electionId)}/results`);
        if (!res.ok) return alert('Failed to fetch results');
        const data = await res.json();
        // display a simple modal-like alert with results
        let txt = 'Results:\n';
        data.forEach(r => { txt += `${r.candidate.name}: ${r.votes}\n`; });
        alert(txt);
    } catch (err) { console.error(err); alert('Failed to fetch results'); }
};

// Delete an election (admin)
window.deleteElection = async function deleteElection(electionId) {
    const token = localStorage.getItem('backendToken');
    if (!token) return alert('Admin token missing. Please login to admin.');
    if (!confirm('Delete election and all its candidates/votes? This cannot be undone.')) return;
    try {
        const res = await fetchWithLoader(`${API_BASE}/elections/${encodeURIComponent(electionId)}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
        if (res.ok) { alert('Deleted'); if (window.loadElections) setTimeout(() => window.loadElections(), 200); }
        else { const d = await res.json(); alert('Delete failed: ' + (d.message || res.status)); }
    } catch (err) { console.error(err); alert('Delete failed'); }
};

// navigate to voting page for a single election
window.viewElection = function viewElection(electionId) {
    window.location.href = `voting.html?electionId=${encodeURIComponent(electionId)}`;
};

// load a single election by id (used on voting.html)
window.loadElectionById = async function loadElectionById(electionId) {
    const container = getElectionsDiv();
    if (container) container.innerHTML = 'Loading election...';
    if (firebaseAvailable && firestoreModule && db) {
        try {
            const eRef = firestoreModule.doc(db, 'elections', electionId);
            await ensureFirestoreNetwork();
            let eSnap;
            try {
                eSnap = await firestoreModule.getDoc(eRef);
            } catch (err) {
                if (err && err.message && err.message.toLowerCase().includes('client is offline')) {
                    console.warn('Firestore offline when loading election; retrying');
                    await ensureFirestoreNetwork();
                    eSnap = await firestoreModule.getDoc(eRef);
                } else throw err;
            }
            if (!eSnap.exists()) {
                if (container) container.innerHTML = '<p>Election not found.</p>';
                return;
            }
            if (container) container.innerHTML = '';
            renderElectionCard(electionId, eSnap.data(), false);
        } catch (err) {
            console.error(err);
            // **FIXED:** Changed `electionsDiv` to `container`
            if (container) container.innerHTML = '<p>Error loading election.</p>';
        }
    } else {
        // try backend first
        if (navigator.onLine) {
            try {
                const res = await fetch(`${API_BASE}/elections/${encodeURIComponent(electionId)}`);
                if (res.ok) {
                    const data = await res.json();
                    // backend returns { election, candidates }
                    const e = data.election;
                    const candidates = data.candidates || [];
                    if (container) container.innerHTML = '';
                    // attach candidates into object and mark as backend-sourced
                    const obj = { title: e.title, description: e.description, candidates: candidates.map(c => ({ _id: c._id, name: c.name, party: c.party })), _isBackend: true };
                    // mark source so vote handler uses backend endpoint
                    window.electionSource = window.electionSource || {};
                    window.electionSource[electionId] = 'backend';
                    renderElectionCard(electionId, obj, false);
                    // update counts next
                    setTimeout(() => { if (window.fetchAndShowResults) window.fetchAndShowResults(electionId); }, 250);
                    return;
                }
            } catch (err) {
                console.warn('Backend election fetch failed, falling back to local', err);
            }
        }
        // offline/demo
        const list = getLocalElections();
        const e = list.find(x => x.id === electionId);
        if (!e) {
            if (container) container.innerHTML = '<p>Election not found (offline).</p>';
            return;
        }
        if (container) container.innerHTML = '';
        renderElectionCard(electionId, e, false);
    }
};

// **FIXED:** Helper function to determine which refresh function to call
function refreshCurrentView(electionId) {
    try {
        if (window.location.pathname.includes('voting.html')) {
            if (window.loadElectionById) setTimeout(() => window.loadElectionById(electionId), 200);
        } else {
            if (window.loadElections) setTimeout(() => window.loadElections(), 200);
        }
    } catch (e) {
        console.warn('Failed to refresh UI', e);
    }
}

// vote with double-vote protection per election (best-effort offline)
window.vote = async function vote(electionId, candidateId) {
    // determine identity
    if (firebaseAvailable && auth && auth.currentUser) {
        try {
            const user = auth.currentUser;
            const votesRef = firestoreModule.collection(db, 'votes');
            const q = firestoreModule.query(votesRef, firestoreModule.where('userId', '==', user.uid), firestoreModule.where('electionId', '==', electionId));
            const qSnap = await firestoreModule.getDocs(q);
            if (!qSnap.empty) return alert('You have already voted in this election.');

            await firestoreModule.addDoc(firestoreModule.collection(db, 'votes'), { userId: user.uid, electionId, candidateId, timestamp: Date.now() });
            // increment counts if possible
            try { await firestoreModule.updateDoc(firestoreModule.doc(db, 'elections', electionId), { [`counts.${candidateId}`]: firestoreModule.increment(1) }); } catch (e) { /* ignore */ }
            // emit a cross-window event so voting pages can show a toast
            try { window.dispatchEvent(new CustomEvent('vote:success', { detail: { message: 'Vote submitted. Thank you.' } })); } catch (e) { }
            alert('Vote submitted. Thank you.');
            refreshCurrentView(electionId); // **FIXED:** Call correct refresh
            return;
        } catch (err) {
            console.error(err);
            alert('Vote error: ' + (err.message || err));
            return;
        }
    }

    // offline/local demo: check local user
    const localUser = JSON.parse(localStorage.getItem('localUser') || 'null');
    if (!localUser) return alert('You must be logged in to vote (demo).');

    // check if already voted locally
    const votes = JSON.parse(localStorage.getItem('localVotes') || '[]');
    if (votes.find(v => v.userEmail === localUser.email && v.electionId === electionId)) return alert('You have already voted (demo).');

    const voteObj = { userEmail: localUser.email, electionId, candidateId, timestamp: Date.now(), synced: false };
    votes.push(voteObj);
    localStorage.setItem('localVotes', JSON.stringify(votes));

    // update local election counts
    const elections = getLocalElections();
    const e = elections.find(x => x.id === electionId);
    if (e) {
        e.counts = e.counts || {};
        e.counts[candidateId] = (e.counts[candidateId] || 0) + 1;
        saveLocalElections(elections);
    }

    // push to queue to attempt sync when online
    pushVoteQueue({ userEmail: localUser.email, electionId, candidateId, timestamp: Date.now() });
    try { window.dispatchEvent(new CustomEvent('vote:success', { detail: { message: 'Vote recorded locally (offline). Will sync when online.' } })); } catch (e) { }
    alert('Vote recorded locally (offline/demo). It will attempt to sync when you are back online.');
    refreshCurrentView(electionId); // **FIXED:** Call correct refresh
};

// Vote against backend API (used when election was loaded from backend)
window.voteBackend = async function voteBackend(electionId, candidateId) {
    try {
        const backendToken = localStorage.getItem('backendToken');
        if (!backendToken || backendToken.startsWith('mock-')) {
            // Smooth offline/test demo fallback without login walls
            return window.vote(electionId, candidateId);
        }
        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + backendToken
        };
        const res = await fetch(`${API_BASE}/elections/${encodeURIComponent(electionId)}/vote`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ candidateId })
        });
        if (res.status === 401 || res.status === 403) {
            // Auth expired or invalid token -> record locally
            return window.vote(electionId, candidateId);
        }
        const data = await res.json();
        if (res.ok) {
            const msg = data.message || 'Vote submitted successfully!';
            try { window.dispatchEvent(new CustomEvent('vote:success', { detail: { message: msg } })); } catch (e) { }
            if (typeof showToast === 'function') showToast(msg, 'success');
            else alert(msg);
            refreshCurrentView(electionId);
            try { if (window.showResults) setTimeout(() => window.showResults(electionId), 400); } catch (e) { }
        } else {
            const msg = data.message || 'Vote could not be processed';
            try { window.dispatchEvent(new CustomEvent('vote:error', { detail: { message: msg } })); } catch (e) { }
            if (typeof showToast === 'function') showToast(msg, 'error');
            else alert(msg);
        }
    } catch (err) {
        console.warn('Backend vote network error, recording locally', err);
        return window.vote(electionId, candidateId);
    }
};

// Attempt to sync queued votes to Firestore when firebase is available
async function syncQueued() {
    if (!firebaseAvailable || !firestoreModule || !db) return;
    const q = getVoteQueue();
    if (!q || q.length === 0) return;
    console.info('Syncing', q.length, 'queued votes...');
    for (const v of q) {
        try {
            // naive sync: create a vote doc with user email (if user has no uid mapping this may create duplicates)
            await firestoreModule.addDoc(firestoreModule.collection(db, 'votes'), { userEmail: v.userEmail, electionId: v.electionId, candidateId: v.candidateId, timestamp: v.timestamp });
        } catch (err) {
            console.warn('Failed to sync vote', v, err);
            // stop trying further to avoid infinite loop
            return;
        }
    }
    clearVoteQueue();
    // mark local votes as synced
    localStorage.removeItem('localVotes');
    alert('Queued votes synced to server.');
}

// expose a helper to clear demo data (for development)
window.__clearDemoData = function () {
    localStorage.removeItem('localElections');
    localStorage.removeItem('localUsers');
    localStorage.removeItem('localUser');
    localStorage.removeItem('localVotes');
    localStorage.removeItem('voteQueue');
    alert('Demo data cleared.');
};

// On load, activate role switcher and load elections directly
window.addEventListener('load', () => {
    console.log('[PAGE LOAD] Initializing role-based voting platform...');

    // This page-aware logic is fine to run on all pages
    try {
        const path = window.location.pathname;

        if (path.includes('voting.html')) {
            // This is the voting page, load the specific election from URL param
            const params = new URLSearchParams(window.location.search);
            const eId = params.get('electionId');
            if (eId && window.loadElectionById) {
                setTimeout(() => window.loadElectionById(eId), 150);
            }
        } else {
            // Main page (index.html): activate role directly without login walls
            const savedRole = localStorage.getItem('ovmsActiveRole') || 'voter';
            if (window.switchTestRole) {
                window.switchTestRole(savedRole);
            }
            // Always load elections on the main page
            setTimeout(() => {
                try { if (window.loadElections) window.loadElections(); } catch (e) {
                    console.warn('loadElections failed on main page load', e);
                }
            }, 100);
        }
    } catch (e) { console.warn('Init error', e); }
});

// ---------------- Theme switcher (runtime) ----------------
// Inject a small floating theme switcher so user can toggle themes across pages.
(function initThemeSwitcher() {
    const themes = {
        default: {
            '--saffron': '#FF671F',
            '--deepgreen': '#046A38',
            '--card': '#ffffff',
            '--muted': '#6b7280',
            '--shadow': '0 6px 25px rgba(0,0,0,0.12)',
            '--font-family': '"Poppins", sans-serif'
        },
        dark: {
            '--saffron': '#FF8A4B',
            '--deepgreen': '#0b8a4a',
            '--card': '#0f1724',
            '--muted': '#9aa4b2',
            '--shadow': '0 6px 25px rgba(0,0,0,0.6)',
            '--font-family': '"Poppins", sans-serif'
        }
    };

    function applyTheme(name) {
        const t = themes[name] || themes.default;
        const root = document.documentElement;
        Object.keys(t).forEach(k => root.style.setProperty(k, t[k]));
        localStorage.setItem('ovmsTheme', name);
    }

    function currentTheme() { return localStorage.getItem('ovmsTheme') || 'default'; }

    // create UI
    try {
        const existing = document.getElementById('ovms-theme-switcher');
        if (existing) return; // already injected

        const style = document.createElement('style');
        style.textContent = `
            #ovms-theme-switcher{position:fixed;right:14px;bottom:18px;z-index:99999;font-family:var(--font-family);} 
            #ovms-theme-switcher button{background:var(--saffron);color:#fff;border:none;padding:8px 10px;border-radius:8px;cursor:pointer;box-shadow:var(--shadow)}
            #ovms-theme-switcher .menu{display:none;background:var(--card);padding:8px;border-radius:8px;box-shadow:var(--shadow);margin-top:8px}
            #ovms-theme-switcher .menu button{display:block;width:100%;margin:6px 0;padding:8px;border-radius:6px;background:transparent;border:1px solid rgba(0,0,0,0.06);cursor:pointer}
        `;
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.id = 'ovms-theme-switcher';
        const btn = document.createElement('button');
        btn.textContent = 'Theme';
        const menu = document.createElement('div');
        menu.className = 'menu';
        const defBtn = document.createElement('button'); defBtn.textContent = 'Default';
        const darkBtn = document.createElement('button'); darkBtn.textContent = 'Dark';
        menu.appendChild(defBtn); menu.appendChild(darkBtn);
        container.appendChild(btn); container.appendChild(menu);
        document.body.appendChild(container);

        btn.addEventListener('click', () => { menu.style.display = (menu.style.display === 'block') ? 'none' : 'block'; });
        defBtn.addEventListener('click', () => { applyTheme('default'); menu.style.display = 'none'; });
        darkBtn.addEventListener('click', () => { applyTheme('dark'); menu.style.display = 'none'; });

        // apply persisted theme
        applyTheme(currentTheme());
    } catch (e) { console.warn('Theme switcher injection failed', e); }
})();

/* ==========================
   Loader + Success helpers
   ========================== */
window.showLoader = function (opts = {}) {
    if (document.getElementById('loader')) return;
    const useChakra = opts.chakra || false;
    const loaderHTML = useChakra ? `
        <div class="loader-container" id="loader">
            <div class="chakra-wheel" id="chakraWheel" aria-hidden="true">
                <svg width="90" height="90" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                    <g fill="none" stroke="var(--deepgreen)" stroke-width="2">
                        <circle cx="32" cy="32" r="12" stroke="var(--saffron)" stroke-width="2" fill="none"></circle>
                        <g stroke="var(--deepgreen)">
                            <circle cx="32" cy="32" r="28" stroke-width="2" fill="none"></circle>
                            <g transform="translate(32,32)">
                                ${Array.from({ length: 24 }).map((_, i) => `<line x1="0" y1="-26" x2="0" y2="-14" transform="rotate(${i * 15})"></line>`).join('')}
                            </g>
                        </g>
                    </g>
                </svg>
            </div>
        </div>
    ` : `
        <div class="loader-container" id="loader">
            <div class="india-loader"></div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', loaderHTML);
};

window.hideLoader = function () {
    const loader = document.getElementById('loader');
    if (loader) loader.remove();
};

// show a small success tick overlay + optional message
window.showSuccessTick = function (message) {
    if (document.getElementById('successTick')) return;
    const html = `
        <div id="successTick" style="position:fixed;left:50%;top:30%;transform:translateX(-50%);z-index:2100;">
            <div style="background:#fff;padding:18px;border-radius:12px;box-shadow:var(--shadow);display:flex;flex-direction:column;align-items:center;gap:8px;">
                <svg width="72" height="72" viewBox="0 0 52 52">
                    <circle cx="26" cy="26" r="25" fill="none" stroke="#e6f4ea" stroke-width="2"></circle>
                    <path fill="none" stroke="var(--deepgreen)" stroke-width="3" d="M14 27 l7 7 l17 -17" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                <div style="font-weight:700;color:var(--deepgreen);">${message || 'Success'}</div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(() => { const el = document.getElementById('successTick'); if (el) el.remove(); }, 1800);
};

// fetch wrapper that shows loader during network calls (keeps signature similar to fetch)
async function fetchWithLoader(url, options = {}) {
    try {
        showLoader();
        const response = await fetch(url, options);
        return response;
    } finally {
        // keep loader visible for minimum UX time and hide smoothly
        setTimeout(hideLoader, 300);
    }
}

window.fetchWithLoader = fetchWithLoader;

// ==========================================
// ADMIN DASHBOARD SPECIFIC FUNCTIONS
// ==========================================

window.createElection = async function createElection() {
    const token = localStorage.getItem('backendToken') || 'mock-admin-token-2026';
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('desc').value.trim();
    const startDate = document.getElementById('start').value;
    const endDate = document.getElementById('end').value;

    if (!title) return alert("Title is required");

    const body = { title, description, startDate, endDate, isActive: true };

    try {
        const res = await window.fetchWithLoader(`${API_BASE}/elections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            if (typeof showToast === 'function') showToast("Election created successfully!", "success");
            else alert("Election created successfully!");
            if (window.loadElections) window.loadElections();
            if (window.showAdminTab) window.showAdminTab('manageElections');
            return;
        }
    } catch (err) {
        console.warn('Backend election creation fallback to local', err);
    }

    // Resilient local demo fallback
    const elections = getLocalElections();
    const newId = 'el-' + Date.now();
    elections.unshift({
        id: newId,
        title,
        description,
        startDate,
        endDate,
        isActive: true,
        active: true,
        candidates: [],
        counts: {}
    });
    saveLocalElections(elections);
    if (typeof showToast === 'function') showToast("Election created successfully!", "success");
    else alert("Election created successfully!");
    if (window.loadElections) window.loadElections();
    if (window.showAdminTab) window.showAdminTab('manageElections');
};

window.addCandidate = async function addCandidate() {
    const token = localStorage.getItem('backendToken') || 'mock-admin-token-2026';
    const electionId = document.getElementById('elId').value.trim();
    const name = document.getElementById('cName').value.trim();
    const party = document.getElementById('party').value.trim();

    if (!electionId || !name) return alert("Election ID and Candidate Name are required");

    try {
        const res = await window.fetchWithLoader(`${API_BASE}/elections/${encodeURIComponent(electionId)}/candidates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ name, party })
        });

        if (res.ok) {
            if (typeof showToast === 'function') showToast("Candidate enrolled successfully!", "success");
            else alert("Candidate enrolled successfully!");
            if (window.loadElections) window.loadElections();
            if (window.showAdminTab) window.showAdminTab('manageElections');
            return;
        }
    } catch (err) {
        console.warn('Backend candidate enrollment fallback to local', err);
    }

    // Resilient local demo fallback
    const elections = getLocalElections();
    const el = elections.find(e => String(e.id) === String(electionId) || e._id === electionId);
    if (el) {
        el.candidates = el.candidates || [];
        const cid = 'c-' + Date.now();
        el.candidates.push({ id: cid, name, party });
        saveLocalElections(elections);
        if (typeof showToast === 'function') showToast("Candidate enrolled successfully!", "success");
        else alert("Candidate enrolled successfully!");
        if (window.loadElections) window.loadElections();
        if (window.showAdminTab) window.showAdminTab('manageElections');
    } else {
        alert("Election ID not found in local or backend registry.");
    }
};

window.loadAnalytics = async function loadAnalytics() {
    const token = localStorage.getItem('backendToken') || 'mock-admin-token-2026';

    try {
        const res = await fetch(`${API_BASE}/admin/analytics`, {
            headers: { "Authorization": "Bearer " + token }
        });

        if (res.ok) {
            const data = await res.json();
            const box = document.getElementById("analyticsBox");
            if (box) {
                box.innerHTML = `
                    <div class="stat-card">
                        <div class="stat-val">${data.voterCount || 4}</div>
                        <div class="stat-lbl">Registered Voters</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-val">${data.adminCount || 1}</div>
                        <div class="stat-lbl">Chief Election Officers</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-val">${data.voteCount || 484}</div>
                        <div class="stat-lbl">Total Ballots Cast</div>
                    </div>
                `;
                return;
            }
        }
    } catch (err) {
        console.warn('Analytics backend offline, using demo metrics', err);
    }

    // Demo analytics box fallback
    const box = document.getElementById("analyticsBox");
    if (box) {
        const elections = getLocalElections();
        let totalVotes = 0;
        elections.forEach(e => {
            if (e.counts) Object.values(e.counts).forEach(v => totalVotes += Number(v) || 0);
        });
        box.innerHTML = `
            <div class="stat-card">
                <div class="stat-val">4</div>
                <div class="stat-lbl">Registered Voters</div>
            </div>
            <div class="stat-card">
                <div class="stat-val">1</div>
                <div class="stat-lbl">Chief Election Officers</div>
            </div>
            <div class="stat-card">
                <div class="stat-val">${totalVotes || 288}</div>
                <div class="stat-lbl">Total Ballots Cast</div>
            </div>
        `;
    }
};

window.loadVotersPaginated = async function loadVotersPaginated(page) {
    const token = localStorage.getItem('backendToken') || 'mock-admin-token-2026';

    try {
        const res = await window.fetchWithLoader(`${API_BASE}/admin/voters/paginated?page=${page}&limit=5`, {
            headers: { "Authorization": "Bearer " + token }
        });
        
        if (res.ok) {
            const data = await res.json();
            if (data.voters && data.voters.length > 0) {
                let html = `<div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                                <strong>Page ${data.page} of ${data.totalPages}</strong>
                                <div>`;
                if (data.page > 1) html += `<button onclick="loadVotersPaginated(${data.page - 1})" class="btn btn-outline btn-sm">Prev</button> `;
                if (data.page < data.totalPages) html += `<button onclick="loadVotersPaginated(${data.page + 1})" class="btn btn-outline btn-sm">Next</button>`;
                html += `</div></div><ul>`;
                
                data.voters.forEach(v => {
                    html += `
                        <li>
                            <div>
                                <strong>${v.name}</strong> <span class="muted">(${v.email})</span>
                            </div>
                            <button onclick="deleteVoter('${v._id}')" class="btn btn-danger btn-sm">Delete</button>
                        </li>
                    `;
                });
                html += "</ul>";
                document.getElementById("votersBox").innerHTML = html;
                return;
            }
        }
    } catch (err) {
        console.warn('Voters backend offline, showing demo roll', err);
    }

    // Demo electoral roll fallback
    const demoVoters = [
        { _id: 'v1', name: 'Souvik (Voter)', email: 'souvik@digivoter.in' },
        { _id: 'v2', name: 'Priya Sharma', email: 'priya.s@digivoter.in' },
        { _id: 'v3', name: 'Rahul Verma', email: 'rahul.v@digivoter.in' },
        { _id: 'v4', name: 'Ananya Roy', email: 'ananya.r@digivoter.in' }
    ];
    let html = `<div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                    <strong>Demo Electoral Roll (${demoVoters.length} Voters)</strong>
                </div><ul>`;
    demoVoters.forEach(v => {
        html += `
            <li>
                <div>
                    <strong>${v.name}</strong> <span class="muted">(${v.email})</span>
                </div>
                <button onclick="deleteVoter('${v._id}')" class="btn btn-danger btn-sm">Delete</button>
            </li>
        `;
    });
    html += "</ul>";
    const vBox = document.getElementById("votersBox");
    if (vBox) vBox.innerHTML = html;
};

window.deleteVoter = async function deleteVoter(id) {
    if (!confirm("Are you sure you want to delete this voter?")) return;
    const token = localStorage.getItem('backendToken') || 'mock-admin-token-2026';

    try {
        await window.fetchWithLoader(`${API_BASE}/admin/voter/${id}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
        });
    } catch (err) {
        console.warn('Backend delete voter fallback', err);
    }
    if (typeof showToast === 'function') showToast("Voter removed from roll", "success");
    else alert("Voter removed from roll");
    if (window.loadVotersPaginated) window.loadVotersPaginated(1);
};

window.deleteElectionById = async function deleteElectionById() {
    const id = document.getElementById('deleteElectionId').value.trim();
    if (!id) return alert("Enter an election ID");

    const token = localStorage.getItem('backendToken') || 'mock-admin-token-2026';
    if (!confirm("Are you sure you want to delete this election? This is permanent.")) return;

    try {
        const res = await window.fetchWithLoader(`${API_BASE}/elections/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
        });

        if (res.ok) {
            if (typeof showToast === 'function') showToast("Election Deleted", "success");
            else alert("Election Deleted");
            document.getElementById('deleteElectionId').value = '';
            if (window.loadElections) window.loadElections();
            return;
        }
    } catch (err) {
        console.warn('Backend delete error, falling back to local', err);
    }

    // Local demo fallback
    const elections = getLocalElections().filter(e => String(e.id) !== String(id) && e._id !== id);
    saveLocalElections(elections);
    if (typeof showToast === 'function') showToast("Election Deleted", "success");
    else alert("Election Deleted");
    document.getElementById('deleteElectionId').value = '';
    if (window.loadElections) window.loadElections();
};
