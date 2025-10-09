import express from 'express';
import { getDatabase } from '../utils/database-sqlite';
import { authenticateToken, requireMinimumRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get all stages and areas for an event
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { event_id = 1 } = req.query; // Default to event 1 for now
    const db = getDatabase();

    const rows = await db.all(`
      SELECT 
        id, event_id, name, type, setup_time, breakdown_time, sort_order, is_active
      FROM stages_areas 
      WHERE event_id = ? AND is_active = TRUE
      ORDER BY sort_order ASC, name ASC
    `, [event_id]);

    res.json(rows);
  } catch (error) {
    console.error('Get stages and areas error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reorder stages and areas - MUST come before /:id route
router.put('/reorder', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const { stageAreaOrders } = req.body; // Array of { id, sort_order }

    if (!Array.isArray(stageAreaOrders)) {
      return res.status(400).json({ error: 'stageAreaOrders must be an array' });
    }

    const db = getDatabase();
    
    // Update all stage/area orders in a transaction-like manner
    for (const stageAreaOrder of stageAreaOrders) {
      await db.run(
        'UPDATE stages_areas SET sort_order = ? WHERE id = ?',
        [stageAreaOrder.sort_order, stageAreaOrder.id]
      );
    }

    res.json({ message: 'Stage and area order updated successfully' });
  } catch (error) {
    console.error('Reorder stages and areas error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single stage/area
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const stageArea = await db.get(`
      SELECT 
        id, event_id, name, type, setup_time, breakdown_time, sort_order, is_active
      FROM stages_areas 
      WHERE id = ?
    `, [id]);

    if (!stageArea) {
      return res.status(404).json({ error: 'Stage or area not found' });
    }

    res.json(stageArea);
  } catch (error) {
    console.error('Get stage/area error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new stage/area
router.post('/', authenticateToken, requireMinimumRole('manager'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      event_id = 1,
      name,
      type,
      setup_time = 0,
      breakdown_time = 0
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const db = getDatabase();
    
    // Check if stage/area with same name already exists for this event
    const existingStageArea = await db.get(
      'SELECT id FROM stages_areas WHERE name = ? AND event_id = ?',
      [name, event_id]
    );

    if (existingStageArea) {
      return res.status(400).json({ error: 'Stage or area with this name already exists for this event' });
    }

    // Get the next sort order for this event
    const maxSortOrder = await db.get(
      'SELECT MAX(sort_order) as max_order FROM stages_areas WHERE event_id = ?',
      [event_id]
    );
    const nextSortOrder = (maxSortOrder?.max_order || 0) + 1;

    const result = await db.run(`
      INSERT INTO stages_areas (event_id, name, type, setup_time, breakdown_time, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [event_id, name, type, setup_time, breakdown_time, nextSortOrder]);

    const stageAreaId = result.lastID;

    // Get the created stage/area
    const newStageArea = await db.get(`
      SELECT 
        id, event_id, name, type, setup_time, breakdown_time, sort_order, is_active
      FROM stages_areas 
      WHERE id = ?
    `, [stageAreaId]);

    res.status(201).json(newStageArea);
  } catch (error) {
    console.error('Create stage/area error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update stage/area
router.put('/:id', authenticateToken, requireMinimumRole('manager'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, type, setup_time, breakdown_time, is_active } = req.body;
    const db = getDatabase();

    // Check if stage/area exists
    const stageArea = await db.get(
      'SELECT event_id FROM stages_areas WHERE id = ?',
      [id]
    );

    if (!stageArea) {
      return res.status(404).json({ error: 'Stage or area not found' });
    }

    // Check if another stage/area with same name exists (excluding current one)
    if (name) {
      const duplicateStageArea = await db.get(
        'SELECT id FROM stages_areas WHERE name = ? AND event_id = ? AND id != ?',
        [name, stageArea.event_id, id]
      );

      if (duplicateStageArea) {
        return res.status(400).json({ error: 'Stage or area with this name already exists for this event' });
      }
    }

    await db.run(`
      UPDATE stages_areas SET 
        name = ?, type = ?, setup_time = ?, breakdown_time = ?, is_active = ?
      WHERE id = ?
    `, [name, type, setup_time, breakdown_time, is_active, id]);

    // Get updated stage/area
    const updatedStageArea = await db.get(`
      SELECT 
        id, event_id, name, type, setup_time, breakdown_time, sort_order, is_active
      FROM stages_areas 
      WHERE id = ?
    `, [id]);

    res.json(updatedStageArea);
  } catch (error) {
    console.error('Update stage/area error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete stage/area (soft delete - set is_active to false)
router.delete('/:id', authenticateToken, requireMinimumRole('manager'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if stage/area has scheduled performances
    const performances = await db.all(
      'SELECT id FROM performances WHERE stage_area_id = ? AND status != "cancelled"',
      [id]
    );

    if (performances.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete stage/area with scheduled performances. Cancel performances first.' 
      });
    }

    const result = await db.run(
      'UPDATE stages_areas SET is_active = FALSE WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Stage or area not found' });
    }

    res.json({ message: 'Stage or area deactivated successfully' });
  } catch (error) {
    console.error('Delete stage/area error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;