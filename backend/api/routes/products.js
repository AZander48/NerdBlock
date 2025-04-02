import express from 'express';
import { executeQuery } from '../utils/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT p.Name, p.Price, i.Quantity
            FROM Products p
            JOIN Inventory i ON p.ProductID = i.ProductID
        `;
        const results = await executeQuery(query);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

export default router; 