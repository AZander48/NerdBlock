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
    const pool = await sql.connect(dbConfig);
    
    const result = await pool.request()
      .input('identifier', sql.VarChar, identifier)
      .query(`
        SELECT SubscriberID, Username, Password 
        FROM Subscriber 
        WHERE Email = @identifier OR Username = @identifier
      `);
    
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const subscriber = result.recordset[0];
    const validPassword = await bcrypt.compare(password, subscriber.Password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.subscriberId = subscriber.SubscriberID;
    res.json({ 
      message: 'Login successful',
      subscriberId: subscriber.SubscriberID,
      username: subscriber.Username
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
    
    // Check if email already exists
    const existingUser = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Subscriber WHERE Email = @email');

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
router.get('/current', requireAuth, async (req, res) => {
  let pool;
  try {
    console.log('Fetching subscriber data for ID:', req.session.subscriberId);
    pool = await sql.connect(dbConfig);
    
    const result = await pool.request()
      .input('subscriberId', sql.Int, req.session.subscriberId)
      .query(`
        SELECT 
          s.SubscriberID,
          s.Username,
          s.FirstName,
          s.LastName,
          s.Email,
          s.CountryID,
          s.SubscriptionID,
          s.SubscriptionStartDate,
          c.CountryName,
          c.Tax,
          c.AdditionalFees
        FROM Subscriber s
        LEFT JOIN Country c ON s.CountryID = c.CountryID
        WHERE s.SubscriberID = @subscriberId
      `);

    console.log('Query result:', result);

    if (!result.recordset || result.recordset.length === 0) {
      console.log('No subscriber found with ID:', req.session.subscriberId);
      return res.status(404).json({ message: 'Subscriber not found' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching current subscriber:', error);
    res.status(500).json({ 
      message: 'Error fetching subscriber data',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (pool) {
      try {
        await sql.close();
      } catch (err) {
        console.error('Error closing SQL connection:', err);
      }
    }
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