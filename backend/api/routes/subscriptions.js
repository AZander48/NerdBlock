import express from 'express';
import sql from 'mssql';
import { dbConfig } from '../config/database.js';

const router = express.Router();

// POST /api/subscriptions
router.post('/', async (req, res) => {
    const { plan, type, userId } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        
        // First, get the GenreID based on the plan name (e.g., 'Horror', 'Science Fiction', etc.)
        const genreResult = await pool.request()
            .input('plan', sql.VarChar, plan)
            .query(`SELECT GenreID FROM Genres WHERE Name = @plan`);

        if (genreResult.recordset.length === 0) {
            return res.status(400).json({ message: 'Invalid subscription plan' });
        }

        const genreId = genreResult.recordset[0].GenreID;

        // Get the SubscriptionID based on the GenreID and type (Monthly/Annual)
        const subscriptionResult = await pool.request()
            .input('genreId', sql.Int, genreId)
            .input('type', sql.VarChar, type)
            .query(`
                SELECT SubscriptionID 
                FROM Subscriptions 
                WHERE GenreID = @genreId AND Type = @type
            `);

        if (subscriptionResult.recordset.length === 0) {
            return res.status(400).json({ message: 'Invalid subscription type' });
        }

        const subscriptionId = subscriptionResult.recordset[0].SubscriptionID;

        // Update the Subscriber table with the new SubscriptionID
        const result = await pool.request()
            .input('subscriptionId', sql.Int, subscriptionId)
            .input('userId', sql.Int, userId)
            .query(`
                UPDATE Subscriber
                SET SubscriptionID = @subscriptionId, 
                    SubscriptionStartDate = GETDATE()
                WHERE SubscriberID = @userId
            `);

        res.status(201).json({ 
            message: 'Subscription created successfully', 
            subscriptionId: subscriptionId 
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ 
            message: 'Failed to create subscription', 
            error: error.message 
        });
    } finally {
        sql.close();
    }
});

// GET /api/subscriptions/types
router.get('/types', async (req, res) => {
    try {
        console.log('Attempting to connect to database...');
        const pool = await sql.connect(dbConfig);
        
        console.log('Executing query...');
        const result = await pool.request()
            .query(`
                SELECT 
                    g.GenreID,
                    g.Name as GenreName,
                    s.Type as SubscriptionType,
                    s.Price,
                    s.SubscriptionID
                FROM Genres g
                INNER JOIN Subscriptions s ON g.GenreID = s.GenreID
            `);

        console.log('Query result:', result);

        if (!result.recordset) {
            console.log('No recordset found in result');
            throw new Error('No data returned from query');
        }

        // Transform the data into a more useful structure
        const subscriptionTypes = {};
        
        result.recordset.forEach(row => {
            console.log('Processing row:', row);
            if (!subscriptionTypes[row.GenreName]) {
                subscriptionTypes[row.GenreName] = {
                    name: row.GenreName,
                    types: {}
                };
            }
            
            subscriptionTypes[row.GenreName].types[row.SubscriptionType] = {
                price: parseFloat(row.Price),
                id: row.SubscriptionID
            };
        });

        console.log('Final subscription types:', subscriptionTypes);
        res.json(subscriptionTypes);
    } catch (error) {
        console.error('Detailed error in /types route:', {
            message: error.message,
            stack: error.stack,
            sqlState: error.sqlState,
            code: error.code
        });
        
        res.status(500).json({ 
            message: 'Failed to fetch subscription types', 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        try {
            await sql.close();
        } catch (err) {
            console.error('Error closing SQL connection:', err);
        }
    }
});

router.get('/debug', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        
        // Check if tables exist
        const tableCheck = await pool.request()
            .query(`
                SELECT 
                    TABLE_NAME, 
                    COLUMN_NAME, 
                    DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME IN ('Genres', 'Subscriptions')
                ORDER BY TABLE_NAME, ORDINAL_POSITION
            `);
        
        // Check table contents
        const genresContent = await pool.request()
            .query('SELECT * FROM Genres');
            
        const subscriptionsContent = await pool.request()
            .query('SELECT * FROM Subscriptions');

        res.json({
            tableStructure: tableCheck.recordset,
            genres: genresContent.recordset,
            subscriptions: subscriptionsContent.recordset
        });
    } catch (error) {
        console.error('Debug route error:', error);
        res.status(500).json({ 
            message: 'Debug query failed', 
            error: error.message 
        });
    } finally {
        await sql.close();
    }
});

// Add this new route before the export default router
router.get('/plans', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        
        const result = await pool.request()
            .query(`
                SELECT 
                    g.GenreID,
                    g.Name as GenreName,
                    st.Type as SubscriptionType,
                    st.Price,
                    st.SubscriptionTypeID
                FROM Genres g
                INNER JOIN SubscriptionTypes st ON g.GenreID = st.GenreID
                ORDER BY g.Name, st.Type
            `);

        // Transform the data into the structure expected by the frontend
        const plans = result.recordset.reduce((acc, row) => {
            const genreName = row.GenreName;
            
            if (!acc[genreName]) {
                // Create a slug that matches your frontend expectations
                const slug = genreName.toLowerCase().replace(/\s+/g, '-');

                acc[genreName] = {
                    id: row.GenreID,
                    name: genreName,
                    slug: slug,
                    monthlyPrice: null,
                    annualPrice: null,
                    features: getGenreFeatures(genreName)
                };
            }

            // Set the price based on subscription type
            if (row.SubscriptionType === 'Monthly') {
                acc[genreName].monthlyPrice = parseFloat(row.Price);
            } else if (row.SubscriptionType === 'Annual') {
                acc[genreName].annualPrice = parseFloat(row.Price);
            }

            return acc;
        }, {});

        // Convert the plans object to an array
        const plansArray = Object.values(plans);
        
        console.log('Processed plans:', plansArray);
        res.json(plansArray);
    } catch (error) {
        console.error('Error fetching subscription plans:', {
            message: error.message,
            stack: error.stack,
            sql: error.sql
        });
        res.status(500).json({ 
            message: 'Failed to fetch subscription plans', 
            error: error.message 
        });
    } finally {
        await sql.close();
    }
});

// Helper function to get features for each genre
function getGenreFeatures(genreName) {
    const genreKey = genreName.toLowerCase().replace(/\s+/g, '-');
    const features = {
        'horror': [
            'Horror-themed collectibles',
            'Exclusive horror merch',
            'Monthly horror surprises'
        ],
        'science-fiction': [
            'Sci-fi collectibles',
            'Space-themed items',
            'Futuristic gadgets'
        ],
        'mystery': [
            'Mystery collectibles',
            'Detective gear',
            'Exclusive comics'
        ],
        'adventure': [
            'Adventure collectibles',
            'Adventure gear',
            'Exclusive adventure items'
        ],
        'fantasy': [
            'Fantasy collectibles',
            'Fantasy gear',
            'Exclusive fantasy items'
        ]
    };
    return features[genreKey] || [
        `${genreName} collectibles`,
        `Exclusive ${genreName.toLowerCase()} items`,
        'Monthly surprises'
    ];
}

// Add this route to help debug data issues
router.get('/debug/plans', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        
        const genres = await pool.request()
            .query('SELECT * FROM Genres');
            
        const subscriptionTypes = await pool.request()
            .query('SELECT * FROM SubscriptionTypes');
        
        res.json({
            genres: genres.recordset,
            subscriptionTypes: subscriptionTypes.recordset
        });
    } catch (error) {
        console.error('Debug route error:', error);
        res.status(500).json({ 
            message: 'Debug query failed', 
            error: error.message 
        });
    } finally {
        await sql.close();
    }
});

export default router;