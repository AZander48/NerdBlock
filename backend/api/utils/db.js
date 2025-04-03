import sql from 'mssql';
import { dbConfig } from '../config/database.js';

// Create a single connection pool
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

// Handle pool connection errors
pool.on('error', err => {
    console.error('SQL Pool Error:', err);
});

export async function getConnection() {
    try {
        // Wait for pool connection to be established
        await poolConnect;
        return pool;
    } catch (err) {
        console.error('Error getting connection:', err);
        throw err;
    }
}

export async function executeQuery(query, params = []) {
    try {
        const pool = await getConnection();
        const request = pool.request();
        
        // Add parameters if they exist
        params.forEach(param => {
            request.input(param.name, param.type, param.value);
        });
        
        const result = await request.query(query);
        return result;
    } catch (err) {
        console.error('Error executing query:', err);
        throw err;
    }
} 