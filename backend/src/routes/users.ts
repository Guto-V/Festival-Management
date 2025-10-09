import express from 'express';
import { getDatabase } from '../utils/database-sqlite';
import { authenticateToken, requireMinimumRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get all users (admin and manager only)
router.get('/', authenticateToken, requireMinimumRole('manager'), async (req: AuthenticatedRequest, res) => {
  try {
    const db = getDatabase();
    const rows = await db.all(`
      SELECT 
        id, email, first_name, last_name, role, phone, is_active, created_at
      FROM users 
      ORDER BY last_name ASC, first_name ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user role (admin only)
router.put('/:id/role', authenticateToken, requireMinimumRole('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const db = getDatabase();

    const validRoles = ['admin', 'manager', 'coordinator', 'read_only'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const result = await db.run(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deactivate user (admin only)
router.put('/:id/deactivate', authenticateToken, requireMinimumRole('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Prevent deactivating yourself
    if (parseInt(id) === req.user!.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const result = await db.run(
      'UPDATE users SET is_active = FALSE WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;