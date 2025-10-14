import express from 'express';
import { getUniversalDatabase } from '../utils/database-universal';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

interface TodoItem {
  id: string;
  type: 'payment_overdue' | 'payment_due' | 'artist_contract' | 'vendor_contract' | 'document_expiry';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  due_date?: string;
  related_id?: number;
  related_type?: string;
}

// Get all todo items for a festival
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { festival_id = 1 } = req.query;
    const db = getUniversalDatabase();
    const todos: TodoItem[] = [];

    // 1. Overdue payments
    const overduePayments = await db.all(`
      SELECT id, name, amount, due_date, payment_status
      FROM budget_items 
      WHERE festival_id = ? 
        AND payment_status = 'pending' 
        AND due_date IS NOT NULL 
        AND due_date < date('now')
      ORDER BY due_date ASC
    `, [festival_id]);

    overduePayments.forEach((payment: any) => {
      todos.push({
        id: `payment_overdue_${payment.id}`,
        type: 'payment_overdue',
        title: `Overdue Payment: ${payment.name}`,
        description: `Payment of £${payment.amount} was due on ${new Date(payment.due_date).toLocaleDateString()}`,
        priority: 'high',
        due_date: payment.due_date,
        related_id: payment.id,
        related_type: 'budget_item'
      });
    });

    // 2. Upcoming payments (due in next 7 days)
    const upcomingPayments = await db.all(`
      SELECT id, name, amount, due_date, payment_status
      FROM budget_items 
      WHERE festival_id = ? 
        AND payment_status = 'pending' 
        AND due_date IS NOT NULL 
        AND due_date >= date('now')
        AND due_date <= date('now', '+7 days')
      ORDER BY due_date ASC
    `, [festival_id]);

    upcomingPayments.forEach((payment: any) => {
      todos.push({
        id: `payment_due_${payment.id}`,
        type: 'payment_due',
        title: `Payment Due: ${payment.name}`,
        description: `Payment of £${payment.amount} is due on ${new Date(payment.due_date).toLocaleDateString()}`,
        priority: 'medium',
        due_date: payment.due_date,
        related_id: payment.id,
        related_type: 'budget_item'
      });
    });

    // 3. Artists without contracts
    const artistsNeedingContracts = await db.all(`
      SELECT id, name, contact_name
      FROM artists 
      WHERE festival_id = ? 
        AND status = 'inquired'
      ORDER BY name ASC
    `, [festival_id]);

    artistsNeedingContracts.forEach((artist: any) => {
      todos.push({
        id: `artist_contract_${artist.id}`,
        type: 'artist_contract',
        title: `Contract Needed: ${artist.name}`,
        description: `Artist ${artist.name} needs contract finalization`,
        priority: 'high',
        related_id: artist.id,
        related_type: 'artist'
      });
    });

    // 4. Vendors without contracts
    const vendorsNeedingContracts = await db.all(`
      SELECT id, name, contact_name
      FROM vendors 
      WHERE festival_id = ? 
        AND status = 'inquiry'
      ORDER BY name ASC
    `, [festival_id]);

    vendorsNeedingContracts.forEach((vendor: any) => {
      todos.push({
        id: `vendor_contract_${vendor.id}`,
        type: 'vendor_contract',
        title: `Contract Needed: ${vendor.name}`,
        description: `Vendor ${vendor.name} needs contract approval`,
        priority: 'medium',
        related_id: vendor.id,
        related_type: 'vendor'
      });
    });

    // 5. Expiring documents (expiry in next 30 days)
    const expiringDocuments = await db.all(`
      SELECT id, name, expiry_date, type
      FROM documents 
      WHERE festival_id = ? 
        AND expiry_date IS NOT NULL 
        AND expiry_date <= date('now', '+30 days')
        AND status != 'expired'
      ORDER BY expiry_date ASC
    `, [festival_id]);

    expiringDocuments.forEach((doc: any) => {
      const daysUntilExpiry = Math.ceil((new Date(doc.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const priority = daysUntilExpiry <= 7 ? 'high' : daysUntilExpiry <= 14 ? 'medium' : 'low';
      
      todos.push({
        id: `document_expiry_${doc.id}`,
        type: 'document_expiry',
        title: `Document Expiring: ${doc.name}`,
        description: `${doc.type} expires on ${new Date(doc.expiry_date).toLocaleDateString()} (${daysUntilExpiry} days)`,
        priority,
        due_date: doc.expiry_date,
        related_id: doc.id,
        related_type: 'document'
      });
    });

    // Sort by priority and due date
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    todos.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      
      return a.title.localeCompare(b.title);
    });

    res.json({
      festival_id: parseInt(festival_id as string),
      total_todos: todos.length,
      high_priority: todos.filter(t => t.priority === 'high').length,
      medium_priority: todos.filter(t => t.priority === 'medium').length,
      low_priority: todos.filter(t => t.priority === 'low').length,
      todos: todos.slice(0, 20) // Limit to top 20 items
    });

  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;