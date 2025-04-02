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
    const { 
      userName, 
      firstName, 
      lastName, 
      email, 
      password,
      phoneNumber,
      shippingAddress,
      billingAddress,
      countryId,
      paymentType
    } = req.body;

    const pool = await sql.connect(dbConfig);
    
    // Check if email is already taken
    const existingUser = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Subscriber WHERE EmailAddress = @email');

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check if username is already taken
    const existingUsername = await pool.request()
      .input('userName', sql.VarChar, userName)
      .query('SELECT * FROM Subscriber WHERE Username = @userName');

    if (existingUsername.recordset.length > 0) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Validate country exists
    const countryCheck = await pool.request()
      .input('countryId', sql.Int, countryId)
      .query('SELECT CountryID FROM Country WHERE CountryID = @countryId');

    if (countryCheck.recordset.length === 0) {
      return res.status(400).json({ message: 'Invalid country selected' });
    }

    // Get current date for registration
    const registrationDate = new Date().toISOString();
    
    const result = await pool.request()
      .input('userName', sql.VarChar, userName)
      .input('firstName', sql.VarChar, firstName)
      .input('lastName', sql.VarChar, lastName)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, password)
      .input('phoneNumber', sql.VarChar, phoneNumber || null)
      .input('shippingAddress', sql.VarChar, shippingAddress || null)
      .input('billingAddress', sql.VarChar, billingAddress || null)
      .input('countryId', sql.Int, countryId)
      .input('paymentType', sql.VarChar, paymentType)
      .input('registrationDate', sql.DateTime, registrationDate)
      .query(`
        INSERT INTO Subscriber 
        (Username, FirstName, LastName, EmailAddress, Password, 
         PhoneNumber, ShippingAddress, BillingAddress, CountryID, 
         PaymentType, DateCreated)
        VALUES 
        (@userName, @firstName, @lastName, @email, @password,
         @phoneNumber, @shippingAddress, @billingAddress, @countryId,
         @paymentType, @registrationDate);
        
        SELECT SCOPE_IDENTITY() AS SubscriberID;
      `);

    // Set session
    req.session.subscriberId = result.recordset[0].SubscriberID;
    
    res.json({ 
      message: 'Registration successful',
      subscriberId: result.recordset[0].SubscriberID 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed: ' + error.message });
  } finally {
    sql.close();
  }
});

// Get current subscriber route
router.get('/current', async (req, res) => {
    try {
        const subscriberId = req.session?.subscriberId;
        console.log('Subscriber ID:', req.session?.subscriberId);
        if (!subscriberId) {
            console.log('No subscriber ID in session');
            return res.status(401).json({ message: 'Not logged in' });
        }
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('subscriberId', sql.Int, subscriberId)
            .query(`
                SELECT TOP 1
                    s.SubscriberID,
                    s.UserName,
                    s.FirstName,
                    s.LastName,
                    s.EmailAddress,
                    s.PhoneNumber,
                    s.ShippingAddress as Address,
                    s.BillingAddress as City,
                    s.CountryID,
                    s.PaymentType,
                    s.DateCreated,
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

// Change password route
router.post('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const subscriberId = req.session?.subscriberId;

        if (!subscriberId) {
            return res.status(401).json({ message: 'Not logged in' });
        }

        const pool = await sql.connect(dbConfig);

        // Verify current password
        const verifyResult = await pool.request()
            .input('subscriberId', sql.Int, subscriberId)
            .input('currentPassword', sql.VarChar, currentPassword)
            .query(`
                SELECT SubscriberID 
                FROM Subscriber 
                WHERE SubscriberID = @subscriberId 
                AND Password = @currentPassword
            `);

        if (verifyResult.recordset.length === 0) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Update password
        await pool.request()
            .input('subscriberId', sql.Int, subscriberId)
            .input('newPassword', sql.VarChar, newPassword)
            .query(`
                UPDATE Subscriber 
                SET Password = @newPassword 
                WHERE SubscriberID = @subscriberId
            `);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Failed to change password' });
    } finally {
        sql.close();
    }
});

// Update profile route
router.post('/update-profile', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, address, city, paymentType } = req.body;
        const subscriberId = req.session?.subscriberId;

        if (!subscriberId) {
            return res.status(401).json({ message: 'Not logged in' });
        }

        const pool = await sql.connect(dbConfig);

        // Check if email is already taken by another user
        if (email) {
            const emailCheck = await pool.request()
                .input('email', sql.VarChar, email)
                .input('subscriberId', sql.Int, subscriberId)
                .query(`
                    SELECT SubscriberID 
                    FROM Subscriber 
                    WHERE EmailAddress = @email 
                    AND SubscriberID != @subscriberId
                `);

            if (emailCheck.recordset.length > 0) {
                return res.status(400).json({ message: 'Email is already in use' });
            }
        }

        // Update profile
        await pool.request()
            .input('subscriberId', sql.Int, subscriberId)
            .input('firstName', sql.VarChar, firstName)
            .input('lastName', sql.VarChar, lastName)
            .input('email', sql.VarChar, email)
            .input('phone', sql.VarChar, phone)
            .input('address', sql.VarChar, address)
            .input('city', sql.VarChar, city)
            .input('paymentType', sql.VarChar, paymentType)
            .query(`
                UPDATE Subscriber 
                SET FirstName = @firstName,
                    LastName = @lastName,
                    EmailAddress = @email,
                    PhoneNumber = @phone,
                    ShippingAddress = @address,
                    BillingAddress = @city,
                    PaymentType = @paymentType
                WHERE SubscriberID = @subscriberId
            `);

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    } finally {
        sql.close();
    }
});

// Get countries route
router.get('/countries', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .query('SELECT CountryID, CountryName FROM Country ORDER BY CountryName');
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({ message: 'Failed to fetch countries' });
    } finally {
        sql.close();
    }
});

export default router; 