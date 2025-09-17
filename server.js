const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3005;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Specific route for staff dashboard
app.get('/staff_dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'staff_dashboard.html'));
});

// Route for test frontend
app.get('/test_frontend.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test_frontend.html'));
});

// Default route
app.get('/', (req, res) => {
    res.send(`
        <h1>🎯 Civic Issue Reporting System - File Server</h1>
        <h2>📄 Available Pages:</h2>
        <ul>
            <li><a href="/staff_dashboard.html">📋 Staff Dashboard</a></li>
            <li><a href="/test_frontend.html">👑 Admin Dashboard</a></li>
            <li><a href="/test_admin_dashboard.html">🧪 Admin Test</a></li>
        </ul>
        <h2>🔧 Backend Status:</h2>
        <p>Make sure backend is running on <a href="http://localhost:5000/health">http://localhost:5000</a></p>
    `);
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// 404 handler
app.use((req, res) => {
    res.status(404).send(`
        <h1>❌ 404 - Page Not Found</h1>
        <p>The file <strong>${req.url}</strong> was not found.</p>
        <p><a href="/">← Go back to home</a></p>
        <h2>📄 Available files:</h2>
        <ul>
            <li><a href="/staff_dashboard.html">Staff Dashboard</a></li>
            <li><a href="/test_frontend.html">Admin Dashboard</a></li>
        </ul>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📋 Staff Dashboard: http://localhost:${PORT}/staff_dashboard.html`);
    console.log(`👑 Admin Dashboard: http://localhost:${PORT}/test_frontend.html`);
    console.log(`🔧 Make sure backend is running on http://localhost:5000`);
});

module.exports = app;
