import axios from 'axios';

interface GoogleSheetsConfig {
  spreadsheetId: string;
  apiKey: string;
  clientId: string;
  clientSecret: string;
}

interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  sheetName: string;
}

interface SyncSettings {
  autoSync: boolean;
  syncInterval: number; // minutes
  lastSync: Date | null;
  spreadsheetUrl: string;
}

class GoogleSheetsService {
  private config: GoogleSheetsConfig | null = null;
  private accessToken: string | null = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    // In a real implementation, these would come from environment variables or user settings
    const savedConfig = localStorage.getItem('googleSheetsConfig');
    if (savedConfig) {
      this.config = JSON.parse(savedConfig);
    }
  }

  public saveConfig(config: GoogleSheetsConfig) {
    this.config = config;
    localStorage.setItem('googleSheetsConfig', JSON.stringify(config));
  }

  public async authenticate(): Promise<boolean> {
    try {
      if (!this.config) {
        throw new Error('Google Sheets configuration not set');
      }

      // Mock authentication for demo - in real implementation, this would use Google OAuth2
      // const authUrl = `https://accounts.google.com/oauth/authorize?client_id=${this.config.clientId}&redirect_uri=${window.location.origin}/auth/google&scope=https://www.googleapis.com/auth/spreadsheets&response_type=code`;
      // window.location.href = authUrl;

      // For demo purposes, simulate successful authentication
      this.accessToken = 'mock_access_token';
      return true;
    } catch (error) {
      console.error('Google Sheets authentication failed:', error);
      return false;
    }
  }

  public async createSpreadsheet(title: string): Promise<string | null> {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated with Google Sheets');
      }

      // Mock API call - in real implementation:
      // const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.accessToken}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     properties: { title }
      //   })
      // });

      // Mock response for demo
      const mockSpreadsheetId = `mock_spreadsheet_${Date.now()}`;
      
      if (this.config) {
        this.config.spreadsheetId = mockSpreadsheetId;
        this.saveConfig(this.config);
      }

      return mockSpreadsheetId;
    } catch (error) {
      console.error('Failed to create spreadsheet:', error);
      return null;
    }
  }

  public async exportToSheets(data: ExportData): Promise<boolean> {
    try {
      if (!this.accessToken || !this.config?.spreadsheetId) {
        throw new Error('Not authenticated or no spreadsheet configured');
      }

      // Mock export - in real implementation:
      // const range = `${data.sheetName}!A1:${this.getColumnLetter(data.headers.length)}${data.rows.length + 1}`;
      // const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${range}?valueInputOption=RAW`, {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${this.accessToken}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     values: [data.headers, ...data.rows]
      //   })
      // });

      console.log('Mock export to Google Sheets:', {
        spreadsheetId: this.config.spreadsheetId,
        sheetName: data.sheetName,
        headers: data.headers,
        rowCount: data.rows.length
      });

      return true;
    } catch (error) {
      console.error('Failed to export to Google Sheets:', error);
      return false;
    }
  }

  public async syncData(data: ExportData[]): Promise<boolean> {
    try {
      if (!this.accessToken || !this.config?.spreadsheetId) {
        throw new Error('Not authenticated or no spreadsheet configured');
      }

      // Mock sync for multiple sheets
      for (const sheetData of data) {
        await this.exportToSheets(sheetData);
        
        // Add a small delay to simulate real API calls
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update last sync time
      const syncSettings = this.getSyncSettings();
      syncSettings.lastSync = new Date();
      this.saveSyncSettings(syncSettings);

      return true;
    } catch (error) {
      console.error('Failed to sync data:', error);
      return false;
    }
  }

  public getSyncSettings(): SyncSettings {
    const saved = localStorage.getItem('googleSheetsSyncSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        lastSync: parsed.lastSync ? new Date(parsed.lastSync) : null
      };
    }
    
    return {
      autoSync: false,
      syncInterval: 60, // 1 hour default
      lastSync: null,
      spreadsheetUrl: ''
    };
  }

  public saveSyncSettings(settings: SyncSettings) {
    localStorage.setItem('googleSheetsSyncSettings', JSON.stringify(settings));
  }

  public getSpreadsheetUrl(): string {
    if (!this.config?.spreadsheetId) return '';
    return `https://docs.google.com/spreadsheets/d/${this.config.spreadsheetId}/edit`;
  }

  public isConfigured(): boolean {
    return this.config !== null && this.config.spreadsheetId !== '';
  }

  public isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  private getColumnLetter(columnNumber: number): string {
    let columnName = '';
    while (columnNumber > 0) {
      const modulo = (columnNumber - 1) % 26;
      columnName = String.fromCharCode(65 + modulo) + columnName;
      columnNumber = Math.floor((columnNumber - modulo) / 26);
    }
    return columnName;
  }

  // Export methods for different data types
  public async exportArtists(artists: any[]): Promise<boolean> {
    const data: ExportData = {
      headers: ['ID', 'Name', 'Genre', 'Status', 'Email', 'Phone', 'Fee', 'Created Date'],
      rows: artists.map(artist => [
        artist.id,
        artist.name,
        artist.genre || '',
        artist.status,
        artist.email || '',
        artist.phone || '',
        artist.fee || 0,
        new Date(artist.created_at).toLocaleDateString()
      ]),
      sheetName: 'Artists'
    };
    return this.exportToSheets(data);
  }

  public async exportSchedule(performances: any[]): Promise<boolean> {
    const data: ExportData = {
      headers: ['ID', 'Artist', 'Venue', 'Date', 'Start Time', 'Duration (min)', 'Status', 'Notes'],
      rows: performances.map(perf => [
        perf.id,
        perf.artist_name,
        perf.venue_name,
        perf.performance_date,
        perf.start_time,
        perf.duration_minutes,
        perf.status,
        perf.notes || ''
      ]),
      sheetName: 'Schedule'
    };
    return this.exportToSheets(data);
  }

  public async exportBudget(budgetItems: any[]): Promise<boolean> {
    const data: ExportData = {
      headers: ['ID', 'Name', 'Category', 'Type', 'Planned Amount', 'Actual Amount', 'Status', 'Due Date'],
      rows: budgetItems.map(item => [
        item.id,
        item.name,
        item.category,
        item.type,
        item.planned_amount || 0,
        item.amount,
        item.payment_status,
        item.due_date ? new Date(item.due_date).toLocaleDateString() : ''
      ]),
      sheetName: 'Budget'
    };
    return this.exportToSheets(data);
  }

  public async exportVolunteers(volunteers: any[]): Promise<boolean> {
    const data: ExportData = {
      headers: ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Skills', 'T-Shirt Size'],
      rows: volunteers.map(volunteer => [
        volunteer.id,
        `${volunteer.first_name} ${volunteer.last_name}`,
        volunteer.email,
        volunteer.phone || '',
        volunteer.assigned_role || '',
        volunteer.volunteer_status,
        volunteer.skills || '',
        volunteer.t_shirt_size || ''
      ]),
      sheetName: 'Volunteers'
    };
    return this.exportToSheets(data);
  }

  public async exportVendors(vendors: any[]): Promise<boolean> {
    const data: ExportData = {
      headers: ['ID', 'Name', 'Type', 'Contact', 'Email', 'Phone', 'Status', 'Services'],
      rows: vendors.map(vendor => [
        vendor.id,
        vendor.name,
        vendor.type,
        vendor.contact_name || '',
        vendor.contact_email || '',
        vendor.contact_phone || '',
        vendor.status,
        vendor.services_offered || ''
      ]),
      sheetName: 'Vendors'
    };
    return this.exportToSheets(data);
  }

  public async exportAllData(): Promise<boolean> {
    try {
      // In a real implementation, these would fetch from the actual API
      const [artists, schedule, budget, volunteers, vendors] = await Promise.all([
        axios.get('/api/artists').then(r => r.data).catch(() => []),
        axios.get('/api/schedule').then(r => r.data).catch(() => []),
        axios.get('/api/budget').then(r => r.data).catch(() => []),
        axios.get('/api/volunteers').then(r => r.data).catch(() => []),
        axios.get('/api/vendors').then(r => r.data).catch(() => [])
      ]);

      const allData: ExportData[] = [
        {
          headers: ['ID', 'Name', 'Genre', 'Status', 'Email', 'Phone', 'Fee'],
          rows: artists.map((a: any) => [a.id, a.name, a.genre || '', a.status, a.email || '', a.phone || '', a.fee || 0]),
          sheetName: 'Artists'
        },
        {
          headers: ['ID', 'Artist', 'Venue', 'Date', 'Start Time', 'Duration'],
          rows: schedule.map((s: any) => [s.id, s.artist_name, s.venue_name, s.performance_date, s.start_time, s.duration_minutes]),
          sheetName: 'Schedule'
        },
        {
          headers: ['ID', 'Name', 'Category', 'Type', 'Amount', 'Status'],
          rows: budget.map((b: any) => [b.id, b.name, b.category, b.type, b.amount, b.payment_status]),
          sheetName: 'Budget'
        },
        {
          headers: ['ID', 'Name', 'Email', 'Role', 'Status'],
          rows: volunteers.map((v: any) => [v.id, `${v.first_name} ${v.last_name}`, v.email, v.assigned_role || '', v.volunteer_status]),
          sheetName: 'Volunteers'
        },
        {
          headers: ['ID', 'Name', 'Type', 'Contact', 'Status'],
          rows: vendors.map((vd: any) => [vd.id, vd.name, vd.type, vd.contact_name || '', vd.status]),
          sheetName: 'Vendors'
        }
      ];

      return this.syncData(allData);
    } catch (error) {
      console.error('Failed to export all data:', error);
      return false;
    }
  }
}

export default new GoogleSheetsService();