import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  People,
  Event,
  AttachMoney,
  Schedule,
  Place,
  Business,
  VolunteerActivism,
  GetApp,
  Refresh,
  DateRange,
  PieChart,
  BarChart,
  Timeline,
  Google,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useFestival } from '../contexts/FestivalContext';
import GoogleSheetsSettings from '../components/GoogleSheetsSettings';
import googleSheetsService from '../services/googleSheetsService';
import axios from 'axios';

interface ReportData {
  overview: {
    total_festivals: number;
    active_festivals: number;
    total_artists: number;
    total_performances: number;
    total_venues: number;
    total_volunteers: number;
    total_vendors: number;
    total_budget: number;
    total_income: number;
    total_expenses: number;
  };
  festival_breakdown: Array<{
    festival_id: number;
    festival_name: string;
    year: number;
    status: string;
    artists: number;
    performances: number;
    venues: number;
    volunteers: number;
    vendors: number;
    budget_total: number;
    income: number;
    expenses: number;
    net_profit: number;
  }>;
  performance_stats: {
    by_month: Array<{ month: string; count: number; revenue: number }>;
    by_venue: Array<{ venue_name: string; count: number; venue_type: string }>;
    by_genre: Array<{ genre: string; count: number; percentage: number }>;
  };
  financial_summary: {
    income_categories: Array<{ category: string; amount: number; percentage: number }>;
    expense_categories: Array<{ category: string; amount: number; percentage: number }>;
    monthly_trend: Array<{ month: string; income: number; expenses: number; profit: number }>;
  };
  user_activity: {
    total_users: number;
    active_users: number;
    recent_signups: number;
    role_distribution: Array<{ role: string; count: number; percentage: number }>;
  };
}

const Reports: React.FC = () => {
  const { currentFestival, festivals } = useFestival();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFestival, setSelectedFestival] = useState<number | 'all'>('all');
  const [dateRange, setDateRange] = useState<'30' | '90' | '365' | 'all'>('365');
  const [googleSheetsOpen, setGoogleSheetsOpen] = useState(false);

  useEffect(() => {
    loadReportData();
  }, [selectedFestival, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Mock data for now - in real implementation, this would come from API
      const mockData: ReportData = {
        overview: {
          total_festivals: festivals.length,
          active_festivals: festivals.filter(f => f.status === 'active').length,
          total_artists: 45,
          total_performances: 128,
          total_venues: 12,
          total_volunteers: 89,
          total_vendors: 23,
          total_budget: 125000,
          total_income: 95000,
          total_expenses: 78000,
        },
        festival_breakdown: festivals.map(festival => ({
          festival_id: festival.id,
          festival_name: festival.name,
          year: festival.year,
          status: festival.status,
          artists: Math.floor(Math.random() * 30) + 10,
          performances: Math.floor(Math.random() * 50) + 20,
          venues: Math.floor(Math.random() * 8) + 3,
          volunteers: Math.floor(Math.random() * 40) + 20,
          vendors: Math.floor(Math.random() * 15) + 5,
          budget_total: festival.budget_total,
          income: Math.floor(festival.budget_total * 0.8),
          expenses: Math.floor(festival.budget_total * 0.65),
          net_profit: Math.floor(festival.budget_total * 0.15),
        })),
        performance_stats: {
          by_month: [
            { month: 'Jan', count: 15, revenue: 12000 },
            { month: 'Feb', count: 8, revenue: 8500 },
            { month: 'Mar', count: 22, revenue: 18000 },
            { month: 'Apr', count: 18, revenue: 15000 },
            { month: 'May', count: 25, revenue: 22000 },
            { month: 'Jun', count: 30, revenue: 28000 },
            { month: 'Jul', count: 35, revenue: 32000 },
            { month: 'Aug', count: 28, revenue: 25000 },
          ],
          by_venue: [
            { venue_name: 'Main Stage', count: 45, venue_type: 'stage' },
            { venue_name: 'Acoustic Tent', count: 32, venue_type: 'tent' },
            { venue_name: 'Dance Arena', count: 28, venue_type: 'arena' },
            { venue_name: 'Folk Corner', count: 23, venue_type: 'area' },
          ],
          by_genre: [
            { genre: 'Folk', count: 45, percentage: 35 },
            { genre: 'Acoustic', count: 32, percentage: 25 },
            { genre: 'Traditional', count: 28, percentage: 22 },
            { genre: 'Contemporary', count: 23, percentage: 18 },
          ],
        },
        financial_summary: {
          income_categories: [
            { category: 'Ticket Sales', amount: 45000, percentage: 47 },
            { category: 'Sponsorship', amount: 25000, percentage: 26 },
            { category: 'Vendor Fees', amount: 15000, percentage: 16 },
            { category: 'Merchandise', amount: 10000, percentage: 11 },
          ],
          expense_categories: [
            { category: 'Artist Fees', amount: 28000, percentage: 36 },
            { category: 'Venue Costs', amount: 15000, percentage: 19 },
            { category: 'Security', amount: 12000, percentage: 15 },
            { category: 'Marketing', amount: 10000, percentage: 13 },
            { category: 'Equipment', amount: 8000, percentage: 10 },
            { category: 'Other', amount: 5000, percentage: 7 },
          ],
          monthly_trend: [
            { month: 'Jan', income: 8000, expenses: 6000, profit: 2000 },
            { month: 'Feb', income: 5000, expenses: 4500, profit: 500 },
            { month: 'Mar', income: 12000, expenses: 9000, profit: 3000 },
            { month: 'Apr', income: 15000, expenses: 11000, profit: 4000 },
            { month: 'May', income: 18000, expenses: 14000, profit: 4000 },
            { month: 'Jun', income: 22000, expenses: 16000, profit: 6000 },
            { month: 'Jul', income: 25000, expenses: 18000, profit: 7000 },
            { month: 'Aug', income: 20000, expenses: 15000, profit: 5000 },
          ],
        },
        user_activity: {
          total_users: 125,
          active_users: 89,
          recent_signups: 12,
          role_distribution: [
            { role: 'Admin', count: 3, percentage: 2 },
            { role: 'Coordinator', count: 15, percentage: 12 },
            { role: 'Viewer', count: 67, percentage: 54 },
            { role: 'Volunteer', count: 40, percentage: 32 },
          ],
        },
      };

      setReportData(mockData);
      setError('');
    } catch (error: any) {
      setError('Failed to load report data');
      console.error('Report data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const exportReport = async () => {
    try {
      if (googleSheetsService.isConfigured() && googleSheetsService.isAuthenticated()) {
        // Export to Google Sheets
        const success = await googleSheetsService.exportAllData();
        if (success) {
          setError('');
          alert('Data exported to Google Sheets successfully!');
        } else {
          setError('Failed to export to Google Sheets');
        }
      } else {
        // Fallback export functionality
        alert('Please configure Google Sheets integration first. Click the settings button to set up.');
      }
    } catch (error) {
      setError('Failed to export report');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading report data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Reports & Analytics</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Festival</InputLabel>
            <Select
              value={selectedFestival}
              onChange={(e) => setSelectedFestival(e.target.value as number | 'all')}
              label="Festival"
            >
              <MenuItem value="all">All Festivals</MenuItem>
              {festivals.map((festival) => (
                <MenuItem key={festival.id} value={festival.id}>
                  {festival.name} {festival.year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              label="Period"
            >
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 90 days</MenuItem>
              <MenuItem value="365">Last year</MenuItem>
              <MenuItem value="all">All time</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadReportData} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Google Sheets Settings">
            <IconButton onClick={() => setGoogleSheetsOpen(true)} color="primary">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={googleSheetsService.isConfigured() ? <Google /> : <GetApp />}
            onClick={exportReport}
          >
            {googleSheetsService.isConfigured() ? 'Export to Sheets' : 'Export'}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {reportData && (
        <>
          {/* Overview Statistics */}
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            📊 Overview Statistics
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
            <Box>
              <Card>
                <CardContent sx={{ textAlign: 'center', height: 140, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', py: 2 }}>
                  <Event sx={{ fontSize: 40, color: '#1976d2', mx: 'auto' }} />
                  <Box>
                    <Typography variant="h4">{reportData.overview.total_festivals}</Typography>
                    <Typography variant="body2" color="textSecondary">Total Festivals</Typography>
                  </Box>
                  <Typography variant="caption" color="success.main">
                    {reportData.overview.active_festivals} active
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box>
              <Card>
                <CardContent sx={{ textAlign: 'center', height: 140, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', py: 2 }}>
                  <Schedule sx={{ fontSize: 40, color: '#2e7d32', mx: 'auto' }} />
                  <Box>
                    <Typography variant="h4">{reportData.overview.total_performances}</Typography>
                    <Typography variant="body2" color="textSecondary">Total Performances</Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {reportData.overview.total_artists} artists
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box>
              <Card>
                <CardContent sx={{ textAlign: 'center', height: 140, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', py: 2 }}>
                  <People sx={{ fontSize: 40, color: '#ed6c02', mx: 'auto' }} />
                  <Box>
                    <Typography variant="h4">{reportData.overview.total_volunteers}</Typography>
                    <Typography variant="body2" color="textSecondary">Total Volunteers</Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {reportData.overview.total_vendors} vendors
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box>
              <Card>
                <CardContent sx={{ textAlign: 'center', height: 140, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', py: 2 }}>
                  <AttachMoney sx={{ fontSize: 40, color: '#9c27b0', mx: 'auto' }} />
                  <Box>
                    <Typography variant="h4" color={reportData.overview.total_income - reportData.overview.total_expenses >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(reportData.overview.total_income - reportData.overview.total_expenses)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">Net Profit</Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {formatCurrency(reportData.overview.total_budget)} budget
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Financial Summary */}
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            💰 Financial Summary
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Income by Category</Typography>
                  {reportData.financial_summary.income_categories.map((category, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{category.category}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(category.amount)} ({formatPercentage(category.percentage)})
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        height: 6, 
                        backgroundColor: '#e0e0e0', 
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          height: '100%', 
                          width: `${category.percentage}%`,
                          backgroundColor: '#2e7d32',
                          transition: 'width 0.3s ease'
                        }} />
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Box>
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Expenses by Category</Typography>
                  {reportData.financial_summary.expense_categories.map((category, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{category.category}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(category.amount)} ({formatPercentage(category.percentage)})
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        height: 6, 
                        backgroundColor: '#e0e0e0', 
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          height: '100%', 
                          width: `${category.percentage}%`,
                          backgroundColor: '#d32f2f',
                          transition: 'width 0.3s ease'
                        }} />
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Performance Analytics */}
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            🎪 Performance Analytics
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Performances by Venue</Typography>
                  {reportData.performance_stats.by_venue.map((venue, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Place fontSize="small" color="action" />
                        <Typography variant="body2">{venue.venue_name}</Typography>
                        <Chip label={venue.venue_type} size="small" variant="outlined" />
                      </Box>
                      <Typography variant="body2" fontWeight="bold">{venue.count}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Box>
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Performances by Genre</Typography>
                  {reportData.performance_stats.by_genre.map((genre, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{genre.genre}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {genre.count} ({formatPercentage(genre.percentage)})
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        height: 6, 
                        backgroundColor: '#e0e0e0', 
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          height: '100%', 
                          width: `${genre.percentage}%`,
                          backgroundColor: '#1976d2',
                          transition: 'width 0.3s ease'
                        }} />
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Festival Breakdown Table */}
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            🎯 Festival Performance Breakdown
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Festival</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Artists</TableCell>
                  <TableCell align="right">Performances</TableCell>
                  <TableCell align="right">Volunteers</TableCell>
                  <TableCell align="right">Budget</TableCell>
                  <TableCell align="right">Net Profit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.festival_breakdown.map((festival) => (
                  <TableRow key={festival.festival_id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {festival.festival_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {festival.year}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={festival.status} 
                        size="small" 
                        color={
                          festival.status === 'active' ? 'success' :
                          festival.status === 'planning' ? 'primary' :
                          festival.status === 'completed' ? 'default' : 'error'
                        }
                      />
                    </TableCell>
                    <TableCell align="right">{festival.artists}</TableCell>
                    <TableCell align="right">{festival.performances}</TableCell>
                    <TableCell align="right">{festival.volunteers}</TableCell>
                    <TableCell align="right">{formatCurrency(festival.budget_total)}</TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        color={festival.net_profit >= 0 ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {formatCurrency(festival.net_profit)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* User Activity */}
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            👥 User Activity
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>User Role Distribution</Typography>
                  {reportData.user_activity.role_distribution.map((role, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{role.role}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {role.count} ({formatPercentage(role.percentage)})
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        height: 6, 
                        backgroundColor: '#e0e0e0', 
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          height: '100%', 
                          width: `${role.percentage}%`,
                          backgroundColor: '#ed6c02',
                          transition: 'width 0.3s ease'
                        }} />
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Box>
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>User Summary</Typography>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography variant="h3" color="primary">
                      {reportData.user_activity.total_users}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">Total Users</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Active Users:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {reportData.user_activity.active_users}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Recent Signups:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {reportData.user_activity.recent_signups}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </>
      )}

      {/* Google Sheets Settings Dialog */}
      <GoogleSheetsSettings 
        open={googleSheetsOpen} 
        onClose={() => setGoogleSheetsOpen(false)} 
      />
    </Box>
  );
};

export default Reports;