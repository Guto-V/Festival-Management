import express from 'express';
import { getDatabase } from '../utils/database-sqlite';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import crypto from 'crypto';

const router = express.Router();

// Get all contracts for an artist
router.get('/artist/:artistId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { artistId } = req.params;
    const db = getDatabase();
    
    const contracts = await db.all(`
      SELECT 
        ac.*,
        a.name as artist_name,
        ct.name as template_name,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM artist_contracts ac
      LEFT JOIN artists a ON ac.artist_id = a.id
      LEFT JOIN contract_templates ct ON ac.template_id = ct.id
      LEFT JOIN users u ON ac.created_by = u.id
      WHERE ac.artist_id = ?
      ORDER BY ac.created_at DESC
    `, [artistId]);

    res.json(contracts);
  } catch (error) {
    console.error('Get artist contracts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all contract templates
router.get('/templates', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { festival_id } = req.query;
    const db = getDatabase();
    
    let query = 'SELECT * FROM contract_templates';
    let params: any[] = [];
    
    if (festival_id) {
      query += ' WHERE festival_id = ? OR festival_id IS NULL';
      params.push(festival_id);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const templates = await db.all(query, params);
    res.json(templates);
  } catch (error) {
    console.error('Get contract templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new contract template
router.post('/templates', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, content, festival_id } = req.body;
    
    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }

    const db = getDatabase();
    const result = await db.run(`
      INSERT INTO contract_templates (name, content, festival_id, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [name, content, festival_id || null, req.user?.id]);

    const newTemplate = await db.get(
      'SELECT * FROM contract_templates WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Create contract template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update contract template
router.put('/templates/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, content } = req.body;

    const db = getDatabase();
    await db.run(`
      UPDATE contract_templates 
      SET name = ?, content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, content, id]);

    const updatedTemplate = await db.get(
      'SELECT * FROM contract_templates WHERE id = ?',
      [id]
    );

    res.json(updatedTemplate);
  } catch (error) {
    console.error('Update contract template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete contract template
router.delete('/templates/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    await db.run('DELETE FROM contract_templates WHERE id = ?', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Delete contract template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new contract for artist
router.post('/artist/:artistId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { artistId } = req.params;
    const { template_id, custom_content, deadline } = req.body;

    if (!template_id) {
      return res.status(400).json({ error: 'Template ID is required' });
    }

    const db = getDatabase();
    
    // Generate secure token for contract signing
    const secureToken = crypto.randomBytes(32).toString('hex');

    const result = await db.run(`
      INSERT INTO artist_contracts (
        artist_id, template_id, custom_content, secure_token, 
        deadline, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [artistId, template_id, custom_content, secureToken, deadline, req.user?.id]);

    const newContract = await db.get(`
      SELECT 
        ac.*,
        a.name as artist_name,
        ct.name as template_name,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM artist_contracts ac
      LEFT JOIN artists a ON ac.artist_id = a.id
      LEFT JOIN contract_templates ct ON ac.template_id = ct.id
      LEFT JOIN users u ON ac.created_by = u.id
      WHERE ac.id = ?
    `, [result.lastID]);

    res.status(201).json(newContract);
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send contract to artist
router.put('/artist/:artistId/:contractId/send', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { contractId } = req.params;
    const db = getDatabase();

    await db.run(`
      UPDATE artist_contracts 
      SET status = 'sent', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [contractId]);

    const updatedContract = await db.get(
      'SELECT * FROM artist_contracts WHERE id = ?',
      [contractId]
    );

    res.json(updatedContract);
  } catch (error) {
    console.error('Send contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resend contract to artist
router.put('/artist/:artistId/:contractId/resend', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { contractId } = req.params;
    const db = getDatabase();

    await db.run(`
      UPDATE artist_contracts 
      SET sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [contractId]);

    const updatedContract = await db.get(
      'SELECT * FROM artist_contracts WHERE id = ?',
      [contractId]
    );

    res.json(updatedContract);
  } catch (error) {
    console.error('Resend contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Void contract
router.put('/artist/:artistId/:contractId/void', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { contractId } = req.params;
    const db = getDatabase();

    await db.run(`
      UPDATE artist_contracts 
      SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [contractId]);

    const updatedContract = await db.get(
      'SELECT * FROM artist_contracts WHERE id = ?',
      [contractId]
    );

    res.json(updatedContract);
  } catch (error) {
    console.error('Void contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete contract
router.delete('/artist/:artistId/:contractId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { contractId } = req.params;
    const db = getDatabase();
    
    await db.run('DELETE FROM artist_contracts WHERE id = ?', [contractId]);
    res.status(204).send();
  } catch (error) {
    console.error('Delete contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get contract for signing (public endpoint - no auth needed)
router.get('/sign/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const db = getDatabase();

    const contract = await db.get(`
      SELECT 
        ac.*,
        a.name as artist_name,
        a.contact_email,
        ct.name as template_name,
        ct.content as template_content
      FROM artist_contracts ac
      LEFT JOIN artists a ON ac.artist_id = a.id
      LEFT JOIN contract_templates ct ON ac.template_id = ct.id
      WHERE ac.secure_token = ? AND ac.status != 'expired'
    `, [token]);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found or expired' });
    }

    // Mark as viewed if not already
    if (contract.status === 'sent') {
      await db.run(`
        UPDATE artist_contracts 
        SET status = 'viewed', viewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [contract.id]);
      contract.status = 'viewed';
      contract.viewed_at = new Date().toISOString();
    }

    res.json(contract);
  } catch (error) {
    console.error('Get contract for signing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign contract (public endpoint)
router.post('/sign/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { signature_data } = req.body;

    if (!signature_data) {
      return res.status(400).json({ error: 'Signature data is required' });
    }

    const db = getDatabase();
    
    // Verify contract exists and can be signed
    const contract = await db.get(
      'SELECT * FROM artist_contracts WHERE secure_token = ? AND status IN (?, ?)',
      [token, 'sent', 'viewed']
    );

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found or cannot be signed' });
    }

    // Update contract as signed
    await db.run(`
      UPDATE artist_contracts 
      SET status = 'signed', signed_at = CURRENT_TIMESTAMP, signature_data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [signature_data, contract.id]);

    // Update artist status to contracted
    await db.run(`
      UPDATE artists 
      SET status = 'contracted', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [contract.artist_id]);

    const updatedContract = await db.get(
      'SELECT * FROM artist_contracts WHERE id = ?',
      [contract.id]
    );

    res.json({ message: 'Contract signed successfully', contract: updatedContract });
  } catch (error) {
    console.error('Sign contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;