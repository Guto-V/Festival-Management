import express from 'express';
import { getUniversalDatabase } from '../utils/database-universal';
import { authenticateToken, requireMinimumRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Helper function to convert time string to minutes since midnight
const timeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert minutes since midnight to time string
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Helper function to ensure minimum duration (removed 15-minute forcing)
const validateDuration = (minutes: number): number => {
  return Math.max(5, minutes); // Minimum 5 minutes, but no forced rounding
};

// Get schedule for a specific date and venue
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { festival_id = 1, performance_date, stage_area_id } = req.query as { festival_id?: string; performance_date?: string; stage_area_id?: string };
    const db = getUniversalDatabase();

    let query = `
      SELECT 
        p.id, p.festival_id, p.artist_id, p.stage_area_id, p.performance_date,
        p.start_time, p.duration_minutes, p.changeover_time_after as setup_time,
        p.soundcheck_time, p.soundcheck_duration, p.notes, p.status,
        a.name as artist_name, a.genre,
        sa.name as stage_area_name, sa.type as stage_area_type
      FROM performances p
      JOIN artists a ON p.artist_id = a.id
      JOIN stages_areas sa ON p.stage_area_id = sa.id
      WHERE p.festival_id = ?
    `;
    
    const params: any[] = [festival_id];

    if (performance_date) {
      query += ' AND p.performance_date = ?';
      params.push(performance_date);
    }

    if (stage_area_id) {
      query += ' AND p.stage_area_id = ?';
      params.push(stage_area_id);
    }

    query += ' ORDER BY p.performance_date ASC, p.start_time ASC';

    const rows = await db.all(query, params);

    // Calculate end times and time blocks for each performance
    const performancesWithBlocks = rows.map(performance => {
      const startMinutes = timeToMinutes(performance.start_time);
      const endMinutes = startMinutes + performance.duration_minutes;
      const endTime = minutesToTime(endMinutes);
      
      // Calculate how many 15-minute blocks this performance spans
      const timeBlocks = Math.ceil(performance.duration_minutes / 15);
      
      return {
        ...performance,
        end_time: endTime,
        time_blocks: timeBlocks,
        start_minutes: startMinutes,
        end_minutes: endMinutes
      };
    });

    res.json(performancesWithBlocks);
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detailed schedule grid for a specific date
router.get('/grid/:date', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { date } = req.params;
    const { festival_id, event_id } = req.query as { festival_id?: string; event_id?: string };
    const db = getUniversalDatabase();

    if (!festival_id) {
      return res.status(400).json({ error: 'festival_id is required' });
    }

    // Get all stage areas
    const stageAreas = await db.all(
      `
      SELECT id, name, type 
      FROM stages_areas 
      WHERE event_id = COALESCE(?, 1)
      ORDER BY sort_order ASC, name ASC
    `,
      [event_id || null]
    );

    // Get all performances for this date
    const performances = await db.all(`
      SELECT 
        p.id, p.artist_id, p.stage_area_id, p.start_time, p.duration_minutes,
        p.changeover_time_after as setup_time, p.soundcheck_time, p.soundcheck_duration,
        p.notes, p.status,
        a.name as artist_name, a.genre,
        sa.name as stage_area_name, sa.type as stage_area_type
      FROM performances p
      JOIN artists a ON p.artist_id = a.id
      JOIN stages_areas sa ON p.stage_area_id = sa.id
      WHERE p.festival_id = ? AND p.performance_date = ?
      ORDER BY p.start_time ASC
    `, [festival_id, date]);

    // Create 15-minute time slots from 8:00 to 24:00 (16 hours = 64 slots)
    const timeSlots = [];
    for (let hour = 8; hour < 24; hour++) {
      for (let quarter = 0; quarter < 4; quarter++) {
        const minutes = hour * 60 + quarter * 15;
        timeSlots.push({
          time: minutesToTime(minutes),
          minutes: minutes,
          slot_index: timeSlots.length
        });
      }
    }

    // Create grid structure
    const grid = {
      date,
      venues: stageAreas,
      time_slots: timeSlots,
      performances: performances.map(p => {
        const startMinutes = timeToMinutes(p.start_time);
        const endMinutes = startMinutes + p.duration_minutes;
        const timeBlocks = Math.ceil(p.duration_minutes / 15);
        
        return {
          ...p,
          start_minutes: startMinutes,
          end_minutes: endMinutes,
          time_blocks: timeBlocks,
          end_time: minutesToTime(endMinutes)
        };
      })
    };

    res.json(grid);
  } catch (error) {
    console.error('Get schedule grid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new performance
router.post('/performance', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      festival_id = 1,
      artist_id,
      stage_area_id,
      performance_date,
      start_time,
      duration_minutes,
      setup_time = 15,
      soundcheck_time,
      soundcheck_duration = 30,
      notes,
      status = 'scheduled'
    } = req.body;

    if (!artist_id || !stage_area_id || !performance_date || !start_time || !duration_minutes) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getUniversalDatabase();
    
    // Validate duration (minimum 5 minutes, no forced rounding)
    const validatedDuration = validateDuration(duration_minutes);

    // Check for conflicts
    const startMinutes = timeToMinutes(start_time);
    const endMinutes = startMinutes + validatedDuration + setup_time;

    const conflicts = await db.all(`
      SELECT p.id, a.name as artist_name, p.start_time, p.duration_minutes, p.changeover_time_after,
             (CAST(substr(p.start_time, 1, 2) AS INTEGER) * 60 + CAST(substr(p.start_time, 4, 2) AS INTEGER)) as start_minutes
      FROM performances p
      JOIN artists a ON p.artist_id = a.id
      WHERE p.stage_area_id = ? AND p.performance_date = ? AND p.status != 'cancelled'
      AND (
        (? >= start_minutes AND ? < start_minutes + p.duration_minutes + p.changeover_time_after)
        OR
        (start_minutes >= ? AND start_minutes < ?)
      )
    `, [stage_area_id, performance_date, startMinutes, startMinutes, startMinutes, endMinutes]);

    if (conflicts.length > 0) {
      return res.status(400).json({ 
        error: 'Time slot conflict detected',
        conflicts: conflicts
      });
    }

    const result = await db.run(`
      INSERT INTO performances (
        festival_id, artist_id, stage_area_id, performance_date, start_time,
        duration_minutes, changeover_time_after, soundcheck_time,
        soundcheck_duration, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      festival_id, artist_id, stage_area_id, performance_date, start_time,
      validatedDuration, setup_time, soundcheck_time,
      soundcheck_duration, notes, status
    ]);

    const performanceId = result.lastID;

    // Get the created performance with joined data
    const newPerformance = await db.get(`
      SELECT 
        p.id, p.festival_id, p.artist_id, p.stage_area_id, p.performance_date,
        p.start_time, p.duration_minutes, p.changeover_time_after as setup_time,
        p.soundcheck_time, p.soundcheck_duration, p.notes, p.status,
        a.name as artist_name, a.genre,
        sa.name as stage_area_name, sa.type as stage_area_type
      FROM performances p
      JOIN artists a ON p.artist_id = a.id
      JOIN stages_areas sa ON p.stage_area_id = sa.id
      WHERE p.id = ?
    `, [performanceId]);

    res.status(201).json(newPerformance);
  } catch (error) {
    console.error('Create performance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update performance
router.put('/performance/:id', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      artist_id, stage_area_id, performance_date, start_time, duration_minutes,
      setup_time, soundcheck_time, soundcheck_duration, notes, status
    } = req.body;

    const db = getUniversalDatabase();
    
    // Check if performance exists
    const performance = await db.get(
      'SELECT * FROM performances WHERE id = ?',
      [id]
    );

    if (!performance) {
      return res.status(404).json({ error: 'Performance not found' });
    }

    const validatedDuration = duration_minutes ? validateDuration(duration_minutes) : null;

    // Check for conflicts if time/venue details are being updated
    if (start_time || duration_minutes || stage_area_id || performance_date || setup_time) {
      const checkStartTime = start_time || performance.start_time;
      const checkDuration = validatedDuration || performance.duration_minutes;
      const checkVenueId = stage_area_id || performance.stage_area_id;
      const checkDate = performance_date || performance.performance_date;
      const checkSetupTime = setup_time !== undefined ? setup_time : performance.changeover_time_after;

      const startMinutes = timeToMinutes(checkStartTime);
      const endMinutes = startMinutes + checkDuration + checkSetupTime;

      const conflicts = await db.all(`
        SELECT p.id, a.name as artist_name, p.start_time, p.duration_minutes,
               (CAST(substr(p.start_time, 1, 2) AS INTEGER) * 60 + CAST(substr(p.start_time, 4, 2) AS INTEGER)) as start_minutes
        FROM performances p
        JOIN artists a ON p.artist_id = a.id
        WHERE p.stage_area_id = ? AND p.performance_date = ? AND p.status != 'cancelled' AND p.id != ?
        AND (
          (? >= start_minutes AND ? < start_minutes + p.duration_minutes + p.changeover_time_after)
          OR
          (start_minutes >= ? AND start_minutes < ?)
        )
      `, [checkVenueId, checkDate, id, startMinutes, startMinutes, startMinutes, endMinutes]);

      if (conflicts.length > 0) {
        return res.status(400).json({ 
          error: 'Time slot conflict detected',
          conflicts: conflicts
        });
      }
    }

    await db.run(`
      UPDATE performances SET 
        artist_id = COALESCE(?, artist_id),
        stage_area_id = COALESCE(?, stage_area_id),
        performance_date = COALESCE(?, performance_date),
        start_time = COALESCE(?, start_time),
        duration_minutes = COALESCE(?, duration_minutes),
        changeover_time_after = COALESCE(?, changeover_time_after),
        soundcheck_time = COALESCE(?, soundcheck_time),
        soundcheck_duration = COALESCE(?, soundcheck_duration),
        notes = COALESCE(?, notes),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      artist_id, stage_area_id, performance_date, start_time, validatedDuration,
      setup_time, soundcheck_time, soundcheck_duration, notes, status, id
    ]);

    // Get updated performance
    const updatedPerformance = await db.get(`
      SELECT 
        p.id, p.festival_id, p.artist_id, p.stage_area_id, p.performance_date,
        p.start_time, p.duration_minutes, p.changeover_time_after as setup_time,
        p.soundcheck_time, p.soundcheck_duration, p.notes, p.status,
        a.name as artist_name, a.genre,
        sa.name as stage_area_name, sa.type as stage_area_type
      FROM performances p
      JOIN artists a ON p.artist_id = a.id
      JOIN stages_areas sa ON p.stage_area_id = sa.id
      WHERE p.id = ?
    `, [id]);

    res.json(updatedPerformance);
  } catch (error) {
    console.error('Update performance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete performance
router.delete('/performance/:id', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getUniversalDatabase();

    const result = await db.run(
      'DELETE FROM performances WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Performance not found' });
    }

    res.json({ message: 'Performance deleted successfully' });
  } catch (error) {
    console.error('Delete performance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;