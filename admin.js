import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase (Dynamic based on keys)
let supabase = null;
const isDemoMode = !SUPABASE_URL || SUPABASE_URL === 'undefined';

if (!isDemoMode) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Demo Mode Helpers
const getLocalBookings = () => JSON.parse(localStorage.getItem('pb_bookings') || '[]');

const seedMockData = () => {
    const existing = getLocalBookings();
    if (existing.length > 0) return;

    const today = new Date();
    const mockBookings = [];

    // Day 1 (Today): 3 slots filled
    const dateToday = today.toISOString().split('T')[0];
    mockBookings.push(
        { id: 'm1', booking_date: dateToday, time_slot: '4:00 PM - 5:15 PM', customer_name: 'John Doe', customer_email: 'john@example.com', customer_phone: '868-555-0123', players_count: 4, manage_token: 't1' },
        { id: 'm2', booking_date: dateToday, time_slot: '5:15 PM - 6:30 PM', customer_name: 'Sarah Smith', customer_email: 'sarah@example.com', customer_phone: '868-555-0000', players_count: 2, manage_token: 't2' },
        { id: 'm3', booking_date: dateToday, time_slot: '6:30 PM - 7:45 PM', customer_name: 'Mike Wilson', customer_email: 'mike@example.com', customer_phone: '868-555-4444', players_count: 4, manage_token: 't3' }
    );

    // Day 2 (Tomorrow): 1 slot filled
    const dateTomorrow = new Date(today.getTime() + 86400000).toISOString().split('T')[0];
    mockBookings.push(
        { id: 'm4', booking_date: dateTomorrow, time_slot: '7:45 PM - 9:00 PM', customer_name: 'Jane Smith', customer_email: 'jane@example.com', customer_phone: '868-555-5555', players_count: 5, manage_token: 't4' }
    );

    // Day 3 (Next Day): Fully Booked (4 slots for demo purposes)
    const dateDay3 = new Date(today.getTime() + 172800000).toISOString().split('T')[0];
    const slots = ['4:00 PM - 5:15 PM', '5:15 PM - 6:30 PM', '6:30 PM - 7:45 PM', '7:45 PM - 9:00 PM'];
    slots.forEach((s, i) => {
        mockBookings.push({
            id: `m-full-${i}`,
            booking_date: dateDay3,
            time_slot: s,
            customer_name: `Full Day User ${i + 1}`,
            customer_email: `full${i + 1}@example.com`,
            customer_phone: '868-000-0000',
            players_count: 4,
            manage_token: `tf-${i}`
        });
    });

    localStorage.setItem('pb_bookings', JSON.stringify(mockBookings));
};

const deleteLocalBooking = (id) => {
    const bookings = getLocalBookings().filter(b => b.id !== id && b.manage_token !== id);
    localStorage.setItem('pb_bookings', JSON.stringify(bookings));
};

// Seed if in demo mode
if (isDemoMode) seedMockData();

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

    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    filterDateInput.addEventListener('change', () => fetchBookings(filterDateInput.value));
});

// Auth Functions
async function checkUser() {
    if (isDemoMode) {
        if (sessionStorage.getItem('demo_session')) {
            showDashboard();
        } else {
            showAuth();
        }
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) showDashboard();
    else showAuth();
}

async function handleLogin(e) {
    e.preventDefault();
    loginError.textContent = '';

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (isDemoMode) {
        // Mock Admin Auth
        if (email === 'admin@pickleball.com' && password === 'pickleball2026') {
            sessionStorage.setItem('demo_session', 'true');
            showDashboard();
        } else {
            loginError.textContent = 'Invalid credentials for Demo Mode (Use admin@pickleball.com / pickleball2026)';
        }
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) loginError.textContent = error.message;
    else showDashboard();
}

async function handleLogout() {
    if (isDemoMode) {
        sessionStorage.removeItem('demo_session');
    } else {
        await supabase.auth.signOut();
    }
    showAuth();
}

function showAuth() {
    authView.style.display = 'block';
    dashboardView.style.display = 'none';
    logoutBtn.style.display = 'none';
}

function showDashboard() {
    authView.style.display = 'none';
    dashboardView.style.display = 'block';
    logoutBtn.style.display = 'block';
    fetchBookings();
}

// Data Functions
async function fetchBookings(dateFilter = null) {
    bookingsList.innerHTML = '<tr><td colspan="6" class="text-center">Loading bookings...</td></tr>';

    let bookings = [];

    if (!isDemoMode) {
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
            bookingsList.innerHTML = `<tr><td colspan="6" class="text-center">Error: ${error.message}</td></tr>`;
            return;
        }
        bookings = data;
    } else {
        // Demo Mode (Local Storage)
        bookings = getLocalBookings();
        if (dateFilter) {
            bookings = bookings.filter(b => b.booking_date === dateFilter);
        }
        // Simple sort
        bookings.sort((a, b) => a.booking_date.localeCompare(b.booking_date) || a.time_slot.localeCompare(b.time_slot));
    }

    renderBookings(bookings);
    updateStats(bookings);
}

function renderBookings(bookings) {
    if (bookings.length === 0) {
        bookingsList.innerHTML = '<tr><td colspan="6" class="text-center">No bookings found.</td></tr>';
        return;
    }

    bookingsList.innerHTML = bookings.map(booking => `
        <tr class="animate-fade-in">
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
            <td><span class="status-badge status-confirmed">Confirmed</span></td>
            <td class="actions-cell">
                <button class="btn-icon" onclick="editBooking('${booking.id}')" title="Edit">✏️</button>
                <button class="btn-icon delete" onclick="deleteBooking('${booking.id}')" title="Delete">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function updateStats(bookings) {
    const totalPlayers = bookings.reduce((sum, b) => sum + b.players_count, 0);
    const revenue = totalPlayers * 40;

    document.getElementById('stat-total-bookings').textContent = bookings.length;
    document.getElementById('stat-total-players').textContent = totalPlayers;
    document.getElementById('stat-revenue').textContent = `$${revenue} TTD`;

    statsSummary.textContent = `Displaying ${bookings.length} reservations for the selected period.`;

    if (isDemoMode) {
        document.getElementById('clear-data-btn').style.display = 'inline-block';
    }
}

window.clearAllData = () => {
    if (confirm('Are you sure you want to clear all demo data? This cannot be undone.')) {
        localStorage.removeItem('pb_bookings');
        window.location.reload();
    }
};

window.exportData = () => {
    const bookings = isDemoMode ? getLocalBookings() : []; // CSV export logic would go here
    alert('Exporting to CSV... (This would normally download a file)');
};

// Global functions for inline handlers
window.deleteBooking = async (id) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    if (!isDemoMode) {
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error: ' + error.message);
            return;
        }
    } else {
        // Demo Mode
        const bookings = getLocalBookings();
        // Since id might be a UUID string in my demo logic as well
        const filtered = bookings.filter(b => b.manage_token !== id && b.id !== id);
        localStorage.setItem('pb_bookings', JSON.stringify(filtered));
    }

    fetchBookings(filterDateInput.value);
};

window.editBooking = (id) => {
    // For now, redirect or show a modal (simple alert for demo)
    alert('Edit functionality coming soon! For now, please delete and re-book for the customer.');
};
