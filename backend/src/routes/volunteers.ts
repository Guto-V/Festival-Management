import express from 'express';
import { getDatabase } from '../utils/database-sqlite';
import { authenticateToken, requireMinimumRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Volunteers route is working' });
});

// Public volunteer registration endpoint (no auth required)
router.post('/register', async (req, res) => {
  try {
    const { 
      firstName, lastName, email, phone, address, emergencyContact, emergencyPhone,
      experience, availability, inductionCompleted, festival_id
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    if (!festival_id) {
      return res.status(400).json({ error: 'Festival ID is required' });
    }

    const db = getDatabase();
    
    // Map frontend fields to database fields
    const result = await db.run(`
      INSERT INTO volunteers (
        festival_id, first_name, last_name, email, phone, skills,
        emergency_contact_name, emergency_contact_phone, 
        volunteer_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      festival_id, 
      firstName, 
      lastName, 
      email, 
      phone || '',
      `Experience: ${experience || 'Not provided'}\nAvailability: ${availability || 'Not provided'}\nAddress: ${address || 'Not provided'}`,
      emergencyContact || '',
      emergencyPhone || '',
      'applied', // Default status for new applications
      `Induction completed: ${inductionCompleted ? 'Yes' : 'No'}\nSubmitted via public registration form`
    ]);

    res.status(201).json({ 
      message: 'Volunteer application submitted successfully',
      applicationId: result.lastID 
    });
  } catch (error) {
    console.error('Volunteer registration error:', error);
    res.status(500).json({ error: 'Failed to submit application. Please try again.' });
  }
});

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { festival_id } = req.query;
    const db = getDatabase();
    
    let query = `
      SELECT id, festival_id, first_name, last_name, email, phone, skills, t_shirt_size,
             dietary_requirements, emergency_contact_name, emergency_contact_phone, 
             assigned_role, volunteer_status, notes, created_at, updated_at
      FROM volunteers `;
    let params: any[] = [];
    
    if (festival_id) {
      query += 'WHERE festival_id = ? ';
      params.push(festival_id);
    }
    
    query += 'ORDER BY last_name ASC, first_name ASC';
    
    const rows = await db.all(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get volunteers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      festival_id, first_name, last_name, email, phone, skills, t_shirt_size,
      dietary_requirements, emergency_contact_name, emergency_contact_phone, 
      assigned_role, volunteer_status = 'applied', notes 
    } = req.body;

    if (!festival_id || !first_name || !last_name || !email) {
      return res.status(400).json({ error: 'Festival ID, first name, last name, and email are required' });
    }

    const db = getDatabase();
    const result = await db.run(`
      INSERT INTO volunteers (
        festival_id, first_name, last_name, email, phone, skills, t_shirt_size,
        dietary_requirements, emergency_contact_name, emergency_contact_phone, 
        assigned_role, volunteer_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      festival_id, first_name, last_name, email, phone, skills, t_shirt_size,
      dietary_requirements, emergency_contact_name, emergency_contact_phone, 
      assigned_role, volunteer_status, notes
    ]);

    const volunteerId = result.lastID;

    // Get the created volunteer
    const newVolunteer = await db.get(`
      SELECT id, festival_id, first_name, last_name, email, phone, skills, t_shirt_size,
             dietary_requirements, emergency_contact_name, emergency_contact_phone, 
             assigned_role, volunteer_status, notes, created_at, updated_at
      FROM volunteers 
      WHERE id = ?
    `, [volunteerId]);

    res.status(201).json(newVolunteer);
  } catch (error) {
    console.error('Create volunteer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single volunteer
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const volunteer = await db.get(`
      SELECT id, festival_id, first_name, last_name, email, phone, skills, t_shirt_size,
             dietary_requirements, emergency_contact_name, emergency_contact_phone, 
             assigned_role, volunteer_status, notes, created_at, updated_at
      FROM volunteers 
      WHERE id = ?
    `, [id]);

    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    res.json(volunteer);
  } catch (error) {
    console.error('Get volunteer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update volunteer
router.put('/:id', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { 
      first_name, last_name, email, phone, skills, t_shirt_size,
      dietary_requirements, emergency_contact_name, emergency_contact_phone, 
      assigned_role, volunteer_status, notes 
    } = req.body;

    const db = getDatabase();
    
    // Check if volunteer exists
    const existingVolunteer = await db.get('SELECT id FROM volunteers WHERE id = ?', [id]);
    if (!existingVolunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    await db.run(`
      UPDATE volunteers SET 
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        skills = COALESCE(?, skills),
        t_shirt_size = COALESCE(?, t_shirt_size),
        dietary_requirements = COALESCE(?, dietary_requirements),
        emergency_contact_name = COALESCE(?, emergency_contact_name),
        emergency_contact_phone = COALESCE(?, emergency_contact_phone),
        assigned_role = COALESCE(?, assigned_role),
        volunteer_status = COALESCE(?, volunteer_status),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      first_name, last_name, email, phone, skills, t_shirt_size,
      dietary_requirements, emergency_contact_name, emergency_contact_phone, 
      assigned_role, volunteer_status, notes, id
    ]);

    // Get updated volunteer
    const updatedVolunteer = await db.get(`
      SELECT id, festival_id, first_name, last_name, email, phone, skills, t_shirt_size,
             dietary_requirements, emergency_contact_name, emergency_contact_phone, 
             assigned_role, volunteer_status, notes, created_at, updated_at
      FROM volunteers 
      WHERE id = ?
    `, [id]);

    res.json(updatedVolunteer);
  } catch (error) {
    console.error('Update volunteer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete volunteer
router.delete('/:id', authenticateToken, requireMinimumRole('manager'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const result = await db.run('DELETE FROM volunteers WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    res.json({ message: 'Volunteer deleted successfully' });
  } catch (error) {
    console.error('Delete volunteer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;