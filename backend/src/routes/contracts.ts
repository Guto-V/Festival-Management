import express from 'express';
import { getDatabase } from '../utils/database-sqlite';
import { authenticateToken, requireMinimumRole, AuthenticatedRequest } from '../middleware/auth';
import crypto from 'crypto';

const router = express.Router();

// Get all contract templates for a festival
router.get('/templates', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { festival_id = 1 } = req.query;
    const db = getDatabase();
    
    const templates = await db.all(`
      SELECT ct.*, u.first_name, u.last_name
      FROM contract_templates ct
      JOIN users u ON ct.created_by = u.id
      WHERE ct.festival_id = ?
      ORDER BY ct.is_default DESC, ct.created_at DESC
    `, [festival_id]);

    res.json(templates);
  } catch (error) {
    console.error('Get contract templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new contract template
router.post('/templates', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const { festival_id = 1, name, description, content, is_default = false } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }

    const db = getDatabase();

    // If this is being set as default, unset other defaults for this festival
    if (is_default) {
      await db.run(
        'UPDATE contract_templates SET is_default = FALSE WHERE festival_id = ?',
        [festival_id]
      );
    }

    const result = await db.run(`
      INSERT INTO contract_templates (festival_id, name, description, content, is_default, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [festival_id, name, description, content, is_default, req.user!.id]);

    const templateId = result.lastID;

    // Get the created template
    const newTemplate = await db.get(`
      SELECT ct.*, u.first_name, u.last_name
      FROM contract_templates ct
      JOIN users u ON ct.created_by = u.id
      WHERE ct.id = ?
    `, [templateId]);

    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Create contract template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update contract template
router.put('/templates/:id', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, content, is_default } = req.body;
    const db = getDatabase();

    // Check if template exists
    const existingTemplate = await db.get('SELECT * FROM contract_templates WHERE id = ?', [id]);
    if (!existingTemplate) {
      return res.status(404).json({ error: 'Contract template not found' });
    }

    // If this is being set as default, unset other defaults for this festival
    if (is_default) {
      await db.run(
        'UPDATE contract_templates SET is_default = FALSE WHERE festival_id = ? AND id != ?',
        [existingTemplate.festival_id, id]
      );
    }

    await db.run(`
      UPDATE contract_templates SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        content = COALESCE(?, content),
        is_default = COALESCE(?, is_default),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, content, is_default, id]);

    // Get updated template
    const updatedTemplate = await db.get(`
      SELECT ct.*, u.first_name, u.last_name
      FROM contract_templates ct
      JOIN users u ON ct.created_by = u.id
      WHERE ct.id = ?
    `, [id]);

    res.json(updatedTemplate);
  } catch (error) {
    console.error('Update contract template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get artist contracts
router.get('/artist/:artistId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { artistId } = req.params;
    const db = getDatabase();

    const contracts = await db.all(`
      SELECT ac.*, ct.name as template_name, a.name as artist_name,
             u.first_name, u.last_name
      FROM artist_contracts ac
      JOIN contract_templates ct ON ac.template_id = ct.id
      JOIN artists a ON ac.artist_id = a.id
      JOIN users u ON ac.created_by = u.id
      WHERE ac.artist_id = ?
      ORDER BY ac.created_at DESC
    `, [artistId]);

    res.json(contracts);
  } catch (error) {
    console.error('Get artist contracts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create contract for artist
router.post('/artist/:artistId', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const { artistId } = req.params;
    const { template_id, custom_content, deadline } = req.body;
    const db = getDatabase();

    // Verify artist exists
    const artist = await db.get('SELECT * FROM artists WHERE id = ?', [artistId]);
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Verify template exists
    const template = await db.get('SELECT * FROM contract_templates WHERE id = ?', [template_id]);
    if (!template) {
      return res.status(404).json({ error: 'Contract template not found' });
    }

    // Generate secure token for contract link
    const secureToken = crypto.randomBytes(32).toString('hex');

    const result = await db.run(`
      INSERT INTO artist_contracts (artist_id, template_id, custom_content, secure_token, deadline, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [artistId, template_id, custom_content, secureToken, deadline, req.user!.id]);

    const contractId = result.lastID;

    // Create initial version entry
    const finalContent = custom_content || template.content;
    await db.run(`
      INSERT INTO contract_versions (contract_id, version_number, content, changes_summary, created_by)
      VALUES (?, ?, ?, ?, ?)
    `, [contractId, 1, finalContent, 'Initial contract version', req.user!.id]);

    // Get the created contract
    const newContract = await db.get(`
      SELECT ac.*, ct.name as template_name, a.name as artist_name,
             u.first_name, u.last_name
      FROM artist_contracts ac
      JOIN contract_templates ct ON ac.template_id = ct.id
      JOIN artists a ON ac.artist_id = a.id
      JOIN users u ON ac.created_by = u.id
      WHERE ac.id = ?
    `, [contractId]);

    res.status(201).json(newContract);
  } catch (error) {
    console.error('Create artist contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send contract (mark as sent)
router.put('/artist/:artistId/:contractId/send', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const { artistId, contractId } = req.params;
    const db = getDatabase();

    const result = await db.run(`
      UPDATE artist_contracts 
      SET status = 'sent', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND artist_id = ?
    `, [contractId, artistId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Get updated contract
    const updatedContract = await db.get(`
      SELECT ac.*, ct.name as template_name, a.name as artist_name
      FROM artist_contracts ac
      JOIN contract_templates ct ON ac.template_id = ct.id
      JOIN artists a ON ac.artist_id = a.id
      WHERE ac.id = ? AND ac.artist_id = ?
    `, [contractId, artistId]);

    res.json(updatedContract);
  } catch (error) {
    console.error('Send contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public contract view (no authentication required)
router.get('/public/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const db = getDatabase();

    const contract = await db.get(`
      SELECT ac.*, ct.name as template_name, ct.content as template_content,
             a.name as artist_name, a.contact_name, a.contact_email, a.fee,
             a.technical_requirements, a.rider_requirements,
             f.name as festival_name, f.start_date, f.end_date, f.location,
             p.performance_date, p.start_time, p.duration_minutes,
             sa.name as stage_name
      FROM artist_contracts ac
      JOIN contract_templates ct ON ac.template_id = ct.id
      JOIN artists a ON ac.artist_id = a.id
      JOIN festivals f ON a.festival_id = f.id
      LEFT JOIN performances p ON a.id = p.artist_id
      LEFT JOIN stages_areas sa ON p.stage_area_id = sa.id
      WHERE ac.secure_token = ? AND ac.status != 'draft'
    `, [token]);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found or not available' });
    }

    // Mark as viewed if not already
    if (contract.status === 'sent') {
      await db.run(`
        UPDATE artist_contracts 
        SET status = 'viewed', viewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE secure_token = ?
      `, [token]);
    }

    // Process contract content with dynamic replacements
    const processedContent = processContractContent(contract);

    res.json({
      id: contract.id,
      artist_name: contract.artist_name,
      festival_name: contract.festival_name,
      content: processedContent,
      status: contract.status,
      deadline: contract.deadline,
      signed_at: contract.signed_at
    });
  } catch (error) {
    console.error('Get public contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign contract (public endpoint)
router.post('/public/:token/sign', async (req, res) => {
  try {
    const { token } = req.params;
    const { signature_data } = req.body;
    const db = getDatabase();

    // Verify contract exists and is signable
    const contract = await db.get(`
      SELECT ac.*, a.id as artist_id FROM artist_contracts ac
      JOIN artists a ON ac.artist_id = a.id
      WHERE ac.secure_token = ? AND ac.status IN ('sent', 'viewed')
    `, [token]);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found or not available for signing' });
    }

    // Check deadline if set
    if (contract.deadline && new Date() > new Date(contract.deadline)) {
      return res.status(400).json({ error: 'Contract deadline has passed' });
    }

    // Update contract as signed
    await db.run(`
      UPDATE artist_contracts 
      SET status = 'signed', signed_at = CURRENT_TIMESTAMP, signature_data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE secure_token = ?
    `, [signature_data, token]);

    // Update artist status to 'contracted' when they sign
    await db.run(`
      UPDATE artists 
      SET status = 'contracted', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [contract.artist_id]);

    res.json({ message: 'Contract signed successfully', signed_at: new Date().toISOString() });
  } catch (error) {
    console.error('Sign contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Void contract (mark as void and revert artist status)
router.put('/artist/:artistId/:contractId/void', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const { artistId, contractId } = req.params;
    const db = getDatabase();

    const result = await db.run(`
      UPDATE artist_contracts 
      SET status = 'void', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND artist_id = ?
    `, [contractId, artistId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Revert artist status to 'confirmed' when contract is voided
    await db.run(`
      UPDATE artists 
      SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [artistId]);

    // Get updated contract
    const updatedContract = await db.get(`
      SELECT ac.*, ct.name as template_name, a.name as artist_name
      FROM artist_contracts ac
      JOIN contract_templates ct ON ac.template_id = ct.id
      JOIN artists a ON ac.artist_id = a.id
      WHERE ac.id = ? AND ac.artist_id = ?
    `, [contractId, artistId]);

    res.json(updatedContract);
  } catch (error) {
    console.error('Void contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete contract
router.delete('/artist/:artistId/:contractId', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const { artistId, contractId } = req.params;
    const db = getDatabase();

    // Check if contract exists
    const contract = await db.get('SELECT * FROM artist_contracts WHERE id = ? AND artist_id = ?', [contractId, artistId]);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Delete contract versions first (foreign key constraint)
    await db.run('DELETE FROM contract_versions WHERE contract_id = ?', [contractId]);
    
    // Delete the contract
    await db.run('DELETE FROM artist_contracts WHERE id = ? AND artist_id = ?', [contractId, artistId]);

    // Revert artist status to 'confirmed' when contract is deleted
    await db.run(`
      UPDATE artists 
      SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [artistId]);

    res.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Delete contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resend contract (regenerate token and mark as sent)
router.put('/artist/:artistId/:contractId/resend', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const { artistId, contractId } = req.params;
    const db = getDatabase();

    // Generate new secure token
    const secureToken = crypto.randomBytes(32).toString('hex');

    const result = await db.run(`
      UPDATE artist_contracts 
      SET status = 'sent', secure_token = ?, sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND artist_id = ?
    `, [secureToken, contractId, artistId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Get updated contract
    const updatedContract = await db.get(`
      SELECT ac.*, ct.name as template_name, a.name as artist_name
      FROM artist_contracts ac
      JOIN contract_templates ct ON ac.template_id = ct.id
      JOIN artists a ON ac.artist_id = a.id
      WHERE ac.id = ? AND ac.artist_id = ?
    `, [contractId, artistId]);

    res.json(updatedContract);
  } catch (error) {
    console.error('Resend contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update contract content (amend)
router.put('/artist/:artistId/:contractId/amend', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const { artistId, contractId } = req.params;
    const { custom_content, deadline } = req.body;
    const db = getDatabase();

    // Check if contract exists
    const contract = await db.get('SELECT * FROM artist_contracts WHERE id = ? AND artist_id = ?', [contractId, artistId]);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Update contract
    await db.run(`
      UPDATE artist_contracts 
      SET custom_content = ?, deadline = ?, status = 'draft', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND artist_id = ?
    `, [custom_content, deadline, contractId, artistId]);

    // Create new version entry
    const versionCount = await db.get('SELECT COUNT(*) as count FROM contract_versions WHERE contract_id = ?', [contractId]);
    const nextVersion = versionCount.count + 1;

    await db.run(`
      INSERT INTO contract_versions (contract_id, version_number, content, changes_summary, created_by)
      VALUES (?, ?, ?, ?, ?)
    `, [contractId, nextVersion, custom_content, 'Contract amended', req.user!.id]);

    // Get updated contract
    const updatedContract = await db.get(`
      SELECT ac.*, ct.name as template_name, a.name as artist_name
      FROM artist_contracts ac
      JOIN contract_templates ct ON ac.template_id = ct.id
      JOIN artists a ON ac.artist_id = a.id
      WHERE ac.id = ? AND ac.artist_id = ?
    `, [contractId, artistId]);

    res.json(updatedContract);
  } catch (error) {
    console.error('Amend contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to process contract content with dynamic data
function processContractContent(contract: any): string {
  let content = contract.custom_content || contract.template_content;
  
  // Replace placeholders with actual data
  content = content.replace(/\{\{festival_name\}\}/g, contract.festival_name || '');
  content = content.replace(/\{\{artist_name\}\}/g, contract.artist_name || '');
  content = content.replace(/\{\{artist_contact\}\}/g, contract.contact_name || '');
  content = content.replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString());
  content = content.replace(/\{\{artist_fee\}\}/g, contract.fee ? `£${contract.fee}` : 'To be agreed');
  content = content.replace(/\{\{technical_requirements\}\}/g, contract.technical_requirements || 'Standard festival provision');
  content = content.replace(/\{\{rider_requirements\}\}/g, contract.rider_requirements || 'Standard festival provision');
  
  // Performance details
  if (contract.performance_date && contract.start_time) {
    const perfDate = new Date(contract.performance_date).toLocaleDateString();
    const perfTime = contract.start_time;
    content = content.replace(/\{\{performance_date\}\}/g, perfDate);
    content = content.replace(/\{\{performance_time\}\}/g, perfTime);
    content = content.replace(/\{\{performance_venue\}\}/g, contract.stage_name || 'To be confirmed');
  } else {
    content = content.replace(/\{\{performance_date\}\}/g, 'To be confirmed');
    content = content.replace(/\{\{performance_time\}\}/g, 'To be confirmed');
    content = content.replace(/\{\{performance_venue\}\}/g, 'To be confirmed');
  }
  
  return content;
}

export default router;