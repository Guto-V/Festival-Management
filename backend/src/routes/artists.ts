import express from 'express';
import { getUniversalDatabase } from '../utils/database-universal';
import { authenticateToken, requireMinimumRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get all artists
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { festival_id } = req.query;
    const db = getUniversalDatabase();
    
    let query = `
      SELECT 
        id, festival_id, name, genre, contact_name, contact_email, contact_phone,
        rider_requirements, technical_requirements, fee, fee_status, travel_requirements,
        accommodation_requirements, status, created_at, updated_at
      FROM artists `;
    let params: any[] = [];
    
    if (festival_id) {
      query += 'WHERE festival_id = ? ';
      params.push(festival_id);
    }
    
    query += 'ORDER BY name ASC';
    
    const rows = await db.all(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get artists error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single artist
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const db = getUniversalDatabase();
    const row = await db.get(`
      SELECT 
        id, festival_id, name, genre, contact_name, contact_email, contact_phone,
        rider_requirements, technical_requirements, fee, fee_status, travel_requirements,
        accommodation_requirements, status, created_at, updated_at
      FROM artists 
      WHERE id = ?
    `, [id]);

    if (!row) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    res.json(row);
  } catch (error) {
    console.error('Get artist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new artist
router.post('/', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      festival_id, name, genre, contact_name, contact_email, contact_phone,
      rider_requirements, technical_requirements, fee, fee_status = 'quoted', travel_requirements,
      accommodation_requirements, status = 'inquired'
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Artist name is required' });
    }

    if (!festival_id) {
      return res.status(400).json({ error: 'Festival ID is required' });
    }

    const db = getUniversalDatabase();
    
    // Check if artist with same name already exists in this festival
    const existingArtist = await db.get(
      'SELECT id FROM artists WHERE name = ? AND festival_id = ?',
      [name, festival_id]
    );

    if (existingArtist) {
      return res.status(400).json({ error: 'Artist with this name already exists in this festival' });
    }

    const result = await db.run(`
      INSERT INTO artists (
        festival_id, name, genre, contact_name, contact_email, contact_phone,
        rider_requirements, technical_requirements, fee, fee_status, travel_requirements,
        accommodation_requirements, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      festival_id, name, genre, contact_name, contact_email, contact_phone,
      rider_requirements, technical_requirements, fee, fee_status, travel_requirements,
      accommodation_requirements, status
    ]);

    const artistId = result.lastID;

    // Get the created artist
    const newArtist = await db.get(`
      SELECT 
        id, festival_id, name, genre, contact_name, contact_email, contact_phone,
        rider_requirements, technical_requirements, fee, fee_status, travel_requirements,
        accommodation_requirements, status, created_at, updated_at
      FROM artists 
      WHERE id = ?
    `, [artistId]);

    res.status(201).json(newArtist);
  } catch (error) {
    console.error('Create artist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update artist
router.put('/:id', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      name, genre, contact_name, contact_email, contact_phone,
      rider_requirements, technical_requirements, fee, fee_status, travel_requirements,
      accommodation_requirements, status
    } = req.body;

    const db = getUniversalDatabase();
    
    // Check if artist exists
    const existingArtist = await db.get(
      'SELECT id FROM artists WHERE id = ?',
      [id]
    );

    if (!existingArtist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Check if another artist with same name exists (excluding current one)
    if (name) {
      const duplicateArtist = await db.get(
        'SELECT id FROM artists WHERE name = ? AND id != ?',
        [name, id]
      );

      if (duplicateArtist) {
        return res.status(400).json({ error: 'Artist with this name already exists' });
      }
    }

    await db.run(`
      UPDATE artists SET 
        name = ?, genre = ?, contact_name = ?, contact_email = ?, contact_phone = ?,
        rider_requirements = ?, technical_requirements = ?, fee = ?, fee_status = ?, travel_requirements = ?,
        accommodation_requirements = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name, genre, contact_name, contact_email, contact_phone,
      rider_requirements, technical_requirements, fee, fee_status, travel_requirements,
      accommodation_requirements, status, id
    ]);

    // Get updated artist
    const updatedArtist = await db.get(`
      SELECT 
        id, festival_id, name, genre, contact_name, contact_email, contact_phone,
        rider_requirements, technical_requirements, fee, fee_status, travel_requirements,
        accommodation_requirements, status, created_at, updated_at
      FROM artists 
      WHERE id = ?
    `, [id]);

    res.json(updatedArtist);
  } catch (error) {
    console.error('Update artist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete artist
router.delete('/:id', authenticateToken, requireMinimumRole('manager'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getUniversalDatabase();

    // Check if artist has scheduled performances
    const performances = await db.all(
      'SELECT id FROM performances WHERE artist_id = ?',
      [id]
    );

    if (performances.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete artist with scheduled performances. Remove performances first.' 
      });
    }

    const result = await db.run(
      'DELETE FROM artists WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    res.json({ message: 'Artist deleted successfully' });
  } catch (error) {
    console.error('Delete artist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get artists for dropdown (id and name only)
router.get('/dropdown/list', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getUniversalDatabase();
    const rows = await db.all(`
      SELECT id, name, status
      FROM artists 
      WHERE status IN ('confirmed', 'contracted')
      ORDER BY name ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error('Get artists dropdown error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;