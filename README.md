# Nerdblock website

# some commands
npm dev: builds and runs 11ty server
npm run css: builds the css and puts it into the _site folder

# to run locally
    - open terminal
    - be in frontend folder: cd .\frontend\
    - install node modules: npm i
    - build CSS first: npm run css
    - run html in a separate terminal: npm run dev

# NerdBlock Subscription Service

A comprehensive subscription service management system for NerdBlock, featuring subscription management, inventory tracking, and business analytics.

## Features

- Subscription Management
- Product Catalog
- Customer Management
- Inventory Tracking
- Business Analytics
- SQL Query Interface

## Prerequisites

- Node.js (v14 or higher)
- SQL Server (2019 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/AZander48/INFT_3201_final_project.git
cd INFT_3201_final_project
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
   - Create a new database named 'NerdBlock' in SQL Server
   - Run the SQL scripts in the `frontend/sql` directory in order:
     1. `create_tables.sql`
     2. `insert_dummy_data.sql`
     3. `sample_queries_for_demo.sql`

4. Configure database connection:
   - Open `backend/api/queries.js`
   - Update the database configuration with your SQL Server details:
   ```javascript
   const config = {
       user: 'your_username',
       password: 'your_password',
       server: 'your_server_name',
       database: 'NerdBlock',
       options: {
           trustServerCertificate: true,
           enableArithAbort: true,
           encrypt: false
       }
   };
   ```

5. SQL Server Management Settings:
   - Open SQL Server Management Studio (SSMS)
   - Right-click on your server instance and select "Properties"
   - Under "Security" page:
     - Set "Server authentication" to "SQL Server and Windows Authentication mode"
     - Click "OK" to save changes
   - Restart SQL Server service:
     - Open Services (services.msc)
     - Find "SQL Server (MSSQLSERVER)" or your named instance
     - Right-click and select "Restart"
   - Create SQL Server login:
     - In SSMS, expand "Security" > "Logins"
     - Right-click "Logins" and select "New Login"
     - Enter login name and password
     - Under "Server Roles", select "sysadmin"
     - Under "User Mapping", select "NerdBlock" database
     - Click "OK" to create the login

## Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## SQL Page Setup and Usage

The SQL page provides an interface for running and testing database queries. To ensure it works properly:

1. Database Connection:
   - Ensure SQL Server is running and accessible
   - Verify the connection settings in `backend/api/queries.js`
   - Test the connection using the "Test Connection" button

2. Required Tables:
   - The SQL page requires the following tables to be present:
     - `Genres`
     - `Subscriber`
     - `Transactions`
     - `Products`
     - `Inventory`
     - `Country`

3. Sample Queries:
   - The page includes four types of queries:
     - Simple Query: Shows shipping destinations and costs
     - Intermediate Query: Displays subscription analytics by genre
     - Advanced Query: Shows revenue analytics over the past year
     - Complex Query: Provides detailed performance metrics by genre

4. Troubleshooting:
   - If queries fail with 500 errors:
     - Check the database connection settings
     - Verify all required tables exist
     - Ensure the SQL Server service is running
     - Check the browser console for detailed error messages
     - Verify SQL Server authentication settings
     - Check if the SQL Server login has proper permissions

5. Best Practices:
   - Always test queries with small datasets first
   - Use the "Test Connection" button before running queries
   - Monitor the browser console for any errors
   - Check the backend logs for detailed error information
   - Keep SQL Server Management Studio open for quick troubleshooting

## Project Structure

```
nerdblock/
├── frontend/
│   ├── src/
│   │   ├── styles/
│   │   ├── _includes/
│   │   └── *.njk
│   ├── sql/
│   │   ├── create_tables.sql
│   │   ├── insert_dummy_data.sql
│   │   └── sample_queries_for_demo.sql
│   └── package.json
├── backend/
│   ├── api/
│   │   └── queries.js
│   └── package.json
└── README.md
```




