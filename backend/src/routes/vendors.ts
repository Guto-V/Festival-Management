import express from 'express';
import { getDatabase } from '../utils/database-sqlite';
import { authenticateToken, requireMinimumRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { festival_id } = req.query;
    const db = getDatabase();
    
    let query = `
      SELECT id, festival_id, name, type, contact_name, contact_email, contact_phone,
             address, services_offered, rates, status, notes, created_at, updated_at
      FROM vendors `;
    let params: any[] = [];
    
    if (festival_id) {
      query += 'WHERE festival_id = ? ';
      params.push(festival_id);
    }
    
    query += 'ORDER BY name ASC';
    
    const rows = await db.all(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      festival_id, name, type, contact_name, contact_email, contact_phone,
      address, services_offered, rates, status = 'inquiry', notes 
    } = req.body;

    if (!festival_id || !name || !type) {
      return res.status(400).json({ error: 'Festival ID, name, and type are required' });
    }

    const db = getDatabase();
    const result = await db.run(`
      INSERT INTO vendors (
        festival_id, name, type, contact_name, contact_email, contact_phone,
        address, services_offered, rates, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      festival_id, name, type, contact_name, contact_email, contact_phone,
      address, services_offered, rates, status, notes
    ]);

    const vendorId = result.lastID;

    // Get the created vendor
    const newVendor = await db.get(`
      SELECT id, festival_id, name, type, contact_name, contact_email, contact_phone,
             address, services_offered, rates, status, notes, created_at, updated_at
      FROM vendors 
      WHERE id = ?
    `, [vendorId]);

    res.status(201).json(newVendor);
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single vendor
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const vendor = await db.get(`
      SELECT id, festival_id, name, type, contact_name, contact_email, contact_phone,
             address, services_offered, rates, status, notes, created_at, updated_at
      FROM vendors 
      WHERE id = ?
    `, [id]);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update vendor
router.put('/:id', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { 
      name, type, contact_name, contact_email, contact_phone,
      address, services_offered, rates, status, notes 
    } = req.body;

    const db = getDatabase();
    
    // Check if vendor exists
    const existingVendor = await db.get('SELECT id FROM vendors WHERE id = ?', [id]);
    if (!existingVendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    await db.run(`
      UPDATE vendors SET 
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        contact_name = COALESCE(?, contact_name),
        contact_email = COALESCE(?, contact_email),
        contact_phone = COALESCE(?, contact_phone),
        address = COALESCE(?, address),
        services_offered = COALESCE(?, services_offered),
        rates = COALESCE(?, rates),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, type, contact_name, contact_email, contact_phone, address, services_offered, rates, status, notes, id]);

    // Get updated vendor
    const updatedVendor = await db.get(`
      SELECT id, festival_id, name, type, contact_name, contact_email, contact_phone,
             address, services_offered, rates, status, notes, created_at, updated_at
      FROM vendors 
      WHERE id = ?
    `, [id]);

    res.json(updatedVendor);
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete vendor
router.delete('/:id', authenticateToken, requireMinimumRole('manager'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const result = await db.run('DELETE FROM vendors WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;