import dotenv from 'dotenv';
dotenv.config();

export const dbConfig = {
    user: process.env.DB_USER || 'nerdblock_user',
    password: process.env.DB_PASSWORD || 'NerdBlock123!',
    server: process.env.DB_SERVER || 'your_server_name',
    database: process.env.DB_NAME || 'NerdBlock',
    options: {
        trustServerCertificate: true,
        enableArithAbort: true,
        encrypt: false
    }
}; 