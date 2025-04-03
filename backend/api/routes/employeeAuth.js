import express from 'express';
import sql from 'mssql';
import { executeQuery } from '../utils/db.js';
import bcrypt from 'bcrypt';

const router = express.Router();

const employeeQueries = {
    loginEmployee: async (email, password) => {
        try {
            const result = await executeQuery(
                `SELECT 
                    EmployeeID,
                    Password,
                    FirstName,
                    LastName,
                    EmailAddress,
                    IsAdmin,
                    IsStoreOwner
                FROM Employees 
                WHERE EmailAddress = @email`,
                [{ name: 'email', type: sql.VarChar(30), value: email }]
            );

            const employee = result.recordset[0];
            if (!employee) {
                return null;
            }

            // For development, allow direct password comparison
            // In production, use: const match = await bcrypt.compare(password, employee.Password);
            const match = password === employee.Password;

            if (!match) {
                return null;
            }

            return {
                employeeId: employee.EmployeeID,
                firstName: employee.FirstName,
                lastName: employee.LastName,
                email: employee.EmailAddress,
                isAdmin: employee.IsAdmin === true,
                isStoreOwner: employee.IsStoreOwner === true
            };
        } catch (error) {
            console.error('Database error in loginEmployee:', error);
            throw error;
        }
    },

    getCurrentEmployee: async (employeeId) => {
        try {
            const result = await executeQuery(
                `SELECT 
                    EmployeeID,
                    FirstName,
                    LastName,
                    EmailAddress as Email,
                    IsAdmin,
                    IsStoreOwner
                FROM Employees 
                WHERE EmployeeID = @employeeId`,
                [{ name: 'employeeId', type: sql.Int, value: employeeId }]
            );
            return result.recordset[0];
        } catch (error) {
            console.error('Database error in getCurrentEmployee:', error);
            throw error;
        }
    }
};

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const employee = await employeeQueries.loginEmployee(email, password);
        
        if (!employee) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Store employee info in session
        req.session.employeeId = employee.employeeId;
        
        res.json({
            message: 'Login successful',
            employee: {
                firstName: employee.firstName,
                lastName: employee.lastName,
                email: employee.email,
                isAdmin: employee.isAdmin,
                isStoreOwner: employee.isStoreOwner
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get current employee route
router.get('/current', async (req, res) => {
    try {
        if (!req.session || !req.session.employeeId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const employee = await employeeQueries.getCurrentEmployee(req.session.employeeId);
        if (!employee) {
            return res.status(401).json({ message: 'Employee not found' });
        }

        res.json({
            employeeId: employee.EmployeeID,
            firstName: employee.FirstName,
            lastName: employee.LastName,
            email: employee.Email,
            isAdmin: employee.IsAdmin === true,
            isStoreOwner: employee.IsStoreOwner === true
        });
    } catch (error) {
        console.error('Error getting current employee:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Logout route
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ message: 'Error during logout' });
        }
        res.json({ message: 'Logout successful' });
    });
});

export default router; 