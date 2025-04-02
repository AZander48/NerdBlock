import express from 'express';
import sql from 'mssql';
import { dbConfig } from '../config/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        
        const result = await pool.request()
            .query(`
                SELECT 
                    CountryID,
                    CountryName,
                    Tax,
                    AdditionalFees
                FROM Country
                ORDER BY CountryName ASC
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({ 
            message: 'Failed to fetch countries', 
            error: error.message 
        });
    } finally {
        await sql.close();
    }
});

export default router; 