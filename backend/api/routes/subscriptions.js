import express from 'express';
import sql from 'mssql';
import { dbConfig } from '../config/database.js';

const router = express.Router();

// POST /api/subscriptions
router.post('/', async (req, res) => {
    const { plan, type, userId } = req.body;

    try {
        console.log('Creating subscription:', { plan, type, userId });
        const pool = await sql.connect(dbConfig);
        
        // First, get the SubscriptionTypeID based on the plan name and type
        const subscriptionTypeResult = await pool.request()
            .input('plan', sql.VarChar, plan)
            .input('type', sql.VarChar, type)
            .query(`
                SELECT st.SubscriptionTypeID
                FROM SubscriptionTypes st
                INNER JOIN Genres g ON st.GenreID = g.GenreID
                WHERE g.Name = @plan AND st.Type = @type
            `);

        if (subscriptionTypeResult.recordset.length === 0) {
            return res.status(400).json({ message: 'Invalid subscription plan or type' });
        }

        const subscriptionTypeId = subscriptionTypeResult.recordset[0].SubscriptionTypeID;

        // Create new subscription
        const newSubscription = await pool.request()
            .input('subscriptionTypeId', sql.Numeric(9), subscriptionTypeId)
            .input('startDate', sql.DateTime, new Date())
            .query(`
                INSERT INTO Subscriptions (
                    SubscriptionTypeID,
                    SubscriptionStartDate
                ) VALUES (
                    @subscriptionTypeId,
                    @startDate
                );
                SELECT SCOPE_IDENTITY() as SubscriptionID;
            `);

        const subscriptionId = newSubscription.recordset[0].SubscriptionID;

        // Update the subscriber with the new subscription ID
        await pool.request()
            .input('subscriptionId', sql.Numeric(9), subscriptionId)
            .input('subscriberId', sql.Int, userId)
            .query(`
                UPDATE Subscriber
                SET SubscriptionID = @subscriptionId
                WHERE SubscriberID = @subscriberId
            `);

        // Get the updated subscriber details
        const updatedSubscriber = await pool.request()
            .input('subscriberId', sql.Int, userId)
            .query(`
                SELECT 
                    s.SubscriberID,
                    s.FirstName,
                    s.LastName,
                    s.EmailAddress,
                    s.PhoneNumber,
                    s.ShippingAddress as Address,
                    s.BillingAddress as City,
                    s.CountryID,
                    c.CountryName as CountryName,
                    c.Tax as TaxRate,
                    c.AdditionalFees as ShippingRate,
                    s.SubscriptionID,
                    sub.SubscriptionStartDate,
                    st.Type as SubscriptionType,
                    g.Name as GenreName,
                    st.Price as SubscriptionPrice
                FROM Subscriber s
                LEFT JOIN Country c ON s.CountryID = c.CountryID
                LEFT JOIN Subscriptions sub ON s.SubscriptionID = sub.SubscriptionID
                LEFT JOIN SubscriptionTypes st ON sub.SubscriptionTypeID = st.SubscriptionTypeID
                LEFT JOIN Genres g ON st.GenreID = g.GenreID
                WHERE s.SubscriberID = @subscriberId
            `);

        res.status(201).json({ 
            message: 'Subscription created successfully', 
            subscriptionId: subscriptionId,
            subscriber: updatedSubscriber.recordset[0]
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
        console.log('Fetching subscription types...');
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

        console.log('Query result:', result.recordset);

        // Transform the data into the expected structure
        const subscriptionTypes = {};
        
        result.recordset.forEach(row => {
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

        console.log('Transformed data:', subscriptionTypes);
        res.json(subscriptionTypes);
    } catch (error) {
        console.error('Error fetching subscription types:', error);
        res.status(500).json({ 
            message: 'Failed to fetch subscription types', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

// Cancel subscription
router.delete('/:id', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        
        // First, get the subscriber ID for this subscription
        const result = await pool.request()
            .input('subscriptionId', sql.Numeric(9), req.params.id)
            .query(`
                SELECT SubscriberID 
                FROM Subscriber 
                WHERE SubscriptionID = @subscriptionId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        // Update the subscriber to remove the subscription
        await pool.request()
            .input('subscriberId', sql.Numeric(9), result.recordset[0].SubscriberID)
            .query(`
                UPDATE Subscriber
                SET SubscriptionID = NULL
                WHERE SubscriberID = @subscriberId
            `);

        res.json({ message: 'Subscription cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({ message: 'Failed to cancel subscription' });
    } finally {
        sql.close();
    }
});

export default router;