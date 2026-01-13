// Configuration
const SUPABASE_URL = 'https://tdcmqajzmwagheznaobg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY21xYWp6bXdhZ2hlem5hb2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDU3OTgsImV4cCI6MjA4MzkyMTc5OH0.FlsPnxylXjrtjxJtRB7fvWHZzDgztShGIS058CloAZo';

const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Constants
const COURTS = {
  covered: ['C1', 'C2', 'C3', 'C4'],
  uncovered: ['U1', 'U2', 'U3', 'U4', 'U5']
};

const SESSION_TIMES = [
  "4:00 PM - 5:15 PM",
  "5:15 PM - 6:30 PM",
  "6:30 PM - 7:45 PM",
  "7:45 PM - 9:00 PM"
];

let bookingState = {
  date: null,
  timeSlot: null,
  courtType: null,
  assignedCourtId: null
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('Pickleball Central - Ready to serve!');
  initHeader();
  initBookingSystem();
  initInstagram();
});

function initHeader() {
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    header.style.background = window.scrollY > 50 ? 'rgba(21, 27, 39, 0.95)' : 'rgba(21, 27, 39, 0.7)';
    header.style.padding = window.scrollY > 50 ? '10px 0' : '0';
  });
}

function initBookingSystem() {
  const bookingApp = document.getElementById('booking-app');
  if (bookingApp) renderBookingStep1();
}

// --- Step 1: Date Selection ---
function renderBookingStep1() {
  const container = document.getElementById('booking-app');
  container.innerHTML = `
    <div class="booking-card animate-fade-in">
      <h3>Select a Date</h3>
      <div class="date-picker-grid" id="date-grid"></div>
    </div>
  `;
  generateDateButtons();
}

function generateDateButtons() {
  const grid = document.getElementById('date-grid');
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    const btn = document.createElement('button');
    btn.className = 'date-btn';
    btn.innerHTML = `
      <span class="day-name">${date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
      <span class="day-number">${date.getDate()}</span>
    `;
    btn.onclick = () => selectDate(date);
    grid.appendChild(btn);
  }
}

function selectDate(date) {
  bookingState.date = date;
  renderTimeSlots();
}

// --- Step 2: Time Selection ---
async function renderTimeSlots() {
  const container = document.getElementById('booking-app');
  container.innerHTML = '<div class="booking-card animate-fade-in"><h3 class="text-center">Checking Courts...</h3></div>';

  // Fetch all bookings for this day to calculate availability locally
  const dateStr = bookingState.date.toISOString().split('T')[0];
  let bookingsForDay = [];

  if (supabase) {
    const { data, error } = await supabase
      .from('bookings')
      .select('time_slot, court_id')
      .eq('booking_date', dateStr);

    if (!error) bookingsForDay = data;
  }

  const slotsHtml = `
    <div class="booking-card animate-fade-in">
      <h3>Select a Time for ${bookingState.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</h3>
      <div class="slot-grid">
        ${SESSION_TIMES.map(time => {
    // Check availability
    const bookedCourts = bookingsForDay.filter(b => b.time_slot === time).map(b => b.court_id);
    const totalCourts = [...COURTS.covered, ...COURTS.uncovered];
    const isFullyBooked = totalCourts.every(id => bookedCourts.includes(id));

    return `
            <button class="slot-btn ${isFullyBooked ? 'disabled' : ''}" 
                    ${isFullyBooked ? 'disabled' : ''}
                    onclick="selectTime('${time}', '${bookedCourts.join(',')}')">
              <span class="slot-time">${time}</span>
              <span class="slot-status">${isFullyBooked ? 'Sold Out' : 'Available'}</span>
            </button>
          `;
  }).join('')}
      </div>
      <div class="booking-actions">
        <button class="btn btn-secondary" onclick="renderBookingStep1()">Back to Dates</button>
      </div>
    </div>
  `;
  container.innerHTML = slotsHtml;
}

function selectTime(time, bookedCourtsStr) {
  bookingState.timeSlot = time;
  // Pass booked courts to next step to avoid re-fetching
  const bookedCourts = bookedCourtsStr ? bookedCourtsStr.split(',') : [];
  renderCourtTypeSelection(bookedCourts);
}

// --- Step 3: Court Type Selection ---
function renderCourtTypeSelection(bookedCourts) {
  const container = document.getElementById('booking-app');

  // Determine availability per type
  const coveredAvailable = COURTS.covered.filter(id => !bookedCourts.includes(id));
  const uncoveredAvailable = COURTS.uncovered.filter(id => !bookedCourts.includes(id));

  const isCoveredFull = coveredAvailable.length === 0;
  const isUncoveredFull = uncoveredAvailable.length === 0;

  container.innerHTML = `
    <div class="booking-card animate-fade-in">
      <h3>Select Court Type</h3>
      <p class="summary-text">${bookingState.timeSlot}</p>
      
      <div class="court-type-grid">
        <div class="court-option ${isCoveredFull ? 'disabled' : ''}" 
             onclick="${!isCoveredFull ? `selectCourtType('covered', '${coveredAvailable[0]}')` : ''}">
          <div class="court-icon">☂️</div>
          <h4>Covered Court</h4>
          <p>Protected from sun & rain.</p>
          <span class="status-badge ${isCoveredFull ? 'full' : 'open'}">
            ${isCoveredFull ? 'Fully Booked' : `${coveredAvailable.length} Available`}
          </span>
        </div>

        <div class="court-option ${isUncoveredFull ? 'disabled' : ''}" 
             onclick="${!isUncoveredFull ? `selectCourtType('uncovered', '${uncoveredAvailable[0]}')` : ''}">
          <div class="court-icon">☀️</div>
          <h4>Uncovered Court</h4>
          <p>Open air, classic experience.</p>
          <span class="status-badge ${isUncoveredFull ? 'full' : 'open'}">
            ${isUncoveredFull ? 'Fully Booked' : `${uncoveredAvailable.length} Available`}
          </span>
        </div>
      </div>

      <div class="booking-actions">
        <button class="btn btn-secondary" onclick="renderTimeSlots()">Back to Times</button>
      </div>
    </div>
  `;
}

function selectCourtType(type, courtId) {
  bookingState.courtType = type;
  bookingState.assignedCourtId = courtId; // Pre-assign the first available court found
  renderBookingForm();
}

// --- Step 4: Booking Form ---
function renderBookingForm() {
  const container = document.getElementById('booking-app');
  container.innerHTML = `
    <div class="booking-card animate-fade-in">
      <h3>Complete Reservation</h3>
      <div class="booking-summary-box">
        <p><strong>Date:</strong> ${bookingState.date.toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${bookingState.timeSlot}</p>
        <p><strong>CourtCode:</strong> ${bookingState.assignedCourtId} (${bookingState.courtType})</p>
      </div>
      
      <form id="booking-form" class="glass-form">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" name="name" required placeholder="Enter your name">
        </div>
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" name="email" required placeholder="For confirmation">
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" name="phone" required placeholder="Contact number">
        </div>
        <div class="form-group">
          <label>Number of Players</label>
          <select name="players" required>
            <option value="4" selected>4 Players (Standard)</option>
            <option value="2">2 Players</option>
            <option value="1">1 Player</option>
            <option value="5">5+ Players</option>
          </select>
        </div>
        <p class="form-note">Payment of $40/player collected in person.</p>
        <div class="booking-actions">
          <button type="button" class="btn btn-secondary" onclick="renderTimeSlots()">Back</button>
          <button type="submit" class="btn btn-primary" id="submit-btn">Confirm Booking</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('booking-form').onsubmit = handleBookingSubmit;
}

async function handleBookingSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Processing...';

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  if (!supabase) {
    alert('System Error: Database not connected.');
    return;
  }

  // Final Availability Check (Optimistic Locking prevention ideally, but simple check for now)
  // We rely on the unique constraint (date, time, court_id) to prevent race conditions.
  const bookingData = {
    booking_date: bookingState.date.toISOString().split('T')[0],
    time_slot: bookingState.timeSlot,
    court_id: bookingState.assignedCourtId,
    court_type: bookingState.courtType,
    customer_name: data.name,
    customer_email: data.email,
    customer_phone: data.phone,
    players_count: parseInt(data.players),
    manage_token: crypto.randomUUID()
  };

  const { error } = await supabase.from('bookings').insert([bookingData]);

  if (error) {
    console.error('Booking Error:', error);
    if (error.code === '23505') { // Unique violation
      alert('Oh no! That court was just grabbed by someone else. Please try another.');
      renderBookingStep1();
    } else {
      alert('Booking failed: ' + error.message);
    }
    submitBtn.disabled = false;
    submitBtn.textContent = 'Confirm Booking';
    return;
  }

  renderSuccess();
}

function renderSuccess() {
  const container = document.getElementById('booking-app');
  container.innerHTML = `
    <div class="booking-card success-card animate-fade-in">
      <div class="success-icon">✓</div>
      <h3>Booking Confirmed!</h3>
      <p class="success-message">Thank you for your booking. Looking forward to having you on the courts!</p>
      <p class="instruction-text"><strong>Please screenshot this confirmation</strong> and show it when you arrive at the courts.</p>
      <p class="brand-signature">Pickleball Central<br><span class="quote">"Where every game feels like home"</span></p>
      <button class="btn btn-primary" onclick="location.reload()">Done</button>
    </div>
  `;
}

function initInstagram() {
  const gallery = document.getElementById('instagram-gallery');
  if (gallery) {
    // Placeholder posts
    const posts = [1, 2, 3, 4];
    gallery.innerHTML = posts.map(i => `
      <div class="instagram-post animate-fade-in">
        <img src="https://picsum.photos/seed/pickle${i}/600/600" alt="Instagram">
      </div>
    `).join('');
  }
}

// Global Exports
window.renderBookingStep1 = renderBookingStep1;
window.selectDate = selectDate;
window.selectTime = selectTime;
window.selectCourtType = selectCourtType;
window.renderTimeSlots = renderTimeSlots;
