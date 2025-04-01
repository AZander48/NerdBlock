import express from 'express';
import cors from 'cors';
import session from 'express-session';
import bcrypt from 'bcrypt';
import queriesRouter from './api/queries.js';

const app = express();
const PORT = 3000; // Make sure this matches the port in your API_BASE_URL

// CORS configuration
app.use(cors({
    origin: 'http://localhost:8081', // Your frontend URL
    credentials: true, // Important for sessions
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.subscriberId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// Auth Routes
app.post('/api/subscribers/register', async (req, res) => {
  try {
    const { userName, firstName, lastName, email, password, phoneNumber, shippingAddress, billingAddress } = req.body;
    
    // Check if email already exists
    const existingUser = await pool.query('SELECT * FROM subscribers WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO subscribers 
       (userName, firstName, lastName, email, password, phoneNumber, shippingAddress, billingAddress) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id`,
      [userName, firstName, lastName, email, hashedPassword, phoneNumber, shippingAddress, billingAddress]
    );

    req.session.subscriberId = result.rows[0].id;
    res.json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/subscribers/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM subscribers WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const subscriber = result.rows[0];
    const validPassword = await bcrypt.compare(password, subscriber.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.subscriberId = subscriber.id;
    res.json({ message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.post('/api/subscribers/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

app.get('/api/subscribers/current', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, userName, firstName, lastName, email, phoneNumber, shippingAddress, billingAddress FROM subscribers WHERE id = $1',
      [req.session.subscriberId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching current subscriber:', error);
    res.status(500).json({ message: 'Error fetching subscriber data' });
  }
});

// API Routes
app.use('/api', queriesRouter);

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 