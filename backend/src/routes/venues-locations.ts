import express from 'express';
import { getDatabase } from '../utils/database-sqlite';
import { authenticateToken, requireMinimumRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get all venue locations
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getDatabase();

    const rows = await db.all(`
      SELECT 
        id, name, address, city, postcode, country, capacity, description, 
        facilities, contact_name, contact_email, contact_phone, is_active,
        created_at, updated_at
      FROM venues 
      WHERE is_active = TRUE
      ORDER BY name ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error('Get venue locations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single venue location
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const venue = await db.get(`
      SELECT 
        id, name, address, city, postcode, country, capacity, description, 
        facilities, contact_name, contact_email, contact_phone, is_active,
        created_at, updated_at
      FROM venues 
      WHERE id = ?
    `, [id]);

    if (!venue) {
      return res.status(404).json({ error: 'Venue location not found' });
    }

    res.json(venue);
  } catch (error) {
    console.error('Get venue location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new venue location
router.post('/', authenticateToken, requireMinimumRole('manager'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      address,
      city,
      postcode,
      country = 'United Kingdom',
      capacity,
      description,
      facilities,
      contact_name,
      contact_email,
      contact_phone
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const db = getDatabase();
    
    // Check if active venue with same name already exists (case insensitive)
    const existingVenue = await db.get(
      'SELECT id, is_active FROM venues WHERE LOWER(name) = LOWER(?) AND is_active = TRUE',
      [name]
    );

    if (existingVenue) {
      return res.status(400).json({ error: 'Venue with this name already exists' });
    }

    const result = await db.run(`
      INSERT INTO venues (name, address, city, postcode, country, capacity, description, facilities, contact_name, contact_email, contact_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, 
      address || null, 
      city, 
      postcode || null, 
      country, 
      capacity ? parseInt(capacity.toString()) : null, 
      description || null, 
      facilities || null, 
      contact_name || null, 
      contact_email || null, 
      contact_phone || null
    ]);

    const venueId = result.lastID;

    // Get the created venue
    const newVenue = await db.get(`
      SELECT 
        id, name, address, city, postcode, country, capacity, description, 
        facilities, contact_name, contact_email, contact_phone, is_active,
        created_at, updated_at
      FROM venues 
      WHERE id = ?
    `, [venueId]);

    res.status(201).json(newVenue);
  } catch (error: any) {
    console.error('Create venue location error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update venue location
router.put('/:id', authenticateToken, requireMinimumRole('manager'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { 
      name, address, city, postcode, country, capacity, description, 
      facilities, contact_name, contact_email, contact_phone, is_active 
    } = req.body;
    const db = getDatabase();

    // Check if venue exists
    const venue = await db.get(
      'SELECT id FROM venues WHERE id = ?',
      [id]
    );

    if (!venue) {
      return res.status(404).json({ error: 'Venue location not found' });
    }

    // Check if another venue with same name exists (excluding current one)
    if (name && city) {
      const duplicateVenue = await db.get(
        'SELECT id FROM venues WHERE name = ? AND city = ? AND id != ?',
        [name, city, id]
      );

      if (duplicateVenue) {
        return res.status(400).json({ error: 'Venue with this name already exists in this city' });
      }
    }

    await db.run(`
      UPDATE venues SET 
        name = ?, address = ?, city = ?, postcode = ?, country = ?, 
        capacity = ?, description = ?, facilities = ?, contact_name = ?, 
        contact_email = ?, contact_phone = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, address, city, postcode, country, capacity, description, facilities, contact_name, contact_email, contact_phone, is_active, id]);

    // Get updated venue
    const updatedVenue = await db.get(`
      SELECT 
        id, name, address, city, postcode, country, capacity, description, 
        facilities, contact_name, contact_email, contact_phone, is_active,
        created_at, updated_at
      FROM venues 
      WHERE id = ?
    `, [id]);

    res.json(updatedVenue);
  } catch (error) {
    console.error('Update venue location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete venue location (soft delete)
router.delete('/:id', authenticateToken, requireMinimumRole('manager'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if venue has associated events
    const events = await db.all(
      'SELECT id FROM festivals WHERE venue_id = ?',
      [id]
    );

    if (events.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete venue location with associated events. Please reassign events first.' 
      });
    }

    const result = await db.run(
      'UPDATE venues SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Venue location not found' });
    }

    res.json({ message: 'Venue location deactivated successfully' });
  } catch (error) {
    console.error('Delete venue location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;