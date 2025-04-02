import express from 'express';
import sql from 'mssql';
import { dbConfig } from '../config/database.js';

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
    let pool = null;
    try {
        const { email, password } = req.body;
        console.log('Employee login attempt for:', email);
        
        // Create a new pool
        pool = await new sql.ConnectionPool(dbConfig).connect();
        console.log('Connected to database');
        
        // Check if the employee exists
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, password)
            .query(`
                SELECT 
                    EmployeeID, 
                    EmailAddress,
                    FirstName,
                    LastName,
                    IsAdmin,
                    IsStoreOwner,
                    StoreID
                FROM Employees 
                WHERE EmailAddress = @email
                AND Password = @password
            `);
        
        console.log('Query result:', result.recordset);

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const employee = result.recordset[0];
        
        // Set employee session
        req.session.employeeId = employee.EmployeeID;
        req.session.isAdmin = employee.IsAdmin;
        req.session.isStoreOwner = employee.IsStoreOwner;
        req.session.storeId = employee.StoreID;
        
        res.json({
            message: 'Login successful',
            employee: {
                id: employee.EmployeeID,
                email: employee.EmailAddress,
                firstName: employee.FirstName,
                lastName: employee.LastName,
                isAdmin: employee.IsAdmin,
                isStoreOwner: employee.IsStoreOwner,
                storeId: employee.StoreID
            }
        });
    } catch (error) {
        console.error('Employee login error:', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
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

// Get current employee
router.get('/current', async (req, res) => {
    let pool = null;
    try {
        const employeeId = req.session?.employeeId;
        if (!employeeId) {
            return res.status(401).json({ message: 'Not logged in' });
        }

        // Create a new pool
        pool = await new sql.ConnectionPool(dbConfig).connect();
        console.log('Connected to database');

        const result = await pool.request()
            .input('employeeId', sql.Int, employeeId)
            .query(`
                SELECT 
                    e.EmployeeID,
                    e.EmailAddress,
                    e.FirstName,
                    e.LastName,
                    e.IsAdmin,
                    e.IsStoreOwner,
                    e.StoreID
                FROM Employees e
                WHERE e.EmployeeID = @employeeId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ message: 'Failed to fetch employee details' });
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