-- Create Enum Types
CREATE TYPE attraction_category AS ENUM ('Trek', 'Food', 'Nightlife', 'Culture', 'Logistics', 'Must-See');
CREATE TYPE country_enum AS ENUM ('Argentina', 'Brazil', 'Chile', 'Peru', 'Bolivia', 'Colombia', 'Ecuador');

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL,
    username TEXT NOT NULL,
    trip_id UUID NOT NULL, -- UUID for secure sharing/joining
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents Table (For PDFs, bus tickets, insurance)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'pdf', 'image'
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE -- Soft delete
);

-- Attractions Table
CREATE TABLE attractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL,
    name TEXT NOT NULL,
    country country_enum NOT NULL,
    category attraction_category NOT NULL,
    description TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    coordinates JSONB, -- { lat: numeric, lng: numeric }
    links TEXT[],
    price_local NUMERIC,
    currency_code TEXT,
    exchange_rate_override NUMERIC, -- Manual override for currencies like ARS (Blue Dollar)
    image_urls TEXT[],
    created_by UUID REFERENCES profiles(id) NOT NULL,
    last_edited_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE -- Soft delete
);

-- Turn on Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;

-- Dynamic RLS Function (Optimization to avoid redundant self-joins)
-- Note: A helper function is extremely useful to extract user's trip_id natively
CREATE OR REPLACE FUNCTION auth.trip_id() RETURNS UUID AS $$
  SELECT trip_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: Strict Data Isolation
CREATE POLICY "Select profiles in same trip" ON profiles 
FOR SELECT USING (trip_id = auth.trip_id());

CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their profile on signup" ON profiles 
FOR INSERT WITH CHECK (id = auth.uid());

-- Documents: Strict Data Isolation + Soft Delete handling
CREATE POLICY "Select active documents in trip" ON documents 
FOR SELECT USING (trip_id = auth.trip_id() AND is_deleted = FALSE);

CREATE POLICY "Insert documents in trip" ON documents 
FOR INSERT WITH CHECK (trip_id = auth.trip_id());

CREATE POLICY "Update documents in trip" ON documents 
FOR UPDATE USING (trip_id = auth.trip_id());

-- Attractions: Strict Data Isolation + Soft Delete handling
CREATE POLICY "Select active attractions in trip" ON attractions 
FOR SELECT USING (trip_id = auth.trip_id() AND is_deleted = FALSE);

CREATE POLICY "Insert attractions in trip" ON attractions 
FOR INSERT WITH CHECK (trip_id = auth.trip_id());

CREATE POLICY "Update attractions in trip" ON attractions 
FOR UPDATE USING (trip_id = auth.trip_id());


-- Setup initial bucket for media
INSERT INTO storage.buckets (id, name, public) VALUES ('trip-media', 'trip-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy allowing authed uploads
CREATE POLICY "Avatars / Media are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'trip-media');

CREATE POLICY "Authenticated users can upload media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'trip-media' AND auth.role() = 'authenticated');
