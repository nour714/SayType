require('dotenv').config();
const express = require('express');
const path = require('path');
const sentencesRoutes = require('./routes/sentences.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// API Routes
app.use('/api/sentences', sentencesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public Supabase config (anon key is safe to expose — RLS protects data)
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
  });
});

// Serve data directory statically for fallback compatibility
app.use('/data', express.static(path.join(__dirname, 'data')));

// Serve Client Static Files
const clientDir = path.join(__dirname, '../client');
app.use(express.static(clientDir));

// Fallback to client index.html for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

// Start server if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SayType Server listening at http://localhost:${PORT}`);
    console.log(
      `API endpoints available at http://localhost:${PORT}/api/sentences`
    );
  });
}

module.exports = app;
