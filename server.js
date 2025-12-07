/**
 * MySpeech - Express Server
 * Main server file for the Text-to-Speech application
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const ttsRouter = require('./api/tts');
const adminRouter = require('./api/admin');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====

// Enable CORS for all routes
app.use(cors());

// Parse JSON request bodies
app.use(express.json({ limit: '1mb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve generated audio files
app.use('/audio', express.static(path.join(__dirname, 'public', 'audio')));

// ===== Routes =====

// API Routes
app.use('/api', ttsRouter);
app.use('/api/admin', adminRouter);

// Serve voices.json
app.get('/voices.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'voices.json'));
});

// Serve main HTML file for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ===== Error Handling =====

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.path
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ===== Start Server =====

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🎙️  MySpeech Server is Running!                 ║
║                                                   ║
║   Local:    http://localhost:${PORT}                ║
║   Health:   http://localhost:${PORT}/health         ║
║   API:      http://localhost:${PORT}/api/tts        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
    `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

module.exports = app;
