import express from 'express';
import sql from 'mssql';
import { dbConfig } from '../config/database.js';

const router = express.Router();

// Move product queries here
const productQueries = {
    getAllGenres: async (pool) => {
        try {
            console.log('Executing getAllGenres query...');
            const result = await pool.request()
                .query(`
                    SELECT 
                        g.[GenreID] as GenreID,
                        g.[Name] as GenreName,
                        ISNULL(g.[Description], 'Explore our collection') as GenreDescription,
                        COUNT(p.[ProductID]) as ProductCount
                    FROM [Genres] g
                    LEFT JOIN [Products] p ON g.[GenreID] = p.[GenreID]
                    GROUP BY g.[GenreID], g.[Name], g.[Description]
                    ORDER BY g.[Name]
                `);
            
            console.log('Query result:', result.recordset);
            return result.recordset;
        } catch (error) {
            console.error('Database error in getAllGenres:', error);
            throw error;
        }
    },

    getProductsByGenre: async (pool, genreId) => {
        try {
            console.log('Executing getProductsByGenre query with genreId:', genreId);
            const result = await pool.request()
                .input('genreId', sql.Numeric(9), genreId)
                .query(`
                    SELECT 
                        CAST(p.[ProductID] as INT) as ProductID,
                        p.[Name] as ProductName,
                        p.[Description],
                        p.[Price],
                        CAST(p.[GenreID] as INT) as GenreID,
                        g.[Name] as GenreName
                    FROM [Products] p
                    JOIN [Genres] g ON p.[GenreID] = g.[GenreID]
                    WHERE p.[GenreID] = @genreId
                    ORDER BY p.[Name]
                `);
            
            console.log('Query result:', result.recordset);
            return result.recordset;
        } catch (error) {
            console.error('Database error in getProductsByGenre:', error);
            throw error;
        }
    }
};

// Get all genres
router.get('/genres', async (req, res) => {
    let pool;
    try {
        console.log('Connecting to database...');
        pool = await sql.connect(dbConfig);
        console.log('Connected to database');
        
        console.log('Fetching genres...');
        const genres = await productQueries.getAllGenres(pool);
        console.log('Fetched genres:', genres);
        
        res.json(genres);
    } catch (error) {
        console.error('Full error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            number: error.number
        });
        
        res.status(500).json({ 
            message: 'Failed to fetch genres',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (pool) {
            try {
                await pool.close();
                console.log('Database connection closed');
            } catch (err) {
                console.error('Error closing database connection:', err);
            }
        }
    }
});

// Add debug route
router.get('/debug/genres', async (req, res) => {
    let pool;
    try {
        pool = await sql.connect(dbConfig);
        
        // Check if table exists
        const tableCheck = await pool.request()
            .query(`
                SELECT * 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'Genres'
            `);

        // Get table structure
        const columnCheck = await pool.request()
            .query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Genres'
            `);

        res.json({
            tableExists: tableCheck.recordset.length > 0,
            columns: columnCheck.recordset
        });
    } catch (error) {
        console.error('Debug route error:', error);
        res.status(500).json({ 
            message: 'Debug query failed',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (pool) {
            try {
                await pool.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
});

// Get products by genre
router.get('/by-genre/:genreId', async (req, res) => {
    let pool;
    try {
        const { genreId } = req.params;
        console.log('Fetching products for genre:', genreId);
        
        pool = await sql.connect(dbConfig);
        const products = await productQueries.getProductsByGenre(pool, genreId);
        
        console.log('Successfully fetched products:', products);
        res.json(products);
    } catch (error) {
        console.error('Full error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            number: error.number
        });
        
        res.status(500).json({ 
            message: 'Failed to fetch products',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (pool) {
            try {
                await pool.close();
                console.log('Database connection closed');
            } catch (err) {
                console.error('Error closing database connection:', err);
            }
        }
    }
});

export default router; 