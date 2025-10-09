const express = require('express');
const app = express();
const PORT = 3003;

app.get('/test', (req, res) => {
  res.json({ message: 'Simple server working!' });
});

app.listen(PORT, () => {
  console.log(`Simple test server running on port ${PORT}`);
});