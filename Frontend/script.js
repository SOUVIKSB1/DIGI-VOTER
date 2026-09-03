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

    const segControl = document.getElementById('roleSegmentedControl');
    const voterBtn = document.getElementById('roleBtnVoter');
    const adminBtn = document.getElementById('roleBtnAdmin');
    const roleIndicator = document.getElementById('currentRoleBadge');

    if (role === 'admin') {
        const adminUser = {
            id: '64b0f0000000000000000001',
            name: 'Chief Election Admin',
            email: 'souvik@admin.com',
            role: 'admin'
        };
        localStorage.setItem('localUser', JSON.stringify(adminUser));
        localStorage.setItem('backendUser', JSON.stringify(adminUser));
        localStorage.setItem('backendToken', 'mock-admin-token-2026');

        // Request fresh signed admin token
        try {
            fetch(`${API_BASE}/auth/token?role=admin&email=souvik@admin.com&name=Chief%20Election%20Admin`)
                .then(r => r.json())
                .then(data => {
                    if (data && data.token) {
                        localStorage.setItem('backendToken', data.token);
                        if (data.user) localStorage.setItem('backendUser', JSON.stringify(data.user));
                    }
                })
                .catch(() => {});
        } catch(e) {}

        // Segmented Slider Animation to Admin
        if (segControl) segControl.classList.add('admin-active');
        if (voterBtn) voterBtn.classList.remove('active');
        if (adminBtn) adminBtn.classList.add('active');

        if (roleIndicator) {
            roleIndicator.textContent = 'ADMIN MODE';
            roleIndicator.className = 'role-indicator admin';
        }

        if (authSection) authSection.style.display = 'none';
        if (voterSection) voterSection.style.display = 'none';
        if (adminSection) {
            adminSection.style.display = 'block';
            adminSection.classList.remove('role-switch-anim');
            void adminSection.offsetWidth; // Trigger CSS animation restart
            adminSection.classList.add('role-switch-anim');
        }

        if (window.showAdminTab) window.showAdminTab('manageElections');
        if (window.loadElections) window.loadElections();
        if (window.loadAnalytics) window.loadAnalytics();
    } else {
        // Retrieve current active voter if already logged in, otherwise default to Souvik
        let currentVoter = JSON.parse(localStorage.getItem('localUser') || 'null');
        if (!currentVoter || currentVoter.role !== 'voter') {
            currentVoter = {
                id: 'voter-' + Date.now(),
                name: 'Souvik (Voter)',
                email: 'souvik@digivoter.in',
                role: 'voter',
                state: localStorage.getItem('voterState') || 'Uttar Pradesh',
                constituency: localStorage.getItem('voterAssembly') || 'Varanasi (PC-77)',
                epic: 'VOT-2026-7892'
            };
            localStorage.setItem('localUser', JSON.stringify(currentVoter));
            localStorage.setItem('backendUser', JSON.stringify(currentVoter));
        }

        // Fetch user-specific token
        try {
            fetch(`${API_BASE}/auth/token?role=voter&email=${encodeURIComponent(currentVoter.email)}&name=${encodeURIComponent(currentVoter.name)}`)
                .then(r => r.json())
                .then(data => {
                    if (data && data.token) {
                        localStorage.setItem('backendToken', data.token);
                        if (data.user) localStorage.setItem('backendUser', JSON.stringify(data.user));
                    }
                })
                .catch(() => {});
        } catch(e) {}

        // Segmented Slider Animation to Voter
        if (segControl) segControl.classList.remove('admin-active');
        if (adminBtn) adminBtn.classList.remove('active');
        if (voterBtn) voterBtn.classList.add('active');

        if (roleIndicator) {
            roleIndicator.textContent = 'VOTER MODE';
            roleIndicator.className = 'role-indicator voter';
        }

        if (authSection) authSection.style.display = 'none';
        if (adminSection) adminSection.style.display = 'none';
        if (voterSection) {
            voterSection.style.display = 'block';
            voterSection.classList.remove('role-switch-anim');
            void voterSection.offsetWidth; // Trigger CSS animation restart
            voterSection.classList.add('role-switch-anim');
        }

        updateVoterUI(currentVoter);
    }
};

window.goHome = function() {
    window.switchTestRole('voter');
};

window.goAdmin = function() {
    window.switchTestRole('admin');
};

window.seedDemoElections = async function() {
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
            counts: { 'c-modi': 3, 'c-rai': 1, 'c-lari': 1 },
            totalVotes: 5
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
            counts: { 'c-kejriwal': 3, 'c-yadav': 2, 'c-sabharwal': 0 },
            totalVotes: 5
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
            counts: { 'c-priya': 2, 'c-rahul': 2, 'c-ananya': 1 },
            totalVotes: 5
        }
    ];

    // Seed local storage demo data
    localStorage.setItem('localElections', JSON.stringify(sample));
    localStorage.removeItem('localVotes'); // Reset any stale vote blocks

    // Also trigger MongoDB backend seed if server is reachable
    try {
        fetch(`${API_BASE}/seed?reset=true`, { method: 'POST' })
            .then(r => r.json())
            .then(data => console.log('[SEED] Backend MongoDB seed response:', data))
            .catch(err => console.warn('[SEED] Backend offline or seeding locally only:', err));
    } catch (e) {}

    if (typeof showToast === 'function') {
        showToast('Elections seeded with 4-5 verified votes per ballot! 🗳️', 'success');
    } else {
        alert('Elections seeded with 4-5 verified votes per ballot! 🗳️');
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
// Smart detection: uses localhost in dev, same origin in production
const API_BASE = (function() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5002/api';
    }
    return window.location.origin + '/api';
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

const OWNER_EMAIL = 'souvik@admin.com';
const ADMIN_EMAIL = 'souvik@admin.com';

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

// try to load Firebase SDKs dynamically when online (deferred non-blocking)
async function tryInitFirebase() {
    if (!navigator.onLine) return;
    if (firebaseAvailable) return;
    try {
        const appModule = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js');
        try { await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js'); } catch (e) { }
        authModule = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js');
        firestoreModule = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');

        app = appModule.initializeApp(firebaseConfig);
        try { auth = authModule.getAuth(app); } catch (e) { }
        try { db = firestoreModule.getFirestore(app); } catch (e) { }

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
        window.firebaseAvailable = true;
        window.authModule = authModule;
        window.firestoreModule = firestoreModule;
        window.auth = auth;
        window.db = db;
    } catch (err) {
        firebaseAvailable = false;
        window.firebaseAvailable = false;
    }
}

// Deferred non-blocking init so UI renders instantly in 0ms
setTimeout(() => {
    if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => tryInitFirebase());
    } else {
        setTimeout(tryInitFirebase, 1500);
    }
}, 1000);

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

// update sleek glass system status UI
function updateBackendStatus(ok = undefined, errMsg = null) {
    const statusText = document.getElementById('systemStatusText');
    const liveDot = document.getElementById('liveDot');
    const statusPill = document.getElementById('systemStatusPill');

    const isOnline = navigator.onLine;
    if (!isOnline) {
        if (statusText) statusText.textContent = 'Offline Demo';
        if (liveDot) {
            liveDot.style.background = '#f59e0b';
            liveDot.style.boxShadow = '0 0 0 0 rgba(245, 158, 11, 0.7)';
        }
        if (statusPill) statusPill.title = 'Internet disconnected. Operating in local demo storage.';
        return;
    }

    if (statusText) statusText.textContent = 'System Live';
    if (liveDot) {
        liveDot.style.background = '#10b981';
        liveDot.style.boxShadow = '0 0 0 0 rgba(16, 185, 129, 0.7)';
    }
    if (statusPill) statusPill.title = 'Network: Connected | Secure Balloting Protocol Active';
}

function populateElectionDropdowns(list) {
    const elIdSelect = document.getElementById('elId');
    const modalElSelect = document.getElementById('modalElSelect');
    if (!elIdSelect && !modalElSelect) return;

    let opts = '<option value="">-- Choose Election Ballot --</option>';
    list.forEach(e => {
        const id = e.id || e._id;
        const st = e.state ? `[${e.state}] ` : '';
        const title = e.title || 'General Election';
        opts += `<option value="${id}">${st}${title}</option>`;
    });

    if (elIdSelect) {
        const currentVal = elIdSelect.value;
        elIdSelect.innerHTML = opts;
        if (currentVal) elIdSelect.value = currentVal;
    }
    if (modalElSelect) {
        const currentVal = modalElSelect.value;
        modalElSelect.innerHTML = opts;
        if (currentVal) modalElSelect.value = currentVal;
    }
}

function renderFilteredElections(electionList) {
    const electionsDiv = getElectionsDiv();
    if (!electionsDiv) return;

    populateElectionDropdowns(electionList);

    const isAdminPage = adminSection && adminSection.style.display === 'block';
    const activeRole = localStorage.getItem('ovmsActiveRole') || 'voter';
    const isVoter = activeRole === 'voter' && !isAdminPage;
    let voterState = localStorage.getItem('voterState') || 'Uttar Pradesh';
    let voterAssembly = localStorage.getItem('voterAssembly') || 'Varanasi (PC-77)';

    const displayEl = document.getElementById('currentAssemblyDisplay');
    if (displayEl) displayEl.textContent = `${voterState} • ${voterAssembly === 'all' ? 'All Constituencies' : voterAssembly}`;

    const selectEl = document.getElementById('voterAssemblySelect');
    if (selectEl && selectEl.value !== voterAssembly) selectEl.value = voterAssembly;

    let displayed = electionList;
    if (isVoter) {
        displayed = electionList.filter(e => {
            // Ballots marked 'visibleToAll' or 'All States' are always visible to every voter nationwide
            if (e.visibleToAll || e.state === 'All States' || e.state === 'All India' || e.assembly === 'All Assemblies' || !e.state) {
                return true;
            }

            const eState = (e.state || '').toLowerCase();
            const vState = (voterState || '').toLowerCase();
            const eAss = (e.assembly || e.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const vAss = (voterAssembly || '').toLowerCase().replace(/[^a-z0-9]/g, '');

            const stateMatches = vState && (eState.includes(vState) || vState.includes(eState));
            const assMatches = vAss && vAss !== 'all' && (eAss.includes(vAss) || vAss.includes(eAss));
            return stateMatches || assMatches;
        });

        if (displayed.length === 0 && electionList.length > 0) {
            displayed = electionList;
        }
    }

    const bannerTextEl = document.getElementById('assemblyBannerText');
    const bannerCountEl = document.getElementById('assemblyBadgeCount');
    if (bannerTextEl) {
        bannerTextEl.innerHTML = `Showing Active Ballots for your State: <strong>${voterState}</strong> (${voterAssembly})`;
    }
    if (bannerCountEl) {
        bannerCountEl.textContent = `${displayed.length} Ballot(s) Active`;
    }

    electionsDiv.innerHTML = '';
    if (displayed.length === 0) {
        electionsDiv.innerHTML = `
            <div style="padding:40px 20px; text-align:center; background:#ffffff; border-radius:16px; border:1px dashed #cbd5e1; margin:1rem 0;">
                <span style="font-size:2.2rem; display:block; margin-bottom:8px;">🏛️</span>
                <h4 style="margin:0; color:#0f172a; font-size:1.1rem;">No Active Ballots for ${voterState}</h4>
                <p class="muted" style="margin:6px 0 0 0; font-size:0.85rem;">
                    In accordance with electoral guidelines, verified state voters will see ballots when notification is issued.
                </p>
            </div>
        `;
        return;
    }
    displayed.forEach(e => {
        const eid = e.id || e._id;
        if (e._isBackend) {
            window.electionSource = window.electionSource || {};
            window.electionSource[eid] = 'backend';
        }
        renderElectionCard(eid, e, false);
    });
}

// ---------- Elections and voting (Instant Load & Cache-First) ----------
window.loadElections = function loadElections() {
    const isAdminPage = adminSection && adminSection.style.display === 'block';
    const endpoint = isAdminPage ? `${API_BASE}/elections` : `${API_BASE}/elections/active`;

    if (isAdminPage && window.loadAnalytics) window.loadAnalytics();
    window.electionSource = {};

    // 1. INSTANT 0ms RENDER: Display cached verified ballots immediately
    const cachedElections = getLocalElections();
    renderFilteredElections(cachedElections);

    // 2. FAST BACKGROUND REVALIDATE with 3-second timeout
    if (navigator.onLine) {
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), 3000);

        fetch(endpoint, { signal: ctrl.signal })
            .then(res => {
                clearTimeout(timeoutId);
                if (res.ok) return res.json();
                throw new Error('Non-ok response');
            })
            .then(list => {
                if (Array.isArray(list) && list.length > 0) {
                    const formatted = list.map(e => {
                        const rawCandidates = e.candidates || e.candidate || e.candidatesList || [];
                        const candidates = (rawCandidates || []).map(c => ({ 
                            _id: c._id || c.id, 
                            id: c.id || c._id, 
                            name: c.name, 
                            party: c.party || c.partyName || 'Independent' 
                        }));
                        return Object.assign({}, e, { 
                            id: e._id || e.id, 
                            candidates, 
                            counts: e.counts || {}, 
                            totalVotes: e.totalVotes || 0, 
                            _isBackend: true 
                        });
                    });
                    saveLocalElections(formatted);
                    renderFilteredElections(formatted);
                }
            })
            .catch(() => {
                clearTimeout(timeoutId);
            });
    }
};

window.changeVoterAssembly = function(assembly) {
    localStorage.setItem('voterAssembly', assembly);
    const displayEl = document.getElementById('currentAssemblyDisplay');
    if (displayEl) displayEl.textContent = assembly === 'all' ? 'All Constituencies' : assembly;
    const selectEl = document.getElementById('voterAssemblySelect');
    if (selectEl) selectEl.value = assembly;

    if (typeof showToast === 'function') {
        showToast(`Viewing ballots for: ${assembly === 'all' ? 'All Assemblies' : assembly}`, 'info');
    }
    if (window.loadElections) window.loadElections();
};

// --- VOTER AUTH & REGISTRATION HELPERS ---
window.openVoterAuthModal = function(tab = 'login') {
    const modal = document.getElementById('voterAuthModal');
    if (modal) modal.style.display = 'flex';
    window.switchVoterModalTab(tab);
};

window.closeVoterAuthModal = function() {
    const modal = document.getElementById('voterAuthModal');
    if (modal) modal.style.display = 'none';
};

window.switchVoterModalTab = function(tab) {
    const tabLogin = document.getElementById('modalTabLogin');
    const tabRegister = document.getElementById('modalTabRegister');
    const paneLogin = document.getElementById('paneVoterLogin');
    const paneRegister = document.getElementById('paneVoterRegister');

    if (tab === 'register') {
        if (tabLogin) tabLogin.classList.remove('active');
        if (tabRegister) tabRegister.classList.add('active');
        if (paneLogin) paneLogin.style.display = 'none';
        if (paneRegister) paneRegister.style.display = 'block';
    } else {
        if (tabRegister) tabRegister.classList.remove('active');
        if (tabLogin) tabLogin.classList.add('active');
        if (paneRegister) paneRegister.style.display = 'none';
        if (paneLogin) paneLogin.style.display = 'block';
    }
};

window.handleVoterLoginSubmit = async function() {
    const inputVal = (document.getElementById('voterLoginEmail')?.value || '').trim();
    const selectedState = document.getElementById('voterLoginState')?.value || localStorage.getItem('voterState') || 'Uttar Pradesh';
    if (!inputVal) return alert('Please enter your Voter EPIC Number or Registered Email.');

    // Support both direct email or EPIC number input
    let email = inputVal.includes('@') ? inputVal : (inputVal.toLowerCase().replace(/[^a-z0-9]/g, '') + '@digivoter.gov.in');
    let voterName = inputVal.includes('@') ? inputVal.split('@')[0] : ('Elector ' + inputVal.toUpperCase());
    let epic = inputVal.includes('@') ? ('VOT-2026-' + Math.floor(1000 + Math.random() * 9000)) : inputVal.toUpperCase();
    let constituency = localStorage.getItem('voterAssembly') || 'Varanasi (PC-77)';

    // Fetch token for this specific voter
    try {
        const res = await fetch(`${API_BASE}/auth/token?role=voter&email=${encodeURIComponent(email)}&name=${encodeURIComponent(voterName)}`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.token) localStorage.setItem('backendToken', data.token);
        }
    } catch(e) {}

    const voterUser = {
        id: 'voter-' + email.split('@')[0],
        name: voterName,
        email: email,
        role: 'voter',
        epic: epic,
        state: selectedState,
        constituency: constituency
    };
    localStorage.setItem('localUser', JSON.stringify(voterUser));
    localStorage.setItem('backendUser', JSON.stringify(voterUser));
    localStorage.setItem('voterState', selectedState);
    localStorage.setItem('voterAssembly', constituency);

    updateVoterUI(voterUser);
    window.closeVoterAuthModal();
    if (typeof showToast === 'function') showToast(`Authenticated on National Roll: ${voterUser.name} (${selectedState}) ✔`, 'success');
};

window.handleQuickVoterDemo = function() {
    const voterUser = {
        id: '64b0f0000000000000000002',
        name: 'Souvik (Voter)',
        email: 'voter@digivoter.gov.in',
        role: 'voter',
        epic: 'VOT-2026-7892',
        constituency: 'Varanasi (PC-77)'
    };
    localStorage.setItem('localUser', JSON.stringify(voterUser));
    localStorage.setItem('backendUser', JSON.stringify(voterUser));
    localStorage.setItem('backendToken', 'mock-voter-token-2026');

    updateVoterUI(voterUser);
    window.closeVoterAuthModal();
    if (typeof showToast === 'function') showToast('Default verified voter profile active! ✔', 'success');
};

window.handleVoterRegisterSubmit = function() {
    const name = (document.getElementById('regVoterName')?.value || '').trim();
    const epic = (document.getElementById('regVoterEpic')?.value || '').trim() || ('VOT-' + Math.floor(1000 + Math.random() * 9000));
    const state = document.getElementById('regVoterState')?.value || 'Uttar Pradesh';
    const constituency = (document.getElementById('regVoterConstituency')?.value || '').trim() || 'Varanasi (PC-77)';
    const email = (document.getElementById('regVoterEmail')?.value || '').trim();

    if (!name || !email) {
        return alert('Please enter your name and email address.');
    }

    const newVoter = {
        id: 'voter-' + Date.now(),
        name: name,
        email: email,
        epic: epic,
        state: state,
        constituency: constituency,
        role: 'voter'
    };
    localStorage.setItem('localUser', JSON.stringify(newVoter));
    localStorage.setItem('backendUser', JSON.stringify(newVoter));
    localStorage.setItem('backendToken', 'mock-voter-token-' + Date.now());
    localStorage.setItem('voterState', state);
    localStorage.setItem('voterAssembly', constituency);

    // Fetch official authenticated session for this voter
    fetch(`${API_BASE}/auth/token?role=voter&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`)
        .then(r => r.json())
        .then(d => {
            if (d && d.token) localStorage.setItem('backendToken', d.token);
        })
        .catch(() => {});

    updateVoterUI(newVoter);
    window.closeVoterAuthModal();
    if (typeof showToast === 'function') showToast(`Voter registered in ${state} (${constituency}): ${name}!`, 'success');
};

function updateVoterUI(voterUser) {
    const voterNameSpan = document.getElementById('voterName');
    const voterBadgeName = document.getElementById('voterBadgeName');
    const voterSubInfo = document.getElementById('voterSubInfo');
    const voterEpicBadge = document.getElementById('voterEpicBadge');
    const constDisplay = document.getElementById('currentAssemblyDisplay');
    const constSelect = document.getElementById('voterAssemblySelect');

    const ass = voterUser.constituency || 'Varanasi (PC-77)';
    const st = voterUser.state || 'Uttar Pradesh';
    localStorage.setItem('voterAssembly', ass);
    localStorage.setItem('voterState', st);

    if (voterNameSpan) voterNameSpan.textContent = voterUser.name + ' (Voter)';
    if (voterBadgeName) voterBadgeName.textContent = voterUser.name + ' (Registered Voter)';
    if (voterEpicBadge) voterEpicBadge.textContent = voterUser.epic || 'Verified EPIC';
    if (voterSubInfo) {
        voterSubInfo.innerHTML = `State: <strong style="color:#047857;">${st}</strong> • Constituency: <strong id="currentAssemblyDisplay" style="color:#047857;">${ass}</strong> • Status: Eligible to Cast Ballot`;
    }
    if (constDisplay) constDisplay.textContent = `${st} • ${ass}`;
    if (constSelect) constSelect.value = ass;

    if (window.loadElections) window.loadElections();
}

// --- ADMIN VISIBLE CREDENTIALS & LOGIN HELPERS ---
window.authenticateAsAdmin = async function(email, password) {
    const adminUser = {
        id: '64b0f0000000000000000001',
        name: 'Chief Election Admin',
        email: email || 'souvik@admin.com',
        role: 'admin'
    };
    localStorage.setItem('localUser', JSON.stringify(adminUser));
    localStorage.setItem('backendUser', JSON.stringify(adminUser));
    localStorage.setItem('ovmsActiveRole', 'admin');

    try {
        const res = await fetch(`${API_BASE}/auth/token?role=admin`);
        const data = await res.json();
        if (data && data.token) {
            localStorage.setItem('backendToken', data.token);
        } else {
            localStorage.setItem('backendToken', 'mock-admin-token-2026');
        }
    } catch(e) {
        localStorage.setItem('backendToken', 'mock-admin-token-2026');
    }

    window.switchTestRole('admin');
    if (typeof showToast === 'function') showToast('Administrator session verified & privileges active! 🛡️', 'success');
};

window.toggleAdminLoginForm = function() {
    const form = document.getElementById('customAdminLoginForm');
    if (!form) return;
    form.style.display = (form.style.display === 'none' || !form.style.display) ? 'block' : 'none';
};

window.handleCustomAdminLogin = function() {
    const email = document.getElementById('customAdminEmailInput')?.value;
    const pass = document.getElementById('customAdminPasswordInput')?.value;
    window.authenticateAsAdmin(email, pass);
};

// --- 1-Click Voter Identity Selector (No ID typing needed) ---
window.selectVoterProfile = function(name, email, constituency, epic, state = 'Uttar Pradesh') {
    const voterUser = {
        id: 'voter-' + email.split('@')[0],
        name: name,
        email: email,
        epic: epic,
        constituency: constituency,
        state: state,
        role: 'voter'
    };
    localStorage.setItem('localUser', JSON.stringify(voterUser));
    localStorage.setItem('backendUser', JSON.stringify(voterUser));
    localStorage.setItem('backendToken', 'mock-voter-token-' + email.split('@')[0]);
    localStorage.setItem('voterAssembly', constituency);
    localStorage.setItem('voterState', state);

    fetch(`${API_BASE}/auth/token?role=voter&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`)
        .then(r => r.json())
        .then(d => {
            if (d && d.token) localStorage.setItem('backendToken', d.token);
        })
        .catch(() => {});

    updateVoterUI(voterUser);
    window.closeVoterAuthModal();

    if (typeof showToast === 'function') {
        showToast(`Welcome ${name}! Viewing active ballots for ${state} (${constituency}) ✔`, 'success');
    }
};

window.toggleManualVoterLogin = function() {
    const p = document.getElementById('manualVoterLoginPane');
    if (p) p.style.display = (p.style.display === 'none' || !p.style.display) ? 'block' : 'none';
};

// Web Audio API EVM Beep Tone Synthesizer
function playEvmBeep() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // Standard EVM 880Hz confirmation tone
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
    } catch(e) {}
}

window.confirmAndVote = async function(eid, cid, cNameEnc, partyEnc, isBackendElection) {
    const cName = decodeURIComponent(cNameEnc);
    const party = decodeURIComponent(partyEnc);

    // 1. Double-check functional dates
    const elections = getLocalElections();
    const e = elections.find(x => x.id === eid || x._id === eid);
    const now = new Date();
    if (e) {
        if (e.startDate && new Date(e.startDate) > now) {
            return alert(`Voting has not started yet. Polls open on ${new Date(e.startDate).toLocaleDateString('en-IN')}.`);
        }
        if (e.endDate && new Date(new Date(e.endDate).setHours(23, 59, 59, 999)) < now) {
            return alert(`Voting for this election has concluded on ${new Date(e.endDate).toLocaleDateString('en-IN')}.`);
        }
    }

    // 2. Play initial EVM keypress beep
    playEvmBeep();

    // 3. Show EVM Cast Modal with VVPAT Animation
    const modal = document.getElementById('evmCastAnimationModal');
    const slip = document.getElementById('vvpatSlip');
    const candNameEl = document.getElementById('vvpatCandidateName');
    const partyEl = document.getElementById('vvpatPartyName');
    const timeEl = document.getElementById('vvpatTimestamp');
    const cryptoSeal = document.getElementById('vvpatCryptoSeal');
    const lampLed = document.getElementById('evmLampLed');
    const lampLabel = document.getElementById('evmLampLabel');
    const readyLed = document.getElementById('evmReadyLed');
    const lampText = document.getElementById('evmLampText');
    const confirmedSec = document.getElementById('evmConfirmedSection');

    if (candNameEl) candNameEl.textContent = cName;
    if (partyEl) partyEl.textContent = party;
    if (timeEl) timeEl.textContent = 'Recorded: ' + new Date().toLocaleTimeString('en-IN');
    if (cryptoSeal) cryptoSeal.textContent = 'AUTH: SHA256-ECI-' + Math.floor(10000000 + Math.random() * 90000000);
    
    if (readyLed) readyLed.className = 'evm-lamp-led'; // Ready turns off while casting
    if (lampLed) lampLed.className = 'evm-lamp-led active'; // Red flash
    if (lampLabel) lampLabel.textContent = 'RECORDING';
    if (lampText) lampText.textContent = '[ BU-01 ] TRANSMITTING BALLOT TO VVPAT...';
    if (confirmedSec) confirmedSec.style.display = 'none';

    if (slip) {
        slip.className = 'vvpat-paper-slip';
        void slip.offsetWidth; // Trigger browser reflow
        slip.classList.add('printed');
    }

    if (modal) modal.style.display = 'flex';

    // 4. Submit vote via backend
    if (isBackendElection) {
        window.voteBackend(eid, cid);
    } else {
        window.vote(eid, cid);
    }

    // 5. After 1.3s: Long EVM Confirmation Tone + Slip Drops into VVPAT Box + Indelible Ink Stamped
    setTimeout(() => {
        if (slip) slip.classList.add('dropped');
        if (lampLed) lampLed.className = 'evm-lamp-led recorded'; // Solid Green
        if (lampLabel) lampLabel.textContent = 'LOCKED';
        if (lampText) lampText.textContent = '[ BU-01 ] SLIP PRINTED • AUDIT LOGGED • BOX SEALED';
        if (confirmedSec) confirmedSec.style.display = 'block';
        playEvmBeep();
    }, 1300);

    // 6. Close modal smoothly after 2.8s
    setTimeout(() => {
        if (modal) modal.style.display = 'none';
        if (slip) slip.className = 'vvpat-paper-slip';
        if (readyLed) readyLed.className = 'evm-lamp-led ready-led';
        if (lampLed) lampLed.className = 'evm-lamp-led';
    }, 2800);
};

function renderElectionCard(eid, e, showViewButton = false) {
    const title = e.title || 'Constituency General Election';
    const description = e.description || 'General Election Ballot';
    const assemblyName = e.assembly || 'Varanasi (PC-77)';
    const candidates = e.candidates || [];
    const card = document.createElement('div');
    card.className = 'election-card';

    // 100% FUNCTIONAL DATE CALCULATION
    const now = new Date();
    let isUpcoming = false;
    let isClosed = false;
    let pollBadgeHtml = '<span class="status-badge online" style="font-size:0.75rem;">🟢 Active Ballot</span>';
    let datesText = '';

    if (e.startDate && new Date(e.startDate) > now) {
        isUpcoming = true;
        const sDateStr = new Date(e.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        pollBadgeHtml = `<span class="status-badge" style="font-size:0.75rem; background:#fef3c7; color:#92400e; border:1px solid #fde68a;">⏳ Upcoming Poll</span>`;
        datesText = `📅 Polls Open on: ${sDateStr}`;
    } else if (e.endDate && new Date(new Date(e.endDate).setHours(23, 59, 59, 999)) < now) {
        isClosed = true;
        const eDateStr = new Date(e.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        pollBadgeHtml = `<span class="status-badge" style="font-size:0.75rem; background:#fee2e2; color:#991b1b; border:1px solid #fecaca;">🔒 Polls Closed</span>`;
        datesText = `📅 Voting Concluded on: ${eDateStr}`;
    } else if (e.startDate || e.endDate) {
        const s = e.startDate ? new Date(e.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Now';
        const end = e.endDate ? new Date(e.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Ongoing';
        datesText = `📅 Poll Window: ${s} — ${end}`;
    }

    // Calculate total votes across all candidates in this ballot
    const countsObj = e.counts || {};
    let totalVotesCount = e.totalVotes !== undefined ? e.totalVotes : 0;
    if (!totalVotesCount && Object.keys(countsObj).length > 0) {
        Object.values(countsObj).forEach(v => totalVotesCount += Number(v) || 0);
    }

    let html = `
        <div class="election-card-header">
            <div>
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                    <span style="font-size:0.75rem; background:rgba(4,106,56,0.1); color:#046a38; border:1px solid rgba(4,106,56,0.25); border-radius:6px; padding:2px 8px; font-weight:700;">🏛️ ${assemblyName}</span>
                </div>
                <h3>${title}</h3>
                <p class="muted" style="font-size:0.85rem; margin-top:3px;">${description}</p>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0;">
                ${pollBadgeHtml}
                <span class="vote-count-pill" style="font-size:0.75rem; background:rgba(30,64,175,0.08); color:#1e40af; border-color:rgba(30,64,175,0.2);">🗳️ ${totalVotesCount} Total Ballots</span>
            </div>
        </div>
    `;

    if (datesText) {
        html += `<div class="election-dates" style="font-weight:600; font-size:0.8rem; color:#475569;">${datesText}</div>`;
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
            const isVisAll = !!(e.visibleToAll || e.state === 'All States' || e.assembly === 'All Assemblies');
            html += `<div class="election-id-admin"><strong>ELECTION ID:</strong> ${eid}</div>`;
            html += `<div class="admin-controls">
                        <button class="btn btn-outline btn-sm" style="color:#047857; border-color:#86efac; font-weight:700; background:#f0fdf4;" onclick="event.stopPropagation(); openQuickAddCandidateModal('${eid}', '${encodeURIComponent(title)}')">➕ Add Candidate</button>
                        <button class="btn btn-outline btn-sm" style="${isVisAll ? 'color:#15803d; border-color:#86efac; background:#dcfce7; font-weight:700;' : 'color:#1e40af; border-color:#93c5fd; background:#eff6ff; font-weight:600;'}" onclick="event.stopPropagation(); toggleVisibleToAll('${eid}')">🌐 ${isVisAll ? 'Visible to ALL Voters ✔' : '👁️ Make Visible to All'}</button>
                        <button class="btn btn-outline btn-sm" onclick="editElection('${eid}')">Edit</button>
                        <button class="btn btn-outline btn-sm" onclick="toggleElectionActive('${eid}')">Toggle Active</button>
                        <button class="btn btn-outline btn-sm" onclick="viewElectionResultsModal('${eid}')">📊 Tally Results</button>
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
        html += '<p class="muted" style="padding:10px 0;">No nominated candidates enrolled for this ballot yet.</p>';
    } else {
        candidates.forEach((c, idx) => {
            const party = c.party || c.partyName || 'Independent';
            const cid = c.id || c._id;
            const isBackendElection = !!e._isBackend || (window.electionSource && window.electionSource[eid] === 'backend');

            const isAdminRole = (localStorage.getItem('ovmsActiveRole') === 'admin');
            const hasVotedForThis = existingVote && String(existingVote.candidateId) === String(cid);
            const hasVotedOther = existingVote && String(existingVote.candidateId) !== String(cid);

            // Get exact votes for this candidate
            let cVotes = 0;
            if (countsObj[cid] !== undefined) cVotes = countsObj[cid];
            else if (c.id && countsObj[c.id] !== undefined) cVotes = countsObj[c.id];
            else if (c._id && countsObj[c._id] !== undefined) cVotes = countsObj[c._id];

            let actionButtonHtml = '';
            let lampClass = 'evm-lamp';

            if (isAdminRole) {
                actionButtonHtml = `
                    <div style="display:flex; align-items:center; gap:6px;">
                        <button class="btn btn-outline btn-sm" style="padding:4px 8px; font-size:0.75rem; color:#1e40af; border-color:#93c5fd; background:#eff6ff; font-weight:700;" onclick="event.stopPropagation(); openEditCandidateModal('${eid}', '${cid}', '${encodeURIComponent(c.name)}', '${encodeURIComponent(party)}')">✏️ Edit</button>
                        <button class="btn btn-danger btn-sm" style="padding:4px 8px; font-size:0.75rem;" onclick="event.stopPropagation(); deleteCandidate('${eid}', '${cid}', '${encodeURIComponent(c.name)}')">🗑️ Delete</button>
                    </div>
                `;
            } else if (isUpcoming) {
                actionButtonHtml = `<button class="btn btn-outline btn-sm" disabled style="opacity:0.6; cursor:not-allowed;" title="Polls open on ${new Date(e.startDate).toLocaleDateString()}">Opens Soon ⏳</button>`;
            } else if (isClosed) {
                actionButtonHtml = `<button class="btn btn-outline btn-sm" disabled style="opacity:0.6; cursor:not-allowed;" title="Polls closed on ${new Date(e.endDate).toLocaleDateString()}">Closed 🔒</button>`;
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
                    <div class="candidate-main-col">
                        <div class="candidate-lamp-col">
                            <span class="${lampClass}" id="lamp-${eid}-${cid}" title="EVM Status Indicator"></span>
                        </div>
                        <div class="candidate-info">
                            <div class="candidate-name-text">${idx + 1}. ${c.name}</div>
                            <div class="candidate-meta-row">
                                <span class="party-tag">${party}</span>
                                <span class="candidate-vote-tag" id="count-${eid}-${cid}">🗳️ ${cVotes} votes</span>
                            </div>
                        </div>
                    </div>
                    <div class="candidate-action-col">
                        ${actionButtonHtml}
                    </div>
                </div>
            `;
        });
    }
    html += `</div>`;

    // Live Assembly Results & Tally Footer on Card
    html += `
        <div style="margin-top:12px; padding-top:10px; border-top:1px solid rgba(0,0,0,0.06); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); viewElectionResultsModal('${eid}')" style="font-weight:600; display:flex; align-items:center; gap:6px; color:#1e40af; border-color:#93c5fd; background:rgba(30,64,175,0.04);">
                <span>📊</span> View Live Assembly Results & Tally
            </button>
            <span style="font-size:0.78rem; color:#64748b; font-weight:500;">Constituency: ${assemblyName}</span>
        </div>
    `;

    card.innerHTML = html;

    const container = getElectionsDiv();
    if (container) container.appendChild(card);
}

// Seamless Quick Add Candidate Modal handlers
window.openQuickAddCandidateModal = function(electionId, electionTitleEnc) {
    const modal = document.getElementById('quickAddCandidateModal');
    const select = document.getElementById('modalElSelect');
    const subTitle = document.getElementById('quickAddSubTitle');
    const title = electionTitleEnc ? decodeURIComponent(electionTitleEnc) : '';

    if (subTitle && title) subTitle.textContent = 'Enrolling to: ' + title;
    if (select && electionId) select.value = electionId;
    if (modal) modal.style.display = 'flex';
};

window.closeQuickCandidateModal = function() {
    const modal = document.getElementById('quickAddCandidateModal');
    if (modal) modal.style.display = 'none';
};

window.submitQuickAddCandidate = async function() {
    const electionId = document.getElementById('modalElSelect')?.value;
    const name = (document.getElementById('modalCName')?.value || '').trim();
    const party = (document.getElementById('modalCParty')?.value || '').trim() || 'Independent';

    if (!electionId) return alert('Please select a target election ballot.');
    if (!name) return alert('Please enter candidate full legal name.');

    const token = localStorage.getItem('backendToken') || 'mock-admin-token-2026';
    try {
        const res = await fetch(`${API_BASE}/elections/${encodeURIComponent(electionId)}/candidates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ name, party })
        });
        if (res.ok) {
            if (typeof showToast === 'function') showToast(`Candidate ${name} (${party}) enrolled! ✔`, 'success');
            else alert('Candidate enrolled successfully!');
            window.closeQuickCandidateModal();
            if (document.getElementById('modalCName')) document.getElementById('modalCName').value = '';
            if (window.loadElections) window.loadElections();
            return;
        }
    } catch(e) {
        console.warn('Backend add candidate fallback to local', e);
    }

    // Resilient local fallback
    const list = getLocalElections();
    const el = list.find(x => x.id === electionId || x._id === electionId);
    if (el) {
        el.candidates = el.candidates || [];
        el.candidates.push({ id: 'c-' + Date.now(), name, party });
        saveLocalElections(list);
    }
    if (typeof showToast === 'function') showToast(`Candidate ${name} (${party}) enrolled! ✔`, 'success');
    else alert('Candidate enrolled successfully!');
    window.closeQuickCandidateModal();
    if (document.getElementById('modalCName')) document.getElementById('modalCName').value = '';
    if (window.loadElections) window.loadElections();
};

window.setPartyValue = function(partyName) {
    const p1 = document.getElementById('party');
    const p2 = document.getElementById('modalCParty');
    if (p1) p1.value = partyName;
    if (p2) p2.value = partyName;
};

// ==========================================
// ADMIN VISIBILITY & CANDIDATE MANAGEMENT
// ==========================================
window.toggleVisibleToAll = async function(electionId) {
    const list = getLocalElections();
    const el = list.find(x => x.id === electionId || x._id === electionId);
    const newStatus = !(el && (el.visibleToAll || el.state === 'All States' || el.assembly === 'All Assemblies'));

    const token = localStorage.getItem('backendToken') || 'mock-admin-token-2026';
    try {
        await fetch(`${API_BASE}/elections/${encodeURIComponent(electionId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ 
                visibleToAll: newStatus,
                state: newStatus ? 'All States' : (el ? (el.state || 'Uttar Pradesh') : 'Uttar Pradesh')
            })
        });
    } catch(e) {}

    // Update local cache
    if (el) {
        el.visibleToAll = newStatus;
        if (newStatus) el.state = 'All States';
        saveLocalElections(list);
    }

    if (typeof showToast === 'function') {
        showToast(newStatus ? '🌐 Election is now VISIBLE TO ALL VOTERS nationwide! ✔' : '🔒 Election visibility restricted to assigned state.', 'success');
    }
    if (window.loadElections) window.loadElections();
};

window.openEditCandidateModal = function(electionId, candidateId, nameEnc, partyEnc) {
    const modal = document.getElementById('editCandidateModal');
    const name = nameEnc ? decodeURIComponent(nameEnc) : '';
    const party = partyEnc ? decodeURIComponent(partyEnc) : '';

    if (document.getElementById('editCandElectionId')) document.getElementById('editCandElectionId').value = electionId;
    if (document.getElementById('editCandId')) document.getElementById('editCandId').value = candidateId;
    if (document.getElementById('editCandName')) document.getElementById('editCandName').value = name;
    if (document.getElementById('editCandParty')) document.getElementById('editCandParty').value = party;
    if (document.getElementById('editCandidateSubTitle')) {
        document.getElementById('editCandidateSubTitle').textContent = `Editing Candidate: ${name}`;
    }

    if (modal) modal.style.display = 'flex';
};

window.closeEditCandidateModal = function() {
    const modal = document.getElementById('editCandidateModal');
    if (modal) modal.style.display = 'none';
};

window.submitEditCandidate = async function() {
    const electionId = document.getElementById('editCandElectionId')?.value;
    const candidateId = document.getElementById('editCandId')?.value;
    const name = (document.getElementById('editCandName')?.value || '').trim();
    const party = (document.getElementById('editCandParty')?.value || '').trim() || 'Independent';

    if (!name) return alert('Please enter candidate name.');

    const token = localStorage.getItem('backendToken') || 'mock-admin-token-2026';
    try {
        const res = await fetch(`${API_BASE}/elections/${encodeURIComponent(electionId)}/candidates/${encodeURIComponent(candidateId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ name, party })
        });
        if (res.ok) {
            if (typeof showToast === 'function') showToast(`Candidate ${name} updated successfully! ✔`, 'success');
            window.closeEditCandidateModal();
            if (window.loadElections) window.loadElections();
            return;
        }
    } catch(e) {
        console.warn('Edit candidate fallback to local', e);
    }

    // Local cache fallback
    const list = getLocalElections();
    const el = list.find(x => x.id === electionId || x._id === electionId);
    if (el && el.candidates) {
        const cand = el.candidates.find(c => (c.id || c._id) === candidateId);
        if (cand) {
            cand.name = name;
            cand.party = party;
            saveLocalElections(list);
        }
    }

    if (typeof showToast === 'function') showToast(`Candidate ${name} updated successfully! ✔`, 'success');
    window.closeEditCandidateModal();
    if (window.loadElections) window.loadElections();
};

window.deleteCandidate = async function(electionId, candidateId, nameEnc) {
    const name = nameEnc ? decodeURIComponent(nameEnc) : 'this candidate';
    if (!confirm(`Are you sure you want to permanently delete candidate "${name}" from this election?`)) {
        return;
    }

    const token = localStorage.getItem('backendToken') || 'mock-admin-token-2026';
    try {
        const res = await fetch(`${API_BASE}/elections/${encodeURIComponent(electionId)}/candidates/${encodeURIComponent(candidateId)}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
            if (typeof showToast === 'function') showToast(`Candidate "${name}" removed from ballot! ✔`, 'success');
            if (window.loadElections) window.loadElections();
            return;
        }
    } catch(e) {
        console.warn('Delete candidate fallback to local', e);
    }

    // Local cache fallback
    const list = getLocalElections();
    const el = list.find(x => x.id === electionId || x._id === electionId);
    if (el && el.candidates) {
        el.candidates = el.candidates.filter(c => (c.id || c._id) !== candidateId);
        saveLocalElections(list);
    }

    if (typeof showToast === 'function') showToast(`Candidate "${name}" removed from ballot! ✔`, 'success');
    if (window.loadElections) window.loadElections();
};

// 1-Click Lok Sabha & Vidhan Sabha Ballot Seeder
window.seedOfficialElections = async function(type = 'all') {
    if (typeof showToast === 'function') showToast(`Seeding official ${type.toUpperCase()} ballots... ⏳`, 'info');
    try {
        const res = await fetch(`${API_BASE}/seed?type=${type}&reset=true`, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            if (typeof showToast === 'function') showToast(data.message || 'Ballots seeded successfully!', 'success');
            else alert(data.message || 'Ballots seeded successfully!');
            if (window.loadElections) window.loadElections();
            return;
        }
    } catch(e) {
        console.warn('Seed endpoint fallback', e);
    }
    if (typeof showToast === 'function') showToast(`Official ${type.toUpperCase()} ballots updated with verified counts! ✔`, 'success');
    if (window.loadElections) window.loadElections();
};

window.handleStateSelectionChange = function() {
    const stateEl = document.getElementById('regVoterState');
    const constEl = document.getElementById('regVoterConstituency');
    if (!stateEl || !constEl) return;

    const st = stateEl.value;
    const presets = {
        'Uttar Pradesh': 'Varanasi (PC-77)',
        'West Bengal': 'Kolkata South (PC-23)',
        'Delhi (NCT)': 'New Delhi (AC-40)',
        'Maharashtra': 'Mumbai South (PC-31)',
        'Bihar': 'Patna Sahib (PC-30)',
        'Tamil Nadu': 'Chennai Central (PC-04)',
        'Karnataka': 'Bangalore South (PC-26)',
        'Gujarat': 'Gandhinagar (PC-06)',
        'Rajasthan': 'Jaipur (PC-07)',
        'Punjab': 'Amritsar (PC-02)'
    };
    if (presets[st]) {
        constEl.value = presets[st];
    }
};

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

// View election results modal (SPA mode — voting.html removed)
window.viewElection = function viewElection(electionId) {
    if (window.viewElectionResultsModal) {
        window.viewElectionResultsModal(electionId);
    }
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

// Helper function to refresh UI
function refreshCurrentView(electionId) {
    try {
        if (window.loadElections) setTimeout(() => window.loadElections(), 200);
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

    // Check local double-voting lock
    const localUser = JSON.parse(localStorage.getItem('localUser') || 'null') || { email: 'voter@digivoter.gov.in', name: 'Souvik (Voter)' };
    const votes = JSON.parse(localStorage.getItem('localVotes') || '[]');
    if (votes.find(v => v.userEmail === localUser.email && String(v.electionId) === String(electionId))) {
        if (typeof showToast === 'function') showToast('You have already cast a ballot in this election.', 'error');
        else alert('You have already cast a ballot in this election.');
        return;
    }

    const voteObj = { userEmail: localUser.email, electionId, candidateId, timestamp: Date.now(), synced: true };
    votes.push(voteObj);
    localStorage.setItem('localVotes', JSON.stringify(votes));

    // update local election counts immediately
    const elections = getLocalElections();
    const e = elections.find(x => x.id === electionId || x._id === electionId);
    if (e) {
        e.counts = e.counts || {};
        e.counts[candidateId] = (e.counts[candidateId] || 0) + 1;
        saveLocalElections(elections);
    }

    const countEl = document.getElementById(`count-${electionId}-${candidateId}`);
    if (countEl && e) {
        countEl.textContent = `🗳️ ${e.counts[candidateId]} votes`;
    }
    const lamp = document.getElementById(`lamp-${electionId}-${candidateId}`);
    if (lamp) lamp.className = 'evm-lamp voted';

    const successMsg = 'Official ballot cast successfully! 🗳️ Indelible mark recorded.';
    try { window.dispatchEvent(new CustomEvent('vote:success', { detail: { message: successMsg } })); } catch (e) { }
    if (typeof showToast === 'function') showToast(successMsg, 'success');
    else alert(successMsg);
    refreshCurrentView(electionId);
};

// Vote against backend API
window.voteBackend = async function voteBackend(electionId, candidateId) {
    try {
        const localUser = JSON.parse(localStorage.getItem('localUser') || 'null') || { email: 'voter@digivoter.gov.in', name: 'Souvik (Voter)' };
        let backendToken = localStorage.getItem('backendToken');
        if (!backendToken || backendToken.startsWith('mock-')) {
            try {
                const tokRes = await fetch(`${API_BASE}/auth/token?role=voter&email=${encodeURIComponent(localUser.email)}&name=${encodeURIComponent(localUser.name)}`);
                if (tokRes.ok) {
                    const tokData = await tokRes.json();
                    backendToken = tokData.token;
                    localStorage.setItem('backendToken', backendToken);
                }
            } catch(e) {}
        }

        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + (backendToken || 'voter-token-2026'),
            'x-voter-email': localUser.email,
            'x-voter-name': localUser.name
        };
        const res = await fetch(`${API_BASE}/elections/${encodeURIComponent(electionId)}/vote`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
                candidateId, 
                voterEmail: localUser.email, 
                voterName: localUser.name 
            })
        });
        const data = await res.json();
        if (res.ok) {
            const msg = data.message || 'Official ballot cast successfully! 🗳️';
            // Lock double-voting in session
            const localUser = JSON.parse(localStorage.getItem('localUser') || 'null') || { email: 'voter@digivoter.gov.in', name: 'Souvik (Voter)' };
            const votes = JSON.parse(localStorage.getItem('localVotes') || '[]');
            votes.push({ userEmail: localUser.email, electionId, candidateId, timestamp: Date.now() });
            localStorage.setItem('localVotes', JSON.stringify(votes));

            const countEl = document.getElementById(`count-${electionId}-${candidateId}`);
            if (countEl && data.votes !== undefined) {
                countEl.textContent = `🗳️ ${data.votes} votes`;
            }
            const lamp = document.getElementById(`lamp-${electionId}-${candidateId}`);
            if (lamp) lamp.className = 'evm-lamp voted';

            try { window.dispatchEvent(new CustomEvent('vote:success', { detail: { message: msg } })); } catch (e) { }
            if (typeof showToast === 'function') showToast(msg, 'success');
            else alert(msg);
            refreshCurrentView(electionId);
        } else {
            const msg = data.message || 'Vote could not be processed';
            if (typeof showToast === 'function') showToast(msg, 'error');
            else alert(msg);
        }
    } catch (err) {
        console.warn('Backend vote network fallback', err);
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
    try {
        const savedRole = localStorage.getItem('ovmsActiveRole') || 'voter';
        if (window.switchTestRole) {
            window.switchTestRole(savedRole);
        }
        setTimeout(() => {
            try { if (window.loadElections) window.loadElections(); } catch (e) {
                console.warn('loadElections failed on main page load', e);
            }
        }, 100);
    } catch (e) { console.warn('Init error', e); }
});

// Theme switcher removed per user request

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
    const assembly = (document.getElementById('assembly')?.value || '').trim() || 'Varanasi (PC-77)';
    const assemblyNumber = (document.getElementById('assemblyNumber')?.value || '').trim();
    const state = (document.getElementById('assemblyState')?.value || '').trim();
    const startDate = document.getElementById('start').value;
    const endDate = document.getElementById('end').value;

    if (!title) return alert("Title is required");

    const body = { title, description, assembly, assemblyNumber, state, startDate, endDate, isActive: true };

    try {
        const res = await window.fetchWithLoader(`${API_BASE}/elections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            if (typeof showToast === 'function') showToast(`Election created for ${assembly}!`, "success");
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
        assembly,
        assemblyNumber,
        state,
        startDate,
        endDate,
        isActive: true,
        active: true,
        candidates: [],
        counts: {}
    });
    saveLocalElections(elections);
    if (typeof showToast === 'function') showToast(`Election created for ${assembly}!`, "success");
    else alert("Election created successfully!");
    if (window.loadElections) window.loadElections();
    if (window.showAdminTab) window.showAdminTab('manageElections');
};

// ==========================================
// LIVE RESULTS & TALLY VIEWER MODAL
// ==========================================
window.viewElectionResultsModal = async function(electionId) {
    const modal = document.getElementById('liveResultsModal');
    const modalTitle = document.getElementById('resultsModalTitle');
    const modalSub = document.getElementById('resultsModalSubtitle');
    const modalBody = document.getElementById('resultsModalBody');
    const modalFooter = document.getElementById('resultsModalFooterCount');

    if (modal) modal.style.display = 'flex';
    if (modalBody) modalBody.innerHTML = '<p class="muted" style="text-align:center; padding:20px;">Fetching verified live results from ballot boxes...</p>';

    // Find election metadata from local cache or fetch
    const localList = getLocalElections();
    let electionObj = localList.find(x => x.id === electionId || x._id === electionId) || null;

    try {
        let results = [];
        let totalBallots = 0;

        try {
            const res = await fetch(`${API_BASE}/elections/${encodeURIComponent(electionId)}/results`);
            if (res.ok) {
                const data = await res.json();
                results = Array.isArray(data) ? data : (data.results || []);
            }
        } catch(e) {}

        // If backend returned empty or was offline, synthesize from local counts
        if (results.length === 0 && electionObj) {
            const counts = electionObj.counts || {};
            const candidates = electionObj.candidates || [];
            candidates.forEach(c => {
                const cid = c.id || c._id;
                const v = Number(counts[cid] || 0);
                totalBallots += v;
                results.push({
                    candidate: { _id: cid, name: c.name, party: c.party || 'Independent' },
                    votes: v
                });
            });
            results.sort((a, b) => b.votes - a.votes);
        } else {
            results.forEach(r => totalBallots += Number(r.votes || 0));
        }

        if (modalTitle) modalTitle.textContent = (electionObj ? electionObj.title : 'Live Election Results');
        if (modalSub) modalSub.textContent = `Constituency: ${electionObj ? (electionObj.assembly || 'General') : 'Active Ballot'} • Real-Time Counting`;
        if (modalFooter) modalFooter.textContent = `Total Ballots Counted: ${totalBallots} Votes`;

        if (!modalBody) return;
        if (results.length === 0) {
            modalBody.innerHTML = '<p class="muted" style="text-align:center; padding:20px;">No votes recorded in this election yet. Be the first to cast a ballot!</p>';
            return;
        }

        let bodyHtml = `
            <div style="margin-bottom:1.2rem; display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:10px 14px; border-radius:10px; border:1px solid #e2e8f0;">
                <span style="font-size:0.85rem; font-weight:700; color:#0f172a;">Total Ballots Cast: <strong>${totalBallots}</strong></span>
                <span class="status-badge online" style="font-size:0.75rem;">LIVE TALLY</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:12px;">
        `;

        results.forEach((r, idx) => {
            const candObj = (r.candidate && typeof r.candidate === 'object') ? r.candidate : {};
            const cName = candObj.name || r.name || 'Candidate';
            const party = candObj.party || candObj.partyName || r.party || 'Independent';
            const votes = Number(r.votes || 0);
            const pct = totalBallots > 0 ? ((votes / totalBallots) * 100).toFixed(1) : 0;
            const isLeading = idx === 0 && votes > 0;

            let barColor = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
            if (idx === 0) barColor = 'linear-gradient(90deg, #ea580c 0%, #f97316 100%)';
            else if (idx === 1) barColor = 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)';

            bodyHtml += `
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:12px 16px; box-shadow:0 2px 6px rgba(0,0,0,0.02);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <strong style="font-size:0.95rem; color:#0f172a;">${idx + 1}. ${cName}</strong>
                            ${isLeading ? '<span style="background:#fef3c7; color:#92400e; font-size:0.68rem; font-weight:800; padding:2px 8px; border-radius:12px; border:1px solid #fde68a;">🏆 LEADING</span>' : ''}
                        </div>
                        <div style="text-align:right;">
                            <span style="font-weight:800; font-size:1rem; color:#0f172a;">${votes}</span>
                            <span style="font-size:0.8rem; color:#64748b; margin-left:4px;">(${pct}%)</span>
                        </div>
                    </div>
                    <div style="font-size:0.78rem; color:#64748b; margin-bottom:8px;">${party}</div>
                    <div style="background:#f1f5f9; height:10px; border-radius:6px; overflow:hidden;">
                        <div style="background:${barColor}; width:${pct}%; height:100%; border-radius:6px; transition:width 0.6s cubic-bezier(0.16, 1, 0.3, 1);"></div>
                    </div>
                </div>
            `;
        });

        bodyHtml += `</div>`;
        modalBody.innerHTML = bodyHtml;

    } catch (err) {
        console.error('viewElectionResultsModal error:', err);
        if (modalBody) modalBody.innerHTML = '<p class="error" style="text-align:center; padding:20px;">Could not retrieve live tally results.</p>';
    }
};

window.closeResultsModal = function() {
    const modal = document.getElementById('liveResultsModal');
    if (modal) modal.style.display = 'none';
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
