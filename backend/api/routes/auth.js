import express from 'express';
import sql from 'mssql';
import bcrypt from 'bcrypt';
import { dbConfig } from '../config/database.js';

const router = express.Router();

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.subscriberId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// Login route
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    console.log('Login attempt for:', identifier);
    
    const pool = await sql.connect(dbConfig);
    
    // Check if the user exists with direct password comparison
    const result = await pool.request()
      .input('identifier', sql.VarChar, identifier)
      .input('password', sql.VarChar, password)  // Add password as input
      .query(`
        SELECT SubscriberID, Username, EmailAddress 
        FROM Subscriber 
        WHERE (EmailAddress = @identifier OR Username = @identifier)
        AND Password = @password
      `);
    
    console.log('Query result:', result.recordset);

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const subscriber = result.recordset[0];
    
    // Set session
    req.session.subscriberId = subscriber.SubscriberID;
    
    // Return success
    res.json({
      message: 'Login successful',
      user: {
        id: subscriber.SubscriberID,
        email: subscriber.EmailAddress,
        username: subscriber.Username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  } finally {
    sql.close();
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { userName, firstName, lastName, email, password } = req.body;
    const pool = await sql.connect(dbConfig);
    
    const existingUser = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Subscriber WHERE EmailAddress = @email');

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.request()
      .input('userName', sql.VarChar, userName)
      .input('firstName', sql.VarChar, firstName)
      .input('lastName', sql.VarChar, lastName)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashedPassword)
      .query(`
        INSERT INTO Subscriber 
        (Username, FirstName, LastName, EmailAddress, Password) 
        VALUES (@userName, @firstName, @lastName, @email, @password);
        SELECT SCOPE_IDENTITY() AS SubscriberID;
      `);

    req.session.subscriberId = result.recordset[0].SubscriberID;
    res.json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  } finally {
    sql.close();
  }
});

// Get current subscriber route
router.get('/current', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .query(`
                SELECT TOP 1
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
                WHERE s.SubscriberID = 1
            `);

        console.log('Query result:', result.recordset[0]);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Subscriber not found' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error fetching subscriber:', error);
        res.status(500).json({ message: 'Failed to fetch subscriber details' });
    } finally {
        sql.close();
    }
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

export default router; 