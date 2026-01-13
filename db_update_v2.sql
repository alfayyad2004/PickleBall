-- 1. Add Court Columns
ALTER TABLE public.bookings 
ADD COLUMN court_id text, -- e.g., 'C1', 'U1'
ADD COLUMN court_type text; -- 'covered' or 'uncovered'

-- 2. Drop the old simple constraint (which limited it to 1 booking per time slot globally)
ALTER TABLE public.bookings
DROP CONSTRAINT unique_slot;

-- 3. Add the NEW constraint (Allows multiple bookings per slot, but unique per COURT)
ALTER TABLE public.bookings
ADD CONSTRAINT unique_court_booking UNIQUE (booking_date, time_slot, court_id);

-- 4. Create a logic helper (Client-side will handle assignment, or we can use a Function)
-- For now, we will handle assignment in JS for simplicity.
