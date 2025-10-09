const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    const dbPath = path.join(__dirname, 'festival.db');
    console.log('Database path:', dbPath);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
    });
    
    console.log('✅ Database opened successfully');
    
    // Test a simple query
    const result = await db.get('SELECT COUNT(*) as count FROM users');
    console.log('User count:', result.count);
    
    await db.close();
    console.log('✅ Database closed successfully');
  } catch (error) {
    console.error('❌ Database error:', error);
  }
}

testDatabase();