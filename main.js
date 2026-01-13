// Configuration
const SUPABASE_URL = 'https://tdcmqajzmwagheznaobg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY21xYWp6bXdhZ2hlem5hb2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDU3OTgsImV4cCI6MjA4MzkyMTc5OH0.FlsPnxylXjrtjxJtRB7fvWHZzDgztShGIS058CloAZo';

const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Initialize
// No mock data seeding needed for live mode

document.addEventListener('DOMContentLoaded', () => {
  console.log('Pickleball Central - Ready to serve!');

  initHeader();
  initBookingSystem();
  initInstagram();
});

function initHeader() {
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.style.padding = '10px 0';
      header.style.background = 'rgba(21, 27, 39, 0.95)';
    } else {
      header.style.padding = '0';
      header.style.background = 'rgba(21, 27, 39, 0.7)';
    }
  });
}

function initBookingSystem() {
  const bookingApp = document.getElementById('booking-app');
  if (!bookingApp) return;

  // Initial render of the booking interface
  renderBookingStep1();
}

function renderBookingStep1() {
  const container = document.getElementById('booking-app');
  container.innerHTML = `
    <div class="booking-card">
      <h3>Select a Date</h3>
      <div class="date-picker-grid" id="date-grid">
        <!-- Date buttons will be generated here -->
      </div>
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

const SESSION_TIMES = [
  "4:00 PM - 5:15 PM",
  "5:15 PM - 6:30 PM",
  "6:30 PM - 7:45 PM",
  "7:45 PM - 9:00 PM"
];

let bookingState = {
  date: null,
  timeSlot: null
};

function selectDate(date) {
  bookingState.date = date;
  console.log('Selected date:', date.toDateString());

  // Highlight active button
  document.querySelectorAll('.date-btn').forEach(btn => btn.classList.remove('active'));
  // Ideally, add active class to clicked button here (skipped for brevity)

  renderTimeSlots();
}

async function renderTimeSlots() {
  const container = document.getElementById('booking-app');
  container.innerHTML = '<div class="booking-card animate-fade-in"><h3 class="text-center">Checking Availability...</h3></div>';

  const slotBookedStatuses = await Promise.all(
    SESSION_TIMES.map(time => isSlotBooked(time))
  );

  let slotsHtml = `
    <div class="booking-card animate-fade-in">
      <h3>Select a Time for ${bookingState.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</h3>
      <div class="slot-grid">
        ${SESSION_TIMES.map((time, index) => {
    const booked = slotBookedStatuses[index];
    return `
            <button class="slot-btn ${booked ? 'disabled' : ''}" 
                    ${booked ? 'disabled' : ''}
                    onclick="selectTime('${time}')">
              <span class="slot-time">${time}</span>
              <span class="slot-status">${booked ? 'Fully Booked' : 'Available'}</span>
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

async function isSlotBooked(time) {
  const dateStr = bookingState.date.toISOString().split('T')[0];

  if (supabase) {
    const { data, error } = await supabase
      .from('bookings')
      .select('id')
      .eq('booking_date', dateStr)
      .eq('time_slot', time);

    if (error) {
      console.error('Supabase error:', error);
      return false;
    }
    return data && data.length > 0;
  }
  return false;
}

function selectTime(time) {
  bookingState.timeSlot = time;
  renderBookingForm();
}

function renderBookingForm() {
  const container = document.getElementById('booking-app');
  container.innerHTML = `
    <div class="booking-card animate-fade-in">
      <h3>Complete Your Reservation</h3>
      <p class="summary-text">${bookingState.date.toDateString()} at ${bookingState.timeSlot}</p>
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
            <option value="1">1 Player</option>
            <option value="2">2 Players</option>
            <option value="3">3 Players</option>
            <option value="4">4 Players</option>
            <option value="5">5 Players+</option>
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

  const bookingData = {
    booking_date: bookingState.date.toISOString().split('T')[0],
    time_slot: bookingState.timeSlot,
    customer_name: data.name,
    customer_email: data.email,
    customer_phone: data.phone,
    players_count: parseInt(data.players),
    manage_token: crypto.randomUUID()
  };

  if (supabase) {
    const { error } = await supabase
      .from('bookings')
      .insert([bookingData]);

    if (error) {
      console.error('Booking error:', error);
      alert('Booking failed: ' + error.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm Booking';
      return;
    }
  } else {
    alert('System Error: Database connection missing.');
    submitBtn.disabled = false;
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
      <p>We've sent a confirmation email to your inbox.</p>
      <p>See you on the court!</p>
      <button class="btn btn-primary" onclick="location.reload()">Done</button>
    </div>
  `;
}

function initInstagram() {
  const gallery = document.getElementById('instagram-gallery');
  if (!gallery) return;

  // Simulate loading and rendering posts
  setTimeout(() => {
    renderInstagramPosts();
  }, 1000);
}

function renderInstagramPosts() {
  const gallery = document.getElementById('instagram-gallery');

  // Real post from user + some high-quality placeholders
  const posts = [
    { id: 'DPB2qxvET0Q', type: 'image', thumbnail: 'https://picsum.photos/seed/pickle1/600/600' },
    { id: 'real2', type: 'video', thumbnail: 'https://picsum.photos/seed/pickle2/600/600' },
    { id: 'real3', type: 'image', thumbnail: 'https://picsum.photos/seed/pickle3/600/600' },
    { id: 'real4', type: 'image', thumbnail: 'https://picsum.photos/seed/pickle4/600/600' }
  ];

  gallery.innerHTML = posts.map(post => `
    <div class="instagram-post animate-fade-in" onclick="window.open('https://www.instagram.com/p/${post.id}/', '_blank')">
      <img src="${post.thumbnail}" alt="Pickleball Central Instagram">
      <div class="instagram-overlay">
        <span class="instagram-icon">📸</span>
      </div>
    </div>
  `).join('');
}

// Global scope access for onclick attributes
window.renderBookingStep1 = renderBookingStep1;
window.selectDate = selectDate;
window.selectTime = selectTime;
window.renderTimeSlots = renderTimeSlots;
