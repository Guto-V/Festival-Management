import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import bcrypt from 'bcryptjs';

let db: Database | null = null;

export const initDatabase = async (): Promise<Database> => {
  if (db) return db;

  const dbPath = path.join(__dirname, '../../festival.db');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
  });

  // Enable foreign keys and WAL mode for better concurrency
  await db.exec('PRAGMA foreign_keys = ON');
  await db.exec('PRAGMA journal_mode = WAL');
  await db.exec('PRAGMA synchronous = NORMAL');

  // Create tables
  await createTables();
  
  console.log('✅ SQLite database initialized at:', dbPath);
  return db;
};

const createTables = async () => {
  if (!db) throw new Error('Database not initialized');

  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT DEFAULT 'read_only' CHECK(role IN ('admin', 'manager', 'coordinator', 'read_only')),
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  // Festivals table (renamed conceptually to events)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS festivals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      year INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      venue_id INTEGER,
      location TEXT,
      max_attendees INTEGER DEFAULT 1500,
      description TEXT,
      status TEXT DEFAULT 'planning' CHECK(status IN ('planning', 'active', 'completed', 'cancelled')),
      budget_total DECIMAL(12,2) DEFAULT 0,
      budget_allocated DECIMAL(12,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (venue_id) REFERENCES venues(id)
    )
  `);

  // Add venue_id column to existing festivals table if it doesn't exist
  try {
    await db.exec(`ALTER TABLE festivals ADD COLUMN venue_id INTEGER REFERENCES venues(id)`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Add event timing columns to festivals table
  try {
    await db.exec(`ALTER TABLE festivals ADD COLUMN event_start_time TIME DEFAULT '09:00'`);
    console.log('Added event_start_time column to festivals');
  } catch (error) {
    // Column already exists, ignore error
  }

  try {
    await db.exec(`ALTER TABLE festivals ADD COLUMN event_end_time TIME DEFAULT '23:00'`);
    console.log('Added event_end_time column to festivals');
  } catch (error) {
    // Column already exists, ignore error
  }

  try {
    await db.exec(`ALTER TABLE festivals ADD COLUMN use_custom_daily_times BOOLEAN DEFAULT FALSE`);
    console.log('Added use_custom_daily_times column to festivals');
  } catch (error) {
    // Column already exists, ignore error
  }

  try {
    await db.exec(`ALTER TABLE festivals ADD COLUMN daily_times TEXT`);
    console.log('Added daily_times column to festivals');
  } catch (error) {
    // Column already exists, ignore error
  }

  // Rename existing venues table to stages_areas if it exists with the old structure
  try {
    const oldVenuesExists = await db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='venues' 
      AND sql LIKE '%festival_id%'
    `);
    
    if (oldVenuesExists) {
      await db.exec('DROP TABLE IF EXISTS venues_backup');
      await db.exec('ALTER TABLE venues RENAME TO venues_backup');
      await db.exec('DROP TABLE IF EXISTS stages_areas');
      await db.exec('ALTER TABLE venues_backup RENAME TO stages_areas');
    }
  } catch (error) {
    // Ignore errors during migration
  }

  // Venues table (physical locations that host events)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS venues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      city TEXT,
      postcode TEXT,
      country TEXT DEFAULT 'United Kingdom',
      capacity INTEGER,
      description TEXT,
      facilities TEXT,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Stages and Areas table (within venues, for performances)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS stages_areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('stage', 'area')),
      setup_time INTEGER DEFAULT 0,
      breakdown_time INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES festivals(id) ON DELETE CASCADE
    )
  `);

  // Migration: Copy existing venues data to stages_areas if not already done
  try {
    const existingVenues = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='venues_backup'");
    if (!existingVenues) {
      // Create backup and migrate data
      await db.exec(`CREATE TABLE venues_backup AS SELECT * FROM venues WHERE 1=0`);
      await db.exec(`INSERT INTO venues_backup SELECT * FROM venues`);
      
      // Insert existing venue data into stages_areas
      const oldVenues = await db.all('SELECT * FROM venues_backup');
      for (const venue of oldVenues) {
        await db.run(`
          INSERT INTO stages_areas (event_id, name, type, setup_time, breakdown_time, sort_order, is_active, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [venue.festival_id, venue.name, venue.type, venue.setup_time, venue.breakdown_time, venue.sort_order, venue.is_active, venue.created_at]);
      }
      
      console.log('✅ Migrated venues to stages_areas');
    }
  } catch (error) {
    console.log('Migration already completed or no data to migrate');
  }

  // Artists table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS artists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      festival_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      genre TEXT,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      rider_requirements TEXT,
      technical_requirements TEXT,
      fee DECIMAL(10,2),
      fee_status TEXT DEFAULT 'quoted' CHECK(fee_status IN ('quoted', 'agreed', 'invoiced', 'paid', 'overdue')),
      travel_requirements TEXT,
      accommodation_requirements TEXT,
      status TEXT DEFAULT 'inquired' CHECK(status IN ('inquired', 'confirmed', 'contracted', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE
    )
  `);

  // Add fee_status column to existing artists table if it doesn't exist
  try {
    await db.exec(`ALTER TABLE artists ADD COLUMN fee_status TEXT DEFAULT 'quoted' CHECK(fee_status IN ('quoted', 'agreed', 'invoiced', 'paid', 'overdue'))`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Performances table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS performances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      festival_id INTEGER NOT NULL,
      artist_id INTEGER NOT NULL,
      stage_area_id INTEGER NOT NULL,
      performance_date DATE NOT NULL,
      start_time TIME NOT NULL,
      duration_minutes INTEGER NOT NULL,
      changeover_time_after INTEGER DEFAULT 15,
      soundcheck_time TIME,
      soundcheck_duration INTEGER DEFAULT 30,
      notes TEXT,
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE,
      FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
      FOREIGN KEY (stage_area_id) REFERENCES stages_areas(id) ON DELETE CASCADE
    )
  `);

  // Add stage_area_id column and remove venue_id from existing performances table
  try {
    await db.exec(`ALTER TABLE performances ADD COLUMN stage_area_id INTEGER REFERENCES stages_areas(id)`);
    console.log('Added stage_area_id column to performances');
  } catch (error) {
    // Column already exists, ignore error
  }

  // Budget items table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS budget_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      festival_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      amount DECIMAL(10,2) NOT NULL,
      planned_amount DECIMAL(10,2),
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
      due_date DATE,
      paid_date DATE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE
    )
  `);

  // Volunteers table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS volunteers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      festival_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      skills TEXT,
      t_shirt_size TEXT,
      dietary_requirements TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      assigned_role TEXT,
      volunteer_status TEXT DEFAULT 'applied' CHECK(volunteer_status IN ('applied', 'approved', 'rejected', 'confirmed')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE
    )
  `);

  // Vendors table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      festival_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      address TEXT,
      services_offered TEXT,
      rates TEXT,
      status TEXT DEFAULT 'inquiry' CHECK(status IN ('inquiry', 'approved', 'contracted', 'rejected')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE
    )
  `);

  // Documents table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      festival_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      file_path TEXT,
      file_size INTEGER,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'review', 'approved', 'signed', 'expired')),
      version INTEGER DEFAULT 1,
      expiry_date DATE,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (festival_id) REFERENCES festivals(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
  `);

  // Insert default data if it doesn't exist
  await insertDefaultData();
};

const insertDefaultData = async () => {
  if (!db) throw new Error('Database not initialized');

  // Check if admin user exists
  const existingUser = await db.get('SELECT id FROM users WHERE email = ?', ['admin@festival.com']);
  
  if (!existingUser) {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.run(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      ['admin@festival.com', hashedPassword, 'Admin', 'User', 'admin']
    );

    // Create default venue
    const venueResult = await db.run(
      'INSERT INTO venues (name, address, city, postcode, country, capacity, description, contact_name, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['Pembrokeshire Folk Park', 'Folk Park Lane', 'Pembrokeshire', 'SA62 5XY', 'United Kingdom', 2000, 'Beautiful countryside venue perfect for folk festivals', 'Jane Davies', 'info@folkpark.wales', '+44 1437 123456']
    );
    const venueId = venueResult.lastID;

    // Create default festival
    await db.run(
      'INSERT INTO festivals (name, year, start_date, end_date, venue_id, location, description, status, budget_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['Welsh Folk Festival 2024', 2024, '2024-07-15', '2024-07-17', venueId, 'Pembrokeshire, Wales', 'Annual Welsh Folk Festival in Pembrokeshire', 'planning', 50000]
    );

    // Create default stages and areas
    await db.run('INSERT INTO stages_areas (event_id, name, type, sort_order) VALUES (?, ?, ?, ?)', [1, 'Llwyfan Foel Drigarn', 'stage', 1]);
    await db.run('INSERT INTO stages_areas (event_id, name, type, sort_order) VALUES (?, ?, ?, ?)', [1, 'Llwyfan y Frenni', 'stage', 2]);
    await db.run('INSERT INTO stages_areas (event_id, name, type, sort_order) VALUES (?, ?, ?, ?)', [1, 'Ardal Blant', 'area', 3]);

    console.log('✅ Default data inserted');
  }
};

export const getDatabase = (): Database => {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
};

export default { initDatabase, getDatabase };