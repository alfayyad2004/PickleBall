-- Phase 2: Memberships & Settings

-- 1. App Settings (for Admin Fees)
create table if not exists public.app_settings (
    setting_key text primary key,
    setting_value text not null
);

-- Seed the initial fee
insert into public.app_settings (setting_key, setting_value)
values ('membership_fee', '300.00')
on conflict (setting_key) do nothing;

-- 2. Subscriptions
create table if not exists public.subscriptions (
    id uuid default gen_random_uuid() primary key,
    customer_email text not null,
    status text default 'active', -- 'active', 'expired', 'pending'
    start_date timestamp with time zone default now(),
    end_date timestamp with time zone,
    payment_ref text, -- WiPay Transaction ID
    created_at timestamp with time zone default now()
);

-- RLS (Open for Phase 1/2 Dev - Controlled by App Logic)
alter table public.app_settings enable row level security;
alter table public.subscriptions enable row level security;

create policy "Enable read access for all" on public.app_settings for select using (true);
create policy "Enable write access for all" on public.app_settings for all using (true);

create policy "Enable read access for all" on public.subscriptions for select using (true);
create policy "Enable all access for subscriptions" on public.subscriptions for all using (true);
