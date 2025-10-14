-- Festival Management System Database Schema for Supabase
-- Production PostgreSQL setup

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email CITEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT DEFAULT 'read_only' CHECK (role IN ('admin', 'coordinator', 'viewer', 'read_only')),
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create festivals table
CREATE TABLE IF NOT EXISTS festivals (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location TEXT,
    website TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    budget DECIMAL(12,2),
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stages_areas table
CREATE TABLE IF NOT EXISTS stages_areas (
    id SERIAL PRIMARY KEY,
    event_id INTEGER DEFAULT 1,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'stage' CHECK (type IN ('stage', 'area', 'venue')),
    description TEXT,
    capacity INTEGER,
    technical_specs TEXT,
    location_notes TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create artists table
CREATE TABLE IF NOT EXISTS artists (
    id SERIAL PRIMARY KEY,
    festival_id INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL,
    genre TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    rider_requirements TEXT,
    technical_requirements TEXT,
    fee DECIMAL(10,2),
    fee_status TEXT DEFAULT 'quoted' CHECK (fee_status IN ('quoted', 'agreed', 'invoiced', 'paid', 'overdue')),
    travel_requirements TEXT,
    accommodation_requirements TEXT,
    status TEXT DEFAULT 'inquired' CHECK (status IN ('inquired', 'confirmed', 'contracted', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE
);

-- Create performances table
CREATE TABLE IF NOT EXISTS performances (
    id SERIAL PRIMARY KEY,
    festival_id INTEGER NOT NULL DEFAULT 1,
    artist_id INTEGER NOT NULL,
    stage_area_id INTEGER NOT NULL,
    performance_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    changeover_time_after INTEGER DEFAULT 15,
    soundcheck_time TIME,
    soundcheck_duration INTEGER DEFAULT 30,
    notes TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_area_id) REFERENCES stages_areas(id) ON DELETE CASCADE
);

-- Create contract_templates table
CREATE TABLE IF NOT EXISTS contract_templates (
    id SERIAL PRIMARY KEY,
    festival_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create artist_contracts table
CREATE TABLE IF NOT EXISTS artist_contracts (
    id SERIAL PRIMARY KEY,
    artist_id INTEGER NOT NULL,
    template_id INTEGER NOT NULL,
    custom_content TEXT,
    secure_token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'expired')),
    deadline DATE,
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_data TEXT,
    pdf_path TEXT,
    version INTEGER DEFAULT 1,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES contract_templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create contract_versions table
CREATE TABLE IF NOT EXISTS contract_versions (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    changes_summary TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (contract_id) REFERENCES artist_contracts(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    festival_id INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL,
    type TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    services TEXT,
    cost DECIMAL(10,2),
    status TEXT DEFAULT 'potential' CHECK (status IN ('potential', 'contacted', 'quoted', 'booked', 'confirmed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE
);

-- Create volunteers table  
CREATE TABLE IF NOT EXISTS volunteers (
    id SERIAL PRIMARY KEY,
    festival_id INTEGER NOT NULL DEFAULT 1,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    skills TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    volunteer_status TEXT DEFAULT 'applied' CHECK (volunteer_status IN ('applied', 'interviewed', 'accepted', 'declined', 'active', 'completed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE
);

-- Create budget_items table
CREATE TABLE IF NOT EXISTS budget_items (
    id SERIAL PRIMARY KEY,
    festival_id INTEGER NOT NULL DEFAULT 1,
    category TEXT NOT NULL,
    item_name TEXT NOT NULL,
    description TEXT,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'approved', 'ordered', 'paid', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    festival_id INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL,
    type TEXT,
    file_path TEXT,
    file_size INTEGER,
    uploaded_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Create venues backup table (seems to be legacy)
CREATE TABLE IF NOT EXISTS venues_backup (
    id SERIAL PRIMARY KEY,
    name TEXT,
    location TEXT,
    capacity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create venues table (current)
CREATE TABLE IF NOT EXISTS venues (
    id SERIAL PRIMARY KEY,
    festival_id INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL,
    location TEXT,
    capacity INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE
);

-- Insert default admin user (password will be hashed: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES ('admin@festival.com', '$2b$10$eM0.9JEEfVcr82fUJ9u/SuAWxrfhW3e/1Rsf.7uD.PO8hMiziHspO', 'Admin', 'User', 'admin', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert default festival
INSERT INTO festivals (name, description, start_date, end_date, location, status)
VALUES ('Sample Festival 2025', 'Default festival for testing', '2025-07-15', '2025-07-17', 'Wales, UK', 'planning')
ON CONFLICT DO NOTHING;

-- Insert default stages
INSERT INTO stages_areas (name, type, description, capacity, sort_order)
VALUES 
('Llwyfan Foel Drigarn', 'stage', 'Main Stage', 500, 1),
('Llwyfan y Frenni', 'stage', 'Second Stage', 300, 2),
('Ardal Blant', 'area', 'Children Area', 100, 3)
ON CONFLICT DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_festivals_updated_at BEFORE UPDATE ON festivals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stages_areas_updated_at BEFORE UPDATE ON stages_areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performances_updated_at BEFORE UPDATE ON performances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON contract_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artist_contracts_updated_at BEFORE UPDATE ON artist_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON volunteers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON budget_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();