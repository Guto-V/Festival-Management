import express from 'express';
import { getUniversalDatabase } from '../utils/database-universal';
import { authenticateToken, requireMinimumRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

router.get('/templates', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getUniversalDatabase();
    const rows = await db.all(`
      SELECT * FROM document_templates WHERE is_active = TRUE ORDER BY name ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Get document templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getUniversalDatabase();
    const rows = await db.all(`
      SELECT d.*, dt.name as template_name 
      FROM documents d 
      LEFT JOIN document_templates dt ON d.template_id = dt.id 
      ORDER BY d.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;