import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Add,
  ExpandMore,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  PendingActions,
  CheckCircle,
  Warning,
  Edit,
  Delete,
} from '@mui/icons-material';
import axios from 'axios';
import { useFestival } from '../contexts/FestivalContext';

interface BudgetItem {
  id: number;
  festival_id: number;
  name: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  planned_amount?: number;
  payment_status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date?: string;
  paid_date?: string;
  description?: string;
}

interface BudgetCategory {
  name: string;
  type: 'income' | 'expense';
  total_budget: number;
  agreed_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  items: Array<{
    id: number;
    name: string;
    amount: number;
    status: string;
    type: string;
  }>;
}

interface BudgetSummary {
  festival_id: number;
  total_income: number;
  total_expenses: number;
  net_budget: number;
  categories: { [key: string]: BudgetCategory };
}

const Budget: React.FC = () => {
  const { currentFestival } = useFestival();
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    type: 'expense' as 'income' | 'expense',
    amount: '',
    planned_amount: '',
    payment_status: 'pending' as 'pending' | 'paid' | 'overdue' | 'cancelled',
    due_date: '',
    description: '',
  });

  useEffect(() => {
    if (currentFestival) {
      fetchBudgetData();
      fetchBudgetItems();
    }
  }, [currentFestival]);

  const fetchBudgetData = async () => {
    if (!currentFestival) return;
    
    try {
      const response = await axios.get(`/api/budget/categories/${currentFestival.id}`);
      setBudgetSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch budget data:', error);
      setError('Failed to fetch budget data');
    }
  };

  const fetchBudgetItems = async () => {
    if (!currentFestival) return;
    
    try {
      const response = await axios.get(`/api/budget?festival_id=${currentFestival.id}`);
      setBudgetItems(response.data);
    } catch (error) {
      console.error('Failed to fetch budget items:', error);
    }
  };

  const handleOpen = (item?: BudgetItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        type: item.type,
        amount: item.amount.toString(),
        planned_amount: item.planned_amount?.toString() || '',
        payment_status: item.payment_status,
        due_date: item.due_date || '',
        description: item.description || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: '',
        type: 'expense',
        amount: '',
        planned_amount: '',
        payment_status: 'pending',
        due_date: '',
        description: '',
      });
    }
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditingItem(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.category.trim() || !formData.amount) {
      setError('Name, category, and amount are required');
      return;
    }

    if (!currentFestival) {
      setError('No festival selected');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        festival_id: currentFestival.id,
        amount: parseFloat(formData.amount),
        planned_amount: formData.planned_amount ? parseFloat(formData.planned_amount) : null,
      };

      if (editingItem) {
        await axios.put(`/api/budget/${editingItem.id}`, data);
      } else {
        await axios.post('/api/budget', data);
      }

      fetchBudgetData();
      fetchBudgetItems();
      handleClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save budget item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this budget item?')) {
      try {
        await axios.delete(`/api/budget/${id}`);
        fetchBudgetData();
        fetchBudgetItems();
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to delete budget item');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'agreed': return 'info';
      case 'invoiced': return 'warning';
      case 'overdue': return 'error';
      case 'pending': default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString()}`;
  };

  const calculateProgress = (paid: number, total: number) => {
    return total > 0 ? (paid / total) * 100 : 0;
  };

  if (!currentFestival) {
    return (
      <Alert severity="info">
        Please select a festival to manage its budget.
      </Alert>
    );
  }

  if (!budgetSummary) {
    return <Box>Loading budget data...</Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Budget Management
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Add Budget Item
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Budget Overview Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
        gap: 3,
        mb: 4 
      }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
              <Typography variant="h6" color="success.main">
                Total Income
              </Typography>
            </Box>
            <Typography variant="h4">
              {formatCurrency(budgetSummary.total_income)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingDown sx={{ color: 'error.main', mr: 1 }} />
              <Typography variant="h6" color="error.main">
                Total Expenses
              </Typography>
            </Box>
            <Typography variant="h4">
              {formatCurrency(budgetSummary.total_expenses)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AttachMoney sx={{ color: budgetSummary.net_budget >= 0 ? 'success.main' : 'error.main', mr: 1 }} />
              <Typography variant="h6" color={budgetSummary.net_budget >= 0 ? 'success.main' : 'error.main'}>
                Net Budget
              </Typography>
            </Box>
            <Typography variant="h4" color={budgetSummary.net_budget >= 0 ? 'success.main' : 'error.main'}>
              {formatCurrency(budgetSummary.net_budget)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PendingActions sx={{ color: 'warning.main', mr: 1 }} />
              <Typography variant="h6" color="warning.main">
                Payment Progress
              </Typography>
            </Box>
            <Typography variant="h5">
              {budgetSummary.total_expenses > 0 
                ? Math.round((Object.values(budgetSummary.categories).reduce((sum, cat) => sum + cat.paid_amount, 0) / budgetSummary.total_expenses) * 100)
                : 0}%
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Budget Categories */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Budget Categories
      </Typography>

      {Object.entries(budgetSummary.categories).map(([key, category]) => (
        <Accordion key={key} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mr: 2 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {category.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2">
                  {formatCurrency(category.paid_amount)} / {formatCurrency(category.total_budget)}
                </Typography>
                <Box sx={{ width: 100 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={calculateProgress(category.paid_amount, category.total_budget)}
                    color={category.type === 'income' ? 'success' : 'primary'}
                  />
                </Box>
                <Chip 
                  label={category.type} 
                  color={category.type === 'income' ? 'success' : 'default'} 
                  size="small" 
                />
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                <Typography variant="body2">
                  <strong>Agreed:</strong> {formatCurrency(category.agreed_amount)}
                </Typography>
                <Typography variant="body2">
                  <strong>Paid:</strong> {formatCurrency(category.paid_amount)}
                </Typography>
                <Typography variant="body2">
                  <strong>Outstanding:</strong> {formatCurrency(category.outstanding_amount)}
                </Typography>
              </Box>
              
              {category.items.length > 0 && (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Type</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {category.items.map((item) => (
                        <TableRow key={`${item.type}-${item.id}`}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{formatCurrency(item.amount)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={item.status} 
                              color={getStatusColor(item.status) as any} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={item.type === 'artist_fee' ? 'Artist Fee' : 'Vendor Cost'} 
                              variant="outlined" 
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Manual Budget Items */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Manual Budget Items
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {budgetItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Typography variant="subtitle2">{item.name}</Typography>
                  {item.description && (
                    <Typography variant="caption" color="textSecondary">
                      {item.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  <Chip 
                    label={item.type} 
                    color={item.type === 'income' ? 'success' : 'default'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>{formatCurrency(item.amount)}</TableCell>
                <TableCell>
                  <Chip 
                    label={item.payment_status} 
                    color={getStatusColor(item.payment_status) as any} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  {item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(item)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(item.id)} color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {budgetItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No manual budget items found. Click "Add Budget Item" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Budget Item' : 'Add Budget Item'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
              <FormControl>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  label="Type"
                >
                  <MenuItem value="income">Income</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Amount (£)"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
              <TextField
                label="Planned Amount (£)"
                type="number"
                value={formData.planned_amount}
                onChange={(e) => setFormData({ ...formData, planned_amount: e.target.value })}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={formData.payment_status}
                  onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as any })}
                  label="Payment Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Due Date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : editingItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Budget;