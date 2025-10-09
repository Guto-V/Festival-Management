const express = require('express');
const app = express();
const PORT = 3005;

app.get('/test', (req, res) => {
  res.json({ message: 'Server working on specific bind!' });
});

// Try binding to specific interfaces
console.log('Attempting to bind to 127.0.0.1...');

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on 127.0.0.1:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  
  // Try binding to all interfaces if 127.0.0.1 fails
  console.log('Trying to bind to 0.0.0.0...');
  const server2 = app.listen(PORT + 1, '0.0.0.0', () => {
    console.log(`Server running on 0.0.0.0:${PORT + 1}`);
  });
  
  server2.on('error', (err2) => {
    console.error('Server error on 0.0.0.0:', err2);
  });
});