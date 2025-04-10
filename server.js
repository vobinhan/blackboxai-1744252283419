const express = require('express');
const app = express();
const path = require('path');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// In-memory storage for tracking links
const trackingLinks = new Map();

// Generate unique tracking ID
function generateTrackingId() {
    return Math.random().toString(36).substring(2, 15);
}

// Create tracking link
app.post('/api/create-link', (req, res) => {
    try {
        console.log('Received create-link request:', req.body);
        const { destinationUrl } = req.body;
        
        if (!destinationUrl) {
            console.log('Missing destinationUrl');
            return res.status(400).json({ error: 'Destination URL is required' });
        }

        const trackingId = generateTrackingId();
        trackingLinks.set(trackingId, {
            destinationUrl,
            events: []
        });

        console.log('Created tracking link:', { trackingId, destinationUrl });
        res.json({
            success: true,
            trackingId,
            trackingUrl: `/track.html?tid=${trackingId}`
        });
    } catch (error) {
        console.error('Error creating link:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Log click event
app.post('/api/log-click', (req, res) => {
    try {
        console.log('Received log-click request:', req.body);
        const { tid } = req.body;
        
        if (!tid || !trackingLinks.has(tid)) {
            console.log('Invalid tracking ID:', tid);
            return res.status(404).json({ error: 'Invalid tracking ID' });
        }

        const tracking = trackingLinks.get(tid);
        const event = {
            timestamp: new Date(),
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            referer: req.headers['referer'] || 'Direct'
        };

        tracking.events.push(event);
        console.log('Logged click event:', { tid, event });
        res.json({ 
            success: true,
            destinationUrl: tracking.destinationUrl 
        });
    } catch (error) {
        console.error('Error logging click:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get tracking data
app.get('/api/tracking/:tid', (req, res) => {
    try {
        console.log('Received tracking data request:', req.params);
        const { tid } = req.params;
        
        if (!trackingLinks.has(tid)) {
            console.log('Invalid tracking ID:', tid);
            return res.status(404).json({ error: 'Invalid tracking ID' });
        }

        const tracking = trackingLinks.get(tid);
        console.log('Retrieved tracking data:', { tid, tracking });
        res.json(tracking);
    } catch (error) {
        console.error('Error getting tracking data:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
