import express from 'express';
import { getDatabase } from '../utils/database-sqlite';
import { authenticateToken, requireMinimumRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get all festivals
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getDatabase();
    const festivals = await db.all(`
      SELECT f.id, f.name, f.year, f.start_date, f.end_date, f.venue_id, f.location, 
             f.description, f.status, f.budget_total, f.budget_allocated, 
             f.event_start_time, f.event_end_time, f.use_custom_daily_times, f.daily_times,
             f.created_at, f.updated_at, v.name as venue_name
      FROM festivals f
      LEFT JOIN venues v ON f.venue_id = v.id
      ORDER BY f.year DESC, f.start_date DESC
    `);
    
    res.json(festivals);
  } catch (error) {
    console.error('Get festivals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get festival by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const festival = await db.get(`
      SELECT f.id, f.name, f.year, f.start_date, f.end_date, f.venue_id, f.location, 
             f.description, f.status, f.budget_total, f.budget_allocated, 
             f.event_start_time, f.event_end_time, f.use_custom_daily_times, f.daily_times,
             f.created_at, f.updated_at, v.name as venue_name
      FROM festivals f
      LEFT JOIN venues v ON f.venue_id = v.id
      WHERE f.id = ?
    `, [id]);
    
    if (!festival) {
      return res.status(404).json({ error: 'Festival not found' });
    }
    
    res.json(festival);
  } catch (error) {
    console.error('Get festival error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new festival
router.post('/', authenticateToken, requireMinimumRole('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      year,
      start_date,
      end_date,
      location = '',
      description = '',
      status = 'planning',
      budget_total = 0
    } = req.body;

    if (!name || !year || !start_date || !end_date) {
      return res.status(400).json({ error: 'Name, year, start date, and end date are required' });
    }

    // Validate date format and range
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    if (endDate < startDate) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const db = getDatabase();
    
    // Check if festival with same name and year already exists
    const existingFestival = await db.get(
      'SELECT id FROM festivals WHERE name = ? AND year = ?',
      [name, year]
    );

    if (existingFestival) {
      return res.status(400).json({ error: 'Festival with this name and year already exists' });
    }

    const result = await db.run(`
      INSERT INTO festivals (name, year, start_date, end_date, location, description, status, budget_total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, year, start_date, end_date, location, description, status, budget_total]);

    const festivalId = result.lastID;

    // Get the created festival
    const newFestival = await db.get(`
      SELECT id, name, year, start_date, end_date, location, description, status,
             budget_total, budget_allocated, event_start_time, event_end_time,
             use_custom_daily_times, daily_times, created_at, updated_at
      FROM festivals
      WHERE id = ?
    `, [festivalId]);

    res.status(201).json(newFestival);
  } catch (error) {
    console.error('Create festival error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update festival
router.put('/:id', authenticateToken, requireMinimumRole('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      name, year, start_date, end_date, location, description, status, budget_total,
      event_start_time, event_end_time, use_custom_daily_times, daily_times
    } = req.body;

    const db = getDatabase();
    
    // Check if festival exists
    const festival = await db.get(
      'SELECT * FROM festivals WHERE id = ?',
      [id]
    );

    if (!festival) {
      return res.status(404).json({ error: 'Festival not found' });
    }

    // Check for name/year conflicts with other festivals
    if (name && year) {
      const conflictingFestival = await db.get(
        'SELECT id FROM festivals WHERE name = ? AND year = ? AND id != ?',
        [name, year, id]
      );

      if (conflictingFestival) {
        return res.status(400).json({ error: 'Festival with this name and year already exists' });
      }
    }

    await db.run(`
      UPDATE festivals SET 
        name = COALESCE(?, name),
        year = COALESCE(?, year),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        location = COALESCE(?, location),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        budget_total = COALESCE(?, budget_total),
        event_start_time = COALESCE(?, event_start_time),
        event_end_time = COALESCE(?, event_end_time),
        use_custom_daily_times = COALESCE(?, use_custom_daily_times),
        daily_times = COALESCE(?, daily_times),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, year, start_date, end_date, location, description, status, budget_total, event_start_time, event_end_time, use_custom_daily_times, daily_times ? JSON.stringify(daily_times) : null, id]);

    // Get updated festival
    const updatedFestival = await db.get(`
      SELECT id, name, year, start_date, end_date, location, description, status,
             budget_total, budget_allocated, event_start_time, event_end_time,
             use_custom_daily_times, daily_times, created_at, updated_at
      FROM festivals
      WHERE id = ?
    `, [id]);

    res.json(updatedFestival);
  } catch (error) {
    console.error('Update festival error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete festival
router.delete('/:id', authenticateToken, requireMinimumRole('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;
    const db = getDatabase();

    // Check if festival exists first
    const festival = await db.get('SELECT id FROM festivals WHERE id = ?', [id]);
    if (!festival) {
      return res.status(404).json({ error: 'Festival not found' });
    }

    // Check if festival has associated data
    const associatedData = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM stages_areas WHERE event_id = ?) as stage_count,
        (SELECT COUNT(*) FROM performances WHERE festival_id = ?) as performance_count,
        (SELECT COUNT(*) FROM artists WHERE festival_id = ?) as artist_count,
        (SELECT COUNT(*) FROM volunteers WHERE festival_id = ?) as volunteer_count,
        (SELECT COUNT(*) FROM vendors WHERE festival_id = ?) as vendor_count,
        (SELECT COUNT(*) FROM budget_items WHERE festival_id = ?) as budget_count,
        (SELECT COUNT(*) FROM documents WHERE festival_id = ?) as document_count
    `, [id, id, id, id, id, id, id]);

    const totalAssociatedRecords = (associatedData?.stage_count || 0) + 
                                  (associatedData?.performance_count || 0) + 
                                  (associatedData?.artist_count || 0) +
                                  (associatedData?.volunteer_count || 0) +
                                  (associatedData?.vendor_count || 0) +
                                  (associatedData?.budget_count || 0) +
                                  (associatedData?.document_count || 0);

    if (totalAssociatedRecords > 0 && force !== 'true') {
      return res.status(400).json({ 
        error: 'Cannot delete festival with associated data',
        canForceDelete: true,
        details: {
          stages: associatedData?.stage_count || 0,
          performances: associatedData?.performance_count || 0,
          artists: associatedData?.artist_count || 0,
          volunteers: associatedData?.volunteer_count || 0,
          vendors: associatedData?.vendor_count || 0,
          budget_items: associatedData?.budget_count || 0,
          documents: associatedData?.document_count || 0
        }
      });
    }

    // If force delete, delete all associated data first
    if (force === 'true') {
      await db.run('DELETE FROM documents WHERE festival_id = ?', [id]);
      await db.run('DELETE FROM budget_items WHERE festival_id = ?', [id]);
      await db.run('DELETE FROM performances WHERE festival_id = ?', [id]);
      await db.run('DELETE FROM vendors WHERE festival_id = ?', [id]);
      await db.run('DELETE FROM volunteers WHERE festival_id = ?', [id]);
      await db.run('DELETE FROM artists WHERE festival_id = ?', [id]);
      await db.run('DELETE FROM stages_areas WHERE event_id = ?', [id]);
    }

    const result = await db.run(
      'DELETE FROM festivals WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Festival not found' });
    }

    res.json({ message: 'Festival deleted successfully' });
  } catch (error) {
    console.error('Delete festival error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      params: req.params,
      query: req.query
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get festival statistics
router.get('/:id/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const stats = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM stages_areas WHERE event_id = ? AND is_active = TRUE) as stage_count,
        (SELECT COUNT(*) FROM performances WHERE festival_id = ?) as performance_count,
        (SELECT COUNT(*) FROM artists WHERE festival_id = ?) as artist_count,
        (SELECT COUNT(*) FROM volunteers WHERE festival_id = ?) as volunteer_count,
        (SELECT COUNT(*) FROM vendors WHERE festival_id = ?) as vendor_count,
        (SELECT SUM(amount) FROM budget_items WHERE festival_id = ? AND type = 'income') as total_income,
        (SELECT SUM(amount) FROM budget_items WHERE festival_id = ? AND type = 'expense') as total_expenses
    `, [id, id, id, id, id, id, id]);

    res.json({
      festival_id: parseInt(id),
      stages: stats.stage_count || 0,
      performances: stats.performance_count || 0,
      artists: stats.artist_count || 0,
      volunteers: stats.volunteer_count || 0,
      vendors: stats.vendor_count || 0,
      total_income: stats.total_income || 0,
      total_expenses: stats.total_expenses || 0,
      net_profit: (stats.total_income || 0) - (stats.total_expenses || 0)
    });
  } catch (error) {
    console.error('Get festival stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clone festival (create a copy for new year)
router.post('/:id/clone', authenticateToken, requireMinimumRole('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { 
      name, year, start_date, end_date, 
      cloneOptions = { venues: true, artists: false, volunteers: false, vendors: false, budget: false }
    } = req.body;

    if (!name || !year || !start_date || !end_date) {
      return res.status(400).json({ error: 'Name, year, start date, and end date are required for cloning' });
    }

    const db = getDatabase();
    
    // Get original festival
    const originalFestival = await db.get(
      'SELECT * FROM festivals WHERE id = ?',
      [id]
    );

    if (!originalFestival) {
      return res.status(404).json({ error: 'Festival not found' });
    }

    // Create new festival
    const result = await db.run(`
      INSERT INTO festivals (name, year, start_date, end_date, location, description, status, budget_total)
      VALUES (?, ?, ?, ?, ?, ?, 'planning', ?)
    `, [name, year, start_date, end_date, originalFestival.location, originalFestival.description, 
        cloneOptions.budget ? originalFestival.budget_total : 0]);

    const newFestivalId = result.lastID;

    // Clone stages/areas (always clone these as they're needed for the schedule)
    if (cloneOptions.venues !== false) {
      const stages = await db.all('SELECT * FROM stages_areas WHERE event_id = ?', [id]);
      for (const stage of stages) {
        await db.run(`
          INSERT INTO stages_areas (event_id, name, type, setup_time, breakdown_time, sort_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [newFestivalId, stage.name, stage.type, stage.setup_time, stage.breakdown_time, stage.sort_order]);
      }
    }

    // Clone artists (basic contact info only, no contracts/fees)
    if (cloneOptions.artists) {
      const artists = await db.all('SELECT * FROM artists WHERE festival_id = ?', [id]);
      for (const artist of artists) {
        await db.run(`
          INSERT INTO artists (festival_id, name, genre, contact_name, contact_email, contact_phone, status, fee_status)
          VALUES (?, ?, ?, ?, ?, ?, 'inquired', 'quoted')
        `, [newFestivalId, artist.name, artist.genre, artist.contact_name, artist.contact_email, artist.contact_phone]);
      }
    }

    // Clone volunteers (basic info only, no assignments)
    if (cloneOptions.volunteers) {
      const volunteers = await db.all('SELECT * FROM volunteers WHERE festival_id = ?', [id]);
      for (const volunteer of volunteers) {
        await db.run(`
          INSERT INTO volunteers (festival_id, first_name, last_name, email, phone, skills, volunteer_status)
          VALUES (?, ?, ?, ?, ?, ?, 'applied')
        `, [newFestivalId, volunteer.first_name, volunteer.last_name, volunteer.email, volunteer.phone, volunteer.skills]);
      }
    }

    // Clone vendors (basic contact info only, no contracts)
    if (cloneOptions.vendors) {
      const vendors = await db.all('SELECT * FROM vendors WHERE festival_id = ?', [id]);
      for (const vendor of vendors) {
        await db.run(`
          INSERT INTO vendors (festival_id, name, type, contact_name, contact_email, contact_phone, services_offered, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'inquiry')
        `, [newFestivalId, vendor.name, vendor.type, vendor.contact_name, vendor.contact_email, vendor.contact_phone, vendor.services_offered]);
      }
    }

    // Clone budget structure (categories only, no amounts)
    if (cloneOptions.budget) {
      const budgetItems = await db.all('SELECT DISTINCT category, type FROM budget_items WHERE festival_id = ?', [id]);
      for (const item of budgetItems) {
        await db.run(`
          INSERT INTO budget_items (festival_id, name, category, type, amount, payment_status)
          VALUES (?, ?, ?, ?, 0, 'pending')
        `, [newFestivalId, `${item.category} Template`, item.category, item.type]);
      }
    }

    // Get the created festival
    const newFestival = await db.get(`
      SELECT id, name, year, start_date, end_date, location, description, status,
             budget_total, budget_allocated, event_start_time, event_end_time,
             use_custom_daily_times, daily_times, created_at, updated_at
      FROM festivals
      WHERE id = ?
    `, [newFestivalId]);

    res.status(201).json(newFestival);
  } catch (error) {
    console.error('Clone festival error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;