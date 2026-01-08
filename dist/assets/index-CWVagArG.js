(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))o(t);new MutationObserver(t=>{for(const i of t)if(i.type==="childList")for(const l of i.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&o(l)}).observe(document,{childList:!0,subtree:!0});function a(t){const i={};return t.integrity&&(i.integrity=t.integrity),t.referrerPolicy&&(i.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?i.credentials="include":t.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function o(t){if(t.ep)return;t.ep=!0;const i=a(t);fetch(t.href,i)}})();const r=()=>JSON.parse(localStorage.getItem("pb_bookings")||"[]"),g=()=>{if(r().length>0)return;const n=new Date,a=[],o=n.toISOString().split("T")[0];a.push({id:"m1",booking_date:o,time_slot:"4:00 PM - 5:15 PM",customer_name:"John Doe",players_count:4,manage_token:"t1"},{id:"m2",booking_date:o,time_slot:"5:15 PM - 6:30 PM",customer_name:"Sarah Smith",players_count:2,manage_token:"t2"},{id:"m3",booking_date:o,time_slot:"6:30 PM - 7:45 PM",customer_name:"Mike Wilson",players_count:4,manage_token:"t3"});const t=new Date(n.getTime()+1728e5).toISOString().split("T")[0];["4:00 PM - 5:15 PM","5:15 PM - 6:30 PM","6:30 PM - 7:45 PM","7:45 PM - 9:00 PM"].forEach((l,c)=>{a.push({id:`m-full-${c}`,booking_date:t,time_slot:l,customer_name:"Demo System",players_count:4,manage_token:`tf-${c}`})}),localStorage.setItem("pb_bookings",JSON.stringify(a))},b=e=>{const n=r();n.push(e),localStorage.setItem("pb_bookings",JSON.stringify(n))};g();document.addEventListener("DOMContentLoaded",()=>{console.log("Pickleball Central - Ready to serve!"),y(),f(),_()});function y(){const e=document.querySelector("header");window.addEventListener("scroll",()=>{window.scrollY>50?(e.style.padding="10px 0",e.style.background="rgba(21, 27, 39, 0.95)"):(e.style.padding="0",e.style.background="rgba(21, 27, 39, 0.7)")})}function f(){document.getElementById("booking-app")&&m()}function m(){const e=document.getElementById("booking-app");e.innerHTML=`
    <div class="booking-card">
      <h3>Select a Date</h3>
      <div class="date-picker-grid" id="date-grid">
        <!-- Date buttons will be generated here -->
      </div>
    </div>
  `,k()}function k(){const e=document.getElementById("date-grid"),n=new Date;for(let a=0;a<14;a++){const o=new Date;o.setDate(n.getDate()+a);const t=document.createElement("button");t.className="date-btn",t.innerHTML=`
      <span class="day-name">${o.toLocaleDateString("en-US",{weekday:"short"})}</span>
      <span class="day-number">${o.getDate()}</span>
    `,t.onclick=()=>u(o),e.appendChild(t)}}const d=["4:00 PM - 5:15 PM","5:15 PM - 6:30 PM","6:30 PM - 7:45 PM","7:45 PM - 9:00 PM"];let s={date:null,timeSlot:null};function u(e){s.date=e,console.log("Selected date:",e.toDateString()),document.querySelectorAll(".date-btn").forEach(n=>n.classList.remove("active")),p()}async function p(){const e=document.getElementById("booking-app");e.innerHTML='<div class="booking-card animate-fade-in"><h3 class="text-center">Checking Availability...</h3></div>';const n=await Promise.all(d.map(o=>h(o)));let a=`
    <div class="booking-card animate-fade-in">
      <h3>Select a Time for ${s.date.toLocaleDateString("en-US",{month:"long",day:"numeric"})}</h3>
      <div class="slot-grid">
        ${d.map((o,t)=>{const i=n[t];return`
            <button class="slot-btn ${i?"disabled":""}" 
                    ${i?"disabled":""}
                    onclick="selectTime('${o}')">
              <span class="slot-time">${o}</span>
              <span class="slot-status">${i?"Fully Booked":"Available"}</span>
            </button>
          `}).join("")}
      </div>
      <div class="booking-actions">
        <button class="btn btn-secondary" onclick="renderBookingStep1()">Back to Dates</button>
      </div>
    </div>
  `;e.innerHTML=a}async function h(e){const n=s.date.toISOString().split("T")[0];return r().some(o=>o.booking_date===n&&o.time_slot===e)}function v(e){s.timeSlot=e,S()}function S(){const e=document.getElementById("booking-app");e.innerHTML=`
    <div class="booking-card animate-fade-in">
      <h3>Complete Your Reservation</h3>
      <p class="summary-text">${s.date.toDateString()} at ${s.timeSlot}</p>
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
  `,document.getElementById("booking-form").onsubmit=P}async function P(e){e.preventDefault();const n=document.getElementById("submit-btn");n.disabled=!0,n.textContent="Processing...";const a=new FormData(e.target),o=Object.fromEntries(a.entries()),t={booking_date:s.date.toISOString().split("T")[0],time_slot:s.timeSlot,customer_name:o.name,customer_email:o.email,customer_phone:o.phone,players_count:parseInt(o.players),manage_token:crypto.randomUUID()};b(t),console.log("Demo Mode: Booking saved to localStorage"),M()}function M(){const e=document.getElementById("booking-app");e.innerHTML=`
    <div class="booking-card success-card animate-fade-in">
      <div class="success-icon">✓</div>
      <h3>Booking Confirmed!</h3>
      <p>We've sent a confirmation email to your inbox.</p>
      <p>See you on the court!</p>
      <button class="btn btn-primary" onclick="location.reload()">Done</button>
    </div>
  `}function _(){document.getElementById("instagram-gallery")&&setTimeout(()=>{B()},1e3)}function B(){const e=document.getElementById("instagram-gallery"),n=[{id:"DPB2qxvET0Q",type:"image",thumbnail:"https://picsum.photos/seed/pickle1/600/600"},{id:"real2",type:"video",thumbnail:"https://picsum.photos/seed/pickle2/600/600"},{id:"real3",type:"image",thumbnail:"https://picsum.photos/seed/pickle3/600/600"},{id:"real4",type:"image",thumbnail:"https://picsum.photos/seed/pickle4/600/600"}];e.innerHTML=n.map(a=>`
    <div class="instagram-post animate-fade-in" onclick="window.open('https://www.instagram.com/p/${a.id}/', '_blank')">
      <img src="${a.thumbnail}" alt="Pickleball Central Instagram">
      <div class="instagram-overlay">
        <span class="instagram-icon">📸</span>
      </div>
    </div>
  `).join("")}window.renderBookingStep1=m;window.selectDate=u;window.selectTime=v;window.renderTimeSlots=p;
