import express from 'express';
import { executeQuery } from '../utils/db.js';

const router = express.Router();

router.get('/subscription', async (req, res) => {
    try {
        const query = `
            SELECT g.Name AS Genre, COUNT(s.SubscriberID) AS SubscriberCount
            FROM Genres g
            LEFT JOIN Subscriber s ON g.GenreID = s.GenreID
            GROUP BY g.Name
            ORDER BY COUNT(s.SubscriberID) DESC
        `;
        const results = await executeQuery(query);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

router.get('/revenue', async (req, res) => {
    // Your existing revenue analytics route code
});

router.get('/recent-transactions', async (req, res) => {
    // Your existing recent transactions route code
});

export default router; 