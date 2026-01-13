-- 1. Create the bookings table
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  booking_date date not null,
  time_slot text not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  players_count integer default 4,
  status text default 'confirmed',
  manage_token text default gen_random_uuid()::text,
  
  -- Add constraints to prevent double booking
  constraint unique_slot unique (booking_date, time_slot)
);

-- 2. Enable Row Level Security
alter table public.bookings enable row level security;

-- 3. Create Policies
-- Allow anyone to read bookings (to see the calendar)
create policy "Enable read access for all users"
on public.bookings for select
to public
using (true);

-- Allow anyone to create a booking
create policy "Enable insert access for all users"
on public.bookings for insert
to public
with check (true);

-- Allow anyone to delete (For Phase 1 Speed/Demo purposes - will lock down later)
create policy "Enable delete access for all users"
on public.bookings for delete
to public
using (true);
