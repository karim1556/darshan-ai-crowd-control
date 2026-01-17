-- DARSHAN.AI Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (for RBAC - links to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'pilgrim' CHECK (role IN ('pilgrim', 'admin', 'police', 'medical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow insert during signup (for the trigger function)
CREATE POLICY "Enable insert for users" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'pilgrim')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Slots table (darshan time slots)
CREATE TABLE IF NOT EXISTS slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 500,
  booked_count INTEGER NOT NULL DEFAULT 0,
  locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, start_time, end_time)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id TEXT UNIQUE NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_phone TEXT,
  date DATE NOT NULL,
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  members_count INTEGER NOT NULL DEFAULT 1,
  priority_type TEXT NOT NULL DEFAULT 'normal' CHECK (priority_type IN ('normal', 'elderly', 'disabled', 'women-with-children')),
  gate TEXT NOT NULL DEFAULT 'Gate A' CHECK (gate IN ('Gate A', 'Gate B', 'Gate C')),
  status TEXT NOT NULL DEFAULT 'Booked' CHECK (status IN ('Booked', 'Checked-In', 'Expired', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  checked_in_at TIMESTAMPTZ
);

-- Zone statistics table (singleton for real-time crowd tracking)
CREATE TABLE IF NOT EXISTS zone_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gate_count INTEGER NOT NULL DEFAULT 0,
  queue_count INTEGER NOT NULL DEFAULT 0,
  inner_count INTEGER NOT NULL DEFAULT 0,
  exit_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOS emergency requests
CREATE TABLE IF NOT EXISTS sos_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  booking_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('medical', 'security', 'lost-child', 'crowd-risk')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Assigned', 'Enroute', 'Resolved')),
  assigned_to TEXT,
  eta INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Ambulances / Medical resources
CREATE TABLE IF NOT EXISTS ambulances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Busy', 'Offline')),
  location TEXT NOT NULL DEFAULT 'Medical Center',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security units
CREATE TABLE IF NOT EXISTS security_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Busy', 'Offline')),
  zone TEXT NOT NULL DEFAULT 'Main Gate',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_slots_date ON slots(date);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_id ON bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_id ON bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_sos_status ON sos_requests(status);
CREATE INDEX IF NOT EXISTS idx_sos_type ON sos_requests(type);

-- Function to update booked_count when booking is created
CREATE OR REPLACE FUNCTION update_slot_booked_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE slots SET booked_count = booked_count + NEW.members_count, updated_at = NOW()
    WHERE id = NEW.slot_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'Cancelled' AND OLD.status != 'Cancelled' THEN
    UPDATE slots SET booked_count = GREATEST(0, booked_count - OLD.members_count), updated_at = NOW()
    WHERE id = OLD.slot_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for booking count updates
DROP TRIGGER IF EXISTS trigger_update_slot_booked_count ON bookings;
CREATE TRIGGER trigger_update_slot_booked_count
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_slot_booked_count();

-- Function to simulate crowd flow (call periodically)
CREATE OR REPLACE FUNCTION simulate_crowd_flow()
RETURNS void AS $$
DECLARE
  current_stats zone_stats%ROWTYPE;
BEGIN
  SELECT * INTO current_stats FROM zone_stats LIMIT 1;
  
  IF current_stats IS NOT NULL THEN
    UPDATE zone_stats SET
      gate_count = GREATEST(0, LEAST(1800, gate_count + (RANDOM() * 40 - 20)::INTEGER)),
      queue_count = GREATEST(0, LEAST(2000, queue_count + (RANDOM() * 60 - 30)::INTEGER)),
      inner_count = GREATEST(0, LEAST(2500, inner_count + (RANDOM() * 80 - 40)::INTEGER)),
      exit_count = GREATEST(0, LEAST(1500, exit_count + (RANDOM() * 50 - 25)::INTEGER)),
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert initial zone stats row
INSERT INTO zone_stats (gate_count, queue_count, inner_count, exit_count)
SELECT 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM zone_stats);

-- Enable Row Level Security (RLS) - Optional for hackathon
-- ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE zone_stats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sos_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ambulances ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE security_units ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (hackathon demo mode)
-- CREATE POLICY "Allow all access to slots" ON slots FOR ALL USING (true);
-- CREATE POLICY "Allow all access to bookings" ON bookings FOR ALL USING (true);
-- CREATE POLICY "Allow all access to zone_stats" ON zone_stats FOR ALL USING (true);
-- CREATE POLICY "Allow all access to sos_requests" ON sos_requests FOR ALL USING (true);
-- CREATE POLICY "Allow all access to ambulances" ON ambulances FOR ALL USING (true);
-- CREATE POLICY "Allow all access to security_units" ON security_units FOR ALL USING (true);

-- Enable realtime for tables
-- Enable realtime for tables (add only if not already a member)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'slots'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.slots';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bookings'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'zone_stats'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.zone_stats';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'sos_requests'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_requests';
  END IF;
END;
$$;
