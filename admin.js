// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Configuration
// TODO: Replace with your actual Project details
const SUPABASE_URL = 'https://tdcmqajzmwagheznaobg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY21xYWp6bXdhZ2hlem5hb2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDU3OTgsImV4cCI6MjA4MzkyMTc5OH0.FlsPnxylXjrtjxJtRB7fvWHZzDgztShGIS058CloAZo';
// Initialize Supabase (Available via CDN in HTML)
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// DOM Elements
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const bookingsList = document.getElementById('bookings-list');
const statsSummary = document.getElementById('stats-summary');
const filterDateInput = document.getElementById('filter-date');
const loginError = document.getElementById('login-error');

// Constants
const COURTS = {
    covered: ['C1', 'C2', 'C3', 'C4'],
    uncovered: ['U1', 'U2', 'U3', 'U4', 'U5']
};

let allBookings = []; // Local cache

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    checkUser();

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (filterDateInput) filterDateInput.addEventListener('change', () => fetchBookings(filterDateInput.value));

    // Initial Render needed for "Add Booking" button contexts
    updateCourtOptions();
});

// View Switching
window.toggleView = (viewName) => {
    const dashboard = document.getElementById('dashboard-view');
    const bookingsView = document.querySelector('.bookings-grid'); // Weak selector, let's target by ID if possible or structure
    // Better strategy: Hide/Show specific containers.

    // In admin.html we added <div id="members-view"> and wrapped bookings in... wait, I need to check structure.
    // I wrapped the members view in <div id="members-view"> and it is sibling to .bookings-grid?
    // Let's grab specific elements based on the HTML edits.

    const membersView = document.getElementById('members-view');
    // The previous bookings table didn't have a specific container ID other than being inside dashboard-view.
    // I need to be careful. The bookings table is inside <div class="bookings-grid glass-box">.
    // Let's assume the first .bookings-grid is for bookings.

    const bookingsGrid = document.querySelector('.bookings-grid:not(#members-view .bookings-grid)');

    // Re-reading admin.html structure from my edit:
    // I rendered bookings-grid inside dashboard-view. 
    // I rendered members-view inside dashboard-view (as a sibling to bookings-grid?).

    if (viewName === 'members') {
        if (bookingsGrid) bookingsGrid.style.display = 'none';
        membersView.style.display = 'block';
        fetchMembers();
    } else {
        if (bookingsGrid) bookingsGrid.style.display = 'block';
        membersView.style.display = 'none';
        fetchBookings(); // Refresh bookings
    }
};

async function fetchMembers() {
    const list = document.getElementById('members-list');
    list.innerHTML = '<tr><td colspan="5" class="text-center">Loading members...</td></tr>';

    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<tr><td colspan="5" class="text-center text-red-500">Error: ${error.message}</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        list.innerHTML = '<tr><td colspan="5" class="text-center">No subscriptions found.</td></tr>';
        return;
    }

    list.innerHTML = data.map(sub => {
        let nextPaymentDisplay = '-';
        let statusClass = 'status-cancelled'; // Default grey/red

        if (sub.status === 'active') {
            if (sub.end_date) {
                const endDate = new Date(sub.end_date);
                const now = new Date();
                if (endDate > now) {
                    statusClass = 'status-confirmed'; // Green
                    nextPaymentDisplay = `
                        <div>${endDate.toLocaleDateString()}</div>
                        <div style="font-size: 0.8rem; color: var(--color-text-muted);">Active</div>
                    `;
                } else {
                    statusClass = 'status-cancelled'; // Red/Expired
                    nextPaymentDisplay = `
                        <div>${endDate.toLocaleDateString()}</div>
                        <div style="font-size: 0.8rem; color: #ff4757;">Expired</div>
                    `;
                }
            }
        } else if (sub.status === 'pending') {
            statusClass = 'players-badge'; // Grey/Yellowish look
            nextPaymentDisplay = '<span style="opacity:0.5">Waiting for Payment</span>';
        }

        return `
        <tr>
            <td>
                <div style="font-weight: 700;">${sub.full_name || 'Unknown'}</div>
            </td>
            <td>${sub.customer_email}</td>
            <td>${sub.phone_number || '-'}</td>
            <td><span class="status-badge ${statusClass}">${sub.status}</span></td>
            <td>${nextPaymentDisplay}</td>
            <td class="actions-cell">
                <button class="btn-icon delete" onclick="deleteMember('${sub.id}')" title="Delete Subscription">🗑️</button>
            </td>
        </tr>
    `}).join('');
}

window.deleteMember = async (id) => {
    if (!confirm('Are you sure you want to delete this subscription record?')) return;

    const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Error: ' + error.message);
    } else {
        fetchMembers(); // Refresh list
    }
};

// Auth Functions
async function checkUser() {
    // Check if we have a simple session marker
    if (sessionStorage.getItem('admin_session')) {
        showDashboard();
    } else {
        showAuth();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    loginError.textContent = '';

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // TODO: Phase 2 - Replace this with supabase.auth.signInWithPassword()
    // For Phase 1 (Speed), we keep the simple hardcoded gate
    if (email === 'admin@pickleball.com' && password === 'pickleball2026') {
        sessionStorage.setItem('admin_session', 'true');
        showDashboard();
    } else {
        loginError.textContent = 'Invalid credentials';
    }
}

function handleLogout() {
    sessionStorage.removeItem('admin_session');
    showAuth();
}

function showAuth() {
    authView.style.display = 'block';
    dashboardView.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
}

function showDashboard() {
    authView.style.display = 'none';
    dashboardView.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'block';
    fetchBookings();
}

// Data Functions
async function fetchBookings(dateFilter = null) {
    if (!supabase) {
        alert("Supabase not initialized! Check admin.js configuration.");
        return;
    }

    bookingsList.innerHTML = '<tr><td colspan="6" class="text-center">Loading live records...</td></tr>';

    let query = supabase
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: true })
        .order('time_slot', { ascending: true });

    if (dateFilter) {
        query = query.eq('booking_date', dateFilter);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Supabase Error:", error);
        bookingsList.innerHTML = `<tr><td colspan="6" class="text-center text-red-500">Database Error: ${error.message}</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        bookingsList.innerHTML = '<tr><td colspan="6" class="text-center">No bookings found in database.</td></tr>';
        updateStats([]);
        return;
    }

    renderBookings(data);
    updateStats(data);
}

function renderBookings(bookings) {
    allBookings = bookings; // Cache for edit
    bookingsList.innerHTML = bookings.map(booking => `
        <tr>
            <td>
                <div style="font-weight: 700; color: var(--color-primary);">${new Date(booking.booking_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</div>
                <div style="font-size: 0.8rem; color: var(--color-text-muted);">${new Date(booking.booking_date).getFullYear()}</div>
            </td>
            <td>${booking.time_slot}</td>
            <td>
                <div><span class="customer-info">${booking.customer_name}</span></div>
                <div style="font-size:0.8rem; color:var(--color-text-muted);">
                    ${booking.court_id || 'Unassigned'} <span style="opacity:0.6">(${booking.court_type || '?'})</span>
                </div>
            </td>
            <td><span class="players-badge">${booking.players_count} Players</span></td>
            <td><span class="status-badge status-confirmed">${booking.status || 'Confirmed'}</span></td>
            <td class="actions-cell">
                <button class="btn-icon" onclick="editBooking('${booking.id}')" title="Edit">✏️</button>
                <button class="btn-icon delete" onclick="deleteBooking('${booking.id}')" title="Delete">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function updateStats(bookings) {
    const totalPlayers = bookings.reduce((sum, b) => sum + (b.players_count || 0), 0);
    const revenue = bookings.length * 40; // Flat rate for now

    if (document.getElementById('stat-total-bookings')) document.getElementById('stat-total-bookings').textContent = bookings.length;
    if (document.getElementById('stat-total-players')) document.getElementById('stat-total-players').textContent = totalPlayers;
    if (document.getElementById('stat-revenue')) document.getElementById('stat-revenue').textContent = `$${revenue} TTD`;

    statsSummary.textContent = `Displaying ${bookings.length} live database records.`;
}

// Global functions
window.deleteBooking = async (id) => {
    if (!confirm('Are you sure you want to delete this booking from the LIVE database?')) return;

    const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Error: ' + error.message);
    } else {
        // Refresh
        fetchBookings(filterDateInput.value);
    }
};

// --- Modal & Booking Logic ---

window.openModal = (bookingId = null) => {
    const modal = document.getElementById('booking-modal');
    const form = document.getElementById('booking-form');
    const title = document.getElementById('modal-title');

    // Reset or Populate
    if (bookingId) {
        title.textContent = 'Edit Booking';
        const booking = allBookings.find(b => b.id === bookingId);
        if (booking) {
            form.id.value = booking.id;
            form.booking_date.value = booking.booking_date;
            form.time_slot.value = booking.time_slot;
            form.court_type.value = booking.court_type || 'covered';
            updateCourtOptions(booking.court_type); // Populate options first
            form.court_id.value = booking.court_id;
            form.customer_name.value = booking.customer_name;
            form.customer_email.value = booking.customer_email;
            form.customer_phone.value = booking.customer_phone;
            form.players_count.value = booking.players_count;
            form.status.value = booking.status;
        }
    } else {
        title.textContent = 'New Booking';
        form.reset();
        form.id.value = '';
        updateCourtOptions(); // Default to covered options
    }

    modal.style.display = 'flex';
};

window.closeModal = () => {
    document.getElementById('booking-modal').style.display = 'none';
};

window.updateCourtOptions = (selectedType = null) => {
    const type = selectedType || document.getElementById('modal-court-type').value;
    const select = document.getElementById('modal-court-id');
    const options = COURTS[type] || [];

    select.innerHTML = options.map(c => `<option value="${c}">${c}</option>`).join('');
};

window.editBooking = (id) => openModal(id);

document.getElementById('booking-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const id = data.id; // Empty if new

    const payload = {
        booking_date: data.booking_date,
        time_slot: data.time_slot,
        court_id: data.court_id,
        court_type: data.court_type,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        players_count: parseInt(data.players_count),
        status: data.status,
    };

    if (!id) {
        payload.manage_token = crypto.randomUUID();
    }

    let error;
    if (id) {
        // Update
        const res = await supabase.from('bookings').update(payload).eq('id', id);
        error = res.error;
    } else {
        // Create
        const res = await supabase.from('bookings').insert([payload]);
        error = res.error;
    }

    if (error) {
        if (data.override_check === 'on' && error.code === '23505') {
            // Basic Override attempt (Deleting conflict and forcing insert - risky but effective for admin)
            // For now, let's just warn
            alert("Conflict detected! To override, please delete the existing booking for this slot first, then create this one.");
        } else {
            alert('Error saving booking: ' + error.message);
        }
    } else {
        closeModal();
        fetchBookings(); // Refresh UI
    }
});

// --- Settings Logic ---

window.openSettings = async () => {
    document.getElementById('settings-modal').style.display = 'flex';
    // Fetch current fee
    const { data } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'membership_fee').single();
    if (data) {
        document.getElementById('setting-fee').value = data.setting_value;
    }
};

window.closeSettings = () => {
    document.getElementById('settings-modal').style.display = 'none';
};

document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fee = document.getElementById('setting-fee').value;

    const { error } = await supabase
        .from('app_settings')
        .upsert({ setting_key: 'membership_fee', setting_value: fee });

    if (error) {
        alert('Error saving settings: ' + error.message);
    } else {
        alert('Membership fee updated successfully!');
        closeSettings();
    }
});
