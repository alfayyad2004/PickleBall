// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Demo Mode Helpers (Local Storage Persistence)
const getLocalBookings = () => JSON.parse(localStorage.getItem('pb_bookings') || '[]');

const seedMockData = () => {
  const existing = getLocalBookings();
  if (existing.length > 0) return;

  const today = new Date();
  const mockBookings = [];

  // Today: 3 slots filled
  const dateToday = today.toISOString().split('T')[0];
  mockBookings.push(
    { id: 'm1', booking_date: dateToday, time_slot: '4:00 PM - 5:15 PM', customer_name: 'John Doe', players_count: 4, manage_token: 't1' },
    { id: 'm2', booking_date: dateToday, time_slot: '5:15 PM - 6:30 PM', customer_name: 'Sarah Smith', players_count: 2, manage_token: 't2' },
    { id: 'm3', booking_date: dateToday, time_slot: '6:30 PM - 7:45 PM', customer_name: 'Mike Wilson', players_count: 4, manage_token: 't3' }
  );

  // Day 3 (2 days from now): Fully Booked
  const dateDay3 = new Date(today.getTime() + 172800000).toISOString().split('T')[0];
  const slots = ['4:00 PM - 5:15 PM', '5:15 PM - 6:30 PM', '6:30 PM - 7:45 PM', '7:45 PM - 9:00 PM'];
  slots.forEach((s, i) => {
    mockBookings.push({
      id: `m-full-${i}`,
      booking_date: dateDay3,
      time_slot: s,
      customer_name: 'Demo System',
      players_count: 4,
      manage_token: `tf-${i}`
    });
  });

  localStorage.setItem('pb_bookings', JSON.stringify(mockBookings));
};

const saveLocalBooking = (booking) => {
  const bookings = getLocalBookings();
  bookings.push(booking);
  localStorage.setItem('pb_bookings', JSON.stringify(bookings));
};

// Force Demo Mode
const isDemoMode = true;
let supabase = null;

seedMockData();

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
  } else {
    // Demo Mode (Local Storage)
    const bookings = getLocalBookings();
    return bookings.some(b => b.booking_date === dateStr && b.time_slot === time);
  }
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
      alert('Booking failed: ' + error.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm Booking';
      return;
    }
  } else {
    // Demo Mode (Local Storage)
    saveLocalBooking(bookingData);
    console.log('Demo Mode: Booking saved to localStorage');
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
