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

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    checkUser();

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (filterDateInput) filterDateInput.addEventListener('change', () => fetchBookings(filterDateInput.value));
});

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
    bookingsList.innerHTML = bookings.map(booking => `
        <tr>
            <td>
                <div style="font-weight: 700; color: var(--color-primary);">${new Date(booking.booking_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</div>
                <div style="font-size: 0.8rem; color: var(--color-text-muted);">${new Date(booking.booking_date).getFullYear()}</div>
            </td>
            <td>${booking.time_slot}</td>
            <td>
                <span class="customer-info">${booking.customer_name}</span>
                <span class="customer-email">${booking.customer_email}</span>
            </td>
            <td><span class="players-badge">${booking.players_count} Players</span></td>
            <td><span class="status-badge status-confirmed">${booking.status || 'Confirmed'}</span></td>
            <td class="actions-cell">
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

window.editBooking = (id) => {
    alert("Edit feature coming in Phase 2 update.");
};
