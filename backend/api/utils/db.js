import sql from 'mssql';
import { dbConfig } from '../config/database.js';

export async function executeQuery(query) {
    try {
        console.log('Attempting to connect to database...');
        await sql.connect(dbConfig);
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