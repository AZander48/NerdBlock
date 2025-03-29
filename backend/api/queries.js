require('dotenv').config();
const express = require('express');
const router = express.Router();
const sql = require('mssql');
console.log(process.env.DB_USER);

// Database configuration
const config = {
    user: "nerdblock_user",     // SQL Server Authentication username
    password: "NerdBlock123!",  // SQL Server Authentication password
    server: "LAPTOP-8N04EDR0",  // Your server name
    database: "NerdBlock",      // Your database name
    options: {
        trustServerCertificate: true,
        enableArithAbort: true,
        encrypt: false
    }
};

// Execute query and return results
async function executeQuery(query) {
    try {
        console.log('Attempting to connect to database with config:', {
            server: config.server,
            database: config.database,
            driver: config.driver
        });
        
        await sql.connect(config);
        console.log('Successfully connected to database');
        
        const result = await sql.query(query);
        console.log('Query executed successfully');
        
        return result.recordset;
    } catch (err) {
        console.error('SQL error details:', {
            message: err.message,
            code: err.code,
            state: err.state
        });
        throw err;
    } finally {
        try {
            await sql.close();
            console.log('Database connection closed');
        } catch (err) {
            console.error('Error closing connection:', err);
        }
    }
}

// Get all countries
router.get('/countries', async (req, res) => {
    try {
        console.log('Fetching countries...');
        const query = 'SELECT DISTINCT CountryName, Tax, AdditionalFees FROM Country';
        const results = await executeQuery(query);
        console.log(`Found ${results.length} countries`);
        res.json(results);
    } catch (err) {
        console.error('Error in /countries endpoint:', err);
        res.status(500).json({ 
            error: 'Database error',
            details: err.message,
            code: err.code
        });
    }
});

// Get all products with inventory
router.get('/products', async (req, res) => {
    try {
        console.log('Fetching products...');
        const query = `
            SELECT p.Name, p.Price, i.Quantity
            FROM Products p
            JOIN Inventory i ON p.ProductID = i.ProductID
        `;
        const results = await executeQuery(query);
        console.log(`Found ${results.length} products`);
        res.json(results);
    } catch (err) {
        console.error('Error in /products endpoint:', err);
        res.status(500).json({ 
            error: 'Database error',
            details: err.message,
            code: err.code
        });
    }
});

// Get subscription analytics
router.get('/subscription-analytics', async (req, res) => {
    try {
        console.log('Fetching subscription analytics...');
        const query = `
            SELECT g.Name AS Genre, COUNT(s.SubscriberID) AS SubscriberCount
            FROM Genres g
            LEFT JOIN Subscriber s ON g.GenreID = s.GenreID
            GROUP BY g.Name
            ORDER BY COUNT(s.SubscriberID) DESC
        `;
        const results = await executeQuery(query);
        console.log(`Found ${results.length} genre analytics`);
        res.json(results);
    } catch (err) {
        console.error('Error in /subscription-analytics endpoint:', err);
        res.status(500).json({ 
            error: 'Database error',
            details: err.message,
            code: err.code
        });
    }
});

// Get revenue analytics
router.get('/revenue-analytics', async (req, res) => {
    try {
        console.log('Fetching revenue analytics...');
        const query = `
            SELECT 
                g.Name AS Genre,
                COUNT(DISTINCT s.SubscriberID) AS TotalSubscribers,
                ISNULL(SUM(t.TotalPrice), 0) AS TotalRevenue,
                ISNULL(AVG(t.TotalPrice), 0) AS AverageTransactionValue,
                COUNT(t.TransactionID) AS TransactionCount
            FROM Genres g
            LEFT JOIN Subscriber s ON g.GenreID = s.GenreID
            LEFT JOIN Transactions t ON s.SubscriberID = t.SubscriberID
                AND t.Date >= DATEADD(year, -1, GETDATE())
            GROUP BY g.Name
            ORDER BY ISNULL(SUM(t.TotalPrice), 0) DESC;
        `;
        const results = await executeQuery(query);
        console.log(`Found ${results.length} revenue analytics`);
        res.json(results);
    } catch (err) {
        console.error('Error in /revenue-analytics endpoint:', err);
        res.status(500).json({ 
            error: 'Database error',
            details: err.message,
            code: err.code
        });
    }
});

// Get recent transactions
router.get('/recent-transactions', async (req, res) => {
    try {
        console.log('Fetching recent transactions...');
        const query = `
            SELECT TOP 5 t.TransactionID, s.FirstName, s.LastName, t.TotalPrice, t.Date
            FROM Transactions t
            JOIN Subscriber s ON t.SubscriberID = s.SubscriberID
            ORDER BY t.Date DESC
        `;
        const results = await executeQuery(query);
        console.log(`Found ${results.length} recent transactions`);
        res.json(results);
    } catch (err) {
        console.error('Error in /recent-transactions endpoint:', err);
        res.status(500).json({ 
            error: 'Database error',
            details: err.message,
            code: err.code
        });
    }
});

module.exports = router; 