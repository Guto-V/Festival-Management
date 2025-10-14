import express from 'express';
import { getUniversalDatabase } from '../utils/database-universal';
import { authenticateToken, requireMinimumRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get all budget items
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { festival_id } = req.query;
    const db = getUniversalDatabase();
    
    let query = `
      SELECT id, festival_id, name, category, type, amount, planned_amount, 
             payment_status, due_date, paid_date, description, created_at, updated_at
      FROM budget_items `;
    let params: any[] = [];
    
    if (festival_id) {
      query += 'WHERE festival_id = ? ';
      params.push(festival_id);
    }
    
    query += 'ORDER BY created_at DESC';
    
    const rows = await db.all(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get budget items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new budget item
router.post('/', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      festival_id, name, category, type, amount, planned_amount,
      payment_status = 'pending', due_date, description
    } = req.body;

    if (!festival_id || !name || !category || !type || amount === undefined) {
      return res.status(400).json({ error: 'Festival ID, name, category, type, and amount are required' });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either "income" or "expense"' });
    }

    const db = getUniversalDatabase();
    
    const result = await db.run(`
      INSERT INTO budget_items (
        festival_id, name, category, type, amount, planned_amount, 
        payment_status, due_date, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [festival_id, name, category, type, amount, planned_amount, payment_status, due_date, description]);

    const budgetItemId = result.lastID;

    // Get the created budget item
    const newBudgetItem = await db.get(`
      SELECT id, festival_id, name, category, type, amount, planned_amount, 
             payment_status, due_date, paid_date, description, created_at, updated_at
      FROM budget_items 
      WHERE id = ?
    `, [budgetItemId]);

    res.status(201).json(newBudgetItem);
  } catch (error) {
    console.error('Create budget item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get budget summary for a festival
router.get('/summary/:festival_id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { festival_id } = req.params;
    const db = getUniversalDatabase();

    const summary = await db.get(`
      SELECT 
        (SELECT SUM(amount) FROM budget_items WHERE festival_id = ? AND type = 'income') as total_income,
        (SELECT SUM(amount) FROM budget_items WHERE festival_id = ? AND type = 'expense') as total_expenses,
        (SELECT SUM(amount) FROM budget_items WHERE festival_id = ? AND type = 'income' AND payment_status = 'paid') as paid_income,
        (SELECT SUM(amount) FROM budget_items WHERE festival_id = ? AND type = 'expense' AND payment_status = 'paid') as paid_expenses
    `, [festival_id, festival_id, festival_id, festival_id]);

    const result = {
      festival_id: parseInt(festival_id),
      total_income: summary.total_income || 0,
      total_expenses: summary.total_expenses || 0,
      paid_income: summary.paid_income || 0,
      paid_expenses: summary.paid_expenses || 0,
      net_budget: (summary.total_income || 0) - (summary.total_expenses || 0),
      outstanding_income: (summary.total_income || 0) - (summary.paid_income || 0),
      outstanding_expenses: (summary.total_expenses || 0) - (summary.paid_expenses || 0)
    };

    res.json(result);
  } catch (error) {
    console.error('Get budget summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single budget item
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getUniversalDatabase();
    
    const budgetItem = await db.get(`
      SELECT id, festival_id, name, category, type, amount, planned_amount, 
             payment_status, due_date, paid_date, description, created_at, updated_at
      FROM budget_items 
      WHERE id = ?
    `, [id]);

    if (!budgetItem) {
      return res.status(404).json({ error: 'Budget item not found' });
    }

    res.json(budgetItem);
  } catch (error) {
    console.error('Get budget item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update budget item
router.put('/:id', authenticateToken, requireMinimumRole('coordinator'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      name, category, type, amount, planned_amount,
      payment_status, due_date, paid_date, description
    } = req.body;

    const db = getUniversalDatabase();
    
    // Check if budget item exists
    const existingItem = await db.get('SELECT id FROM budget_items WHERE id = ?', [id]);
    if (!existingItem) {
      return res.status(404).json({ error: 'Budget item not found' });
    }

    // Validate type if provided
    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either "income" or "expense"' });
    }

    await db.run(`
      UPDATE budget_items SET 
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        type = COALESCE(?, type),
        amount = COALESCE(?, amount),
        planned_amount = COALESCE(?, planned_amount),
        payment_status = COALESCE(?, payment_status),
        due_date = COALESCE(?, due_date),
        paid_date = COALESCE(?, paid_date),
        description = COALESCE(?, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, category, type, amount, planned_amount, payment_status, due_date, paid_date, description, id]);

    // Get updated budget item
    const updatedItem = await db.get(`
      SELECT id, festival_id, name, category, type, amount, planned_amount, 
             payment_status, due_date, paid_date, description, created_at, updated_at
      FROM budget_items 
      WHERE id = ?
    `, [id]);

    res.json(updatedItem);
  } catch (error) {
    console.error('Update budget item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete budget item
router.delete('/:id', authenticateToken, requireMinimumRole('manager'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getUniversalDatabase();

    const result = await db.run('DELETE FROM budget_items WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Budget item not found' });
    }

    res.json({ message: 'Budget item deleted successfully' });
  } catch (error) {
    console.error('Delete budget item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dynamic budget categories for a festival
router.get('/categories/:festival_id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { festival_id } = req.params;
    const db = getUniversalDatabase();

    // Get artists with fees
    const artists = await db.all(`
      SELECT id, name, fee, fee_status
      FROM artists 
      WHERE festival_id = ? AND fee IS NOT NULL
    `, [festival_id]);

    // Get vendors with costs (if any)
    const vendors = await db.all(`
      SELECT id, name, rates, status
      FROM vendors 
      WHERE festival_id = ? AND rates IS NOT NULL
    `, [festival_id]);

    // Get manual budget items grouped by category
    const budgetItems = await db.all(`
      SELECT category, type, SUM(amount) as total_amount, 
             COUNT(*) as item_count,
             SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END) as paid_amount,
             SUM(CASE WHEN payment_status IN ('pending', 'overdue') THEN amount ELSE 0 END) as outstanding_amount
      FROM budget_items 
      WHERE festival_id = ?
      GROUP BY category, type
      ORDER BY category, type
    `, [festival_id]);

    // Process artists data
    const artistsTotal = artists.reduce((sum, artist) => sum + (artist.fee || 0), 0);
    const artistsPaid = artists
      .filter(artist => artist.fee_status === 'paid')
      .reduce((sum, artist) => sum + (artist.fee || 0), 0);
    const artistsOutstanding = artistsTotal - artistsPaid;
    const artistsAgreed = artists
      .filter(artist => ['agreed', 'invoiced', 'paid'].includes(artist.fee_status))
      .reduce((sum, artist) => sum + (artist.fee || 0), 0);

    // Build category structure
    const categories: { [key: string]: any } = {
      artists: {
        name: 'Artists & Performers',
        type: 'expense',
        total_budget: artistsTotal,
        agreed_amount: artistsAgreed,
        paid_amount: artistsPaid,
        outstanding_amount: artistsOutstanding,
        items: artists.map(artist => ({
          id: artist.id,
          name: artist.name,
          amount: artist.fee,
          status: artist.fee_status,
          type: 'artist_fee'
        }))
      },
      vendors: {
        name: 'Vendors & Services',
        type: 'expense', 
        total_budget: 0, // We'll calculate this if vendors have rates
        agreed_amount: 0,
        paid_amount: 0,
        outstanding_amount: 0,
        items: vendors.map(vendor => ({
          id: vendor.id,
          name: vendor.name,
          amount: 0, // Parse rates if needed
          status: vendor.status,
          type: 'vendor_cost'
        }))
      }
    };

    // Add manual budget categories
    budgetItems.forEach(item => {
      const categoryKey = item.category.toLowerCase().replace(/\s+/g, '_');
      if (!categories[categoryKey]) {
        categories[categoryKey] = {
          name: item.category,
          type: item.type,
          total_budget: 0,
          agreed_amount: 0,
          paid_amount: 0,
          outstanding_amount: 0,
          items: []
        };
      }
      
      categories[categoryKey].total_budget += item.total_amount;
      categories[categoryKey].paid_amount += item.paid_amount;
      categories[categoryKey].outstanding_amount += item.outstanding_amount;
    });

    // Calculate totals
    const totalIncome = Object.values(categories)
      .filter((cat: any) => cat.type === 'income')
      .reduce((sum: number, cat: any) => sum + cat.total_budget, 0);
    
    const totalExpenses = Object.values(categories)
      .filter((cat: any) => cat.type === 'expense')
      .reduce((sum: number, cat: any) => sum + cat.total_budget, 0);

    const summary = {
      festival_id: parseInt(festival_id),
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_budget: totalIncome - totalExpenses,
      categories: categories
    };

    res.json(summary);
  } catch (error) {
    console.error('Get budget categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;