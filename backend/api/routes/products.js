import express from 'express';
import sql from 'mssql';
import { executeQuery } from '../utils/db.js';

const router = express.Router();

const productQueries = {
    getAllGenres: async () => {
        try {
            console.log('Executing getAllGenres query...');
            const result = await executeQuery(`
                SELECT 
                    CAST(g.[GenreID] as INT) as GenreID,
                    g.[Name] as GenreName,
                    ISNULL(g.[Description], 'Explore our collection') as GenreDescription,
                    COUNT(DISTINCT p.[ProductID]) as ProductCount,
                    SUM(i.[Quantity]) as TotalInventory
                FROM [Genres] g
                LEFT JOIN [Products] p ON g.[GenreID] = p.[GenreID]
                LEFT JOIN [Inventory] i ON p.[ProductID] = i.[ProductID]
                GROUP BY g.[GenreID], g.[Name], g.[Description]
                ORDER BY g.[Name]
            `);
            
            console.log('Query result:', result.recordset);
            return result.recordset;
        } catch (error) {
            console.error('Database error in getAllGenres:', error);
            throw error;
        }
    },

    getProductsByGenre: async (genreId) => {
        try {
            console.log('Executing getProductsByGenre query with genreId:', genreId);
            const result = await executeQuery(
                `SELECT 
                    CAST(p.[ProductID] as INT) as ProductID,
                    p.[Name] as ProductName,
                    p.[Description],
                    p.[Price],
                    CAST(p.[GenreID] as INT) as GenreID,
                    g.[Name] as GenreName,
                    i.[Quantity] as StockQuantity,
                    i.[ProductName] as InventoryName
                FROM [Products] p
                JOIN [Genres] g ON p.[GenreID] = g.[GenreID]
                LEFT JOIN [Inventory] i ON p.[ProductID] = i.[ProductID]
                WHERE p.[GenreID] = @genreId
                ORDER BY p.[Name]`,
                [{ name: 'genreId', type: sql.Numeric(9), value: genreId }]
            );
            
            console.log('Query result:', result.recordset);
            return result.recordset;
        } catch (error) {
            console.error('Database error in getProductsByGenre:', error);
            throw error;
        }
    },

    getInventoryOverview: async () => {
        try {
            // Get main inventory
            const inventoryResult = await executeQuery(`
                SELECT 
                    i.[InventoryID],
                    i.[ProductID],
                    i.[ProductName],
                    i.[Quantity] as InventoryQuantity,
                    p.[Name] as OriginalProductName,
                    p.[Description],
                    p.[Price],
                    g.[Name] as GenreName
                FROM [Inventory] i
                LEFT JOIN [Products] p ON i.[ProductID] = p.[ProductID]
                LEFT JOIN [Genres] g ON p.[GenreID] = g.[GenreID]
                ORDER BY g.[Name], p.[Name]
            `);

            // Get overstock
            const overstockResult = await executeQuery(`
                SELECT 
                    o.[OverstockID],
                    o.[ProductID],
                    o.[Quantity] as OverstockQuantity,
                    o.[TransferSortingKey],
                    p.[Name] as ProductName,
                    p.[Description],
                    p.[Price],
                    g.[Name] as GenreName,
                    s.[City] as StoreCity,
                    s.[StreetAddress] as StoreStreetAddress
                FROM [Overstock] o
                LEFT JOIN [Products] p ON o.[ProductID] = p.[ProductID]
                LEFT JOIN [Genres] g ON p.[GenreID] = g.[GenreID]
                LEFT JOIN [Stores] s ON o.[StoreID] = s.[StoreID]
                ORDER BY g.[Name], p.[Name]
            `);
            
            // Get summary statistics
            const statsResult = await executeQuery(`
                SELECT 
                    (SELECT COUNT(DISTINCT ProductID) FROM Inventory) as UniqueInventoryProducts,
                    (SELECT SUM(Quantity) FROM Inventory) as TotalInventory,
                    (SELECT COUNT(DISTINCT ProductID) FROM Overstock) as UniqueOverstockProducts,
                    (SELECT SUM(Quantity) FROM Overstock) as TotalOverstock,
                    (SELECT COUNT(DISTINCT GenreID) FROM Genres) as GenreCount
            `);

            return {
                inventory: inventoryResult.recordset,
                overstock: overstockResult.recordset,
                stats: statsResult.recordset[0]
            };
        } catch (error) {
            console.error('Database error in getInventoryOverview:', error);
            throw error;
        }
    },

    getAllProducts: async () => {
        try {
            const result = await executeQuery(`
                SELECT 
                    CAST(p.[ProductID] as INT) as ProductID,
                    p.[Name],
                    p.[Description],
                    p.[Price],
                    g.[Name] as GenreName
                FROM [Products] p
                LEFT JOIN [Genres] g ON p.[GenreID] = g.[GenreID]
                ORDER BY g.[Name], p.[Name]
            `);
            return result.recordset;
        } catch (error) {
            console.error('Database error in getAllProducts:', error);
            throw error;
        }
    },

    addInventoryItem: async (productId, quantity, productName = null) => {
        try {
            // First get the original product name if no custom name is provided
            if (!productName) {
                const productResult = await executeQuery(
                    `SELECT Name FROM Products WHERE ProductID = @productId`,
                    [{ name: 'productId', type: sql.Int, value: productId }]
                );
                productName = productResult.recordset[0].Name;
            }

            const result = await executeQuery(
                `INSERT INTO [Inventory] (ProductID, Quantity, ProductName)
                 VALUES (@productId, @quantity, @productName)`,
                [
                    { name: 'productId', type: sql.Int, value: productId },
                    { name: 'quantity', type: sql.Int, value: quantity },
                    { name: 'productName', type: sql.VarChar(100), value: productName }
                ]
            );
            return result;
        } catch (error) {
            console.error('Database error in addInventoryItem:', error);
            throw error;
        }
    },

    deleteInventoryItem: async (inventoryId) => {
        try {
            const result = await executeQuery(
                `DELETE FROM [Inventory] WHERE InventoryID = @inventoryId`,
                [{ name: 'inventoryId', type: sql.Int, value: inventoryId }]
            );
            return result;
        } catch (error) {
            console.error('Database error in deleteInventoryItem:', error);
            throw error;
        }
    },

    addProduct: async (name, description, price, genreId) => {
        try {
            const result = await executeQuery(
                `INSERT INTO [Products] (Name, Description, Price, GenreID)
                 VALUES (@name, @description, @price, @genreId)`,
                [
                    { name: 'name', type: sql.VarChar(30), value: name },
                    { name: 'description', type: sql.VarChar(150), value: description },
                    { name: 'price', type: sql.Decimal(9,2), value: price },
                    { name: 'genreId', type: sql.Int, value: genreId }
                ]
            );
            return result;
        } catch (error) {
            console.error('Database error in addProduct:', error);
            throw error;
        }
    },

    deleteProduct: async (productId) => {
        try {
            // First delete related inventory items
            await executeQuery(
                `DELETE FROM [Inventory] WHERE ProductID = @productId`,
                [{ name: 'productId', type: sql.Int, value: productId }]
            );
            
            // Then delete the product
            const result = await executeQuery(
                `DELETE FROM [Products] WHERE ProductID = @productId`,
                [{ name: 'productId', type: sql.Int, value: productId }]
            );
            return result;
        } catch (error) {
            console.error('Database error in deleteProduct:', error);
            throw error;
        }
    }
};

// Get all genres
router.get('/genres', async (req, res) => {
    try {
        console.log('Fetching genres...');
        const genres = await productQueries.getAllGenres();
        console.log('Fetched genres:', genres);
        
        res.json(genres);
    } catch (error) {
        console.error('Full error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            number: error.number
        });
        
        res.status(500).json({ 
            message: 'Failed to fetch genres',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Debug route
router.get('/debug/genres', async (req, res) => {
    try {
        // Check if table exists
        const tableCheck = await executeQuery(`
            SELECT * 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Genres'
        `);

        // Get table structure
        const columnCheck = await executeQuery(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Genres'
        `);

        res.json({
            tableExists: tableCheck.recordset.length > 0,
            columns: columnCheck.recordset
        });
    } catch (error) {
        console.error('Debug route error:', error);
        res.status(500).json({ 
            message: 'Debug query failed',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get products by genre
router.get('/by-genre/:genreId', async (req, res) => {
    try {
        const { genreId } = req.params;
        console.log('Fetching products for genre:', genreId);
        
        const products = await productQueries.getProductsByGenre(genreId);
        
        console.log('Successfully fetched products:', products);
        res.json(products);
    } catch (error) {
        console.error('Full error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            number: error.number
        });
        
        res.status(500).json({ 
            message: 'Failed to fetch products',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Inventory route is already using executeQuery, no changes needed
router.get('/inventory', async (req, res) => {
    try {
        const data = await productQueries.getInventoryOverview();
        res.json(data);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ message: 'Failed to fetch inventory' });
    }
});

router.get('/all', async (req, res) => {
    try {
        const products = await productQueries.getAllProducts();
        res.json(products);
    } catch (error) {
        console.error('Error fetching all products:', error);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
});

router.post('/inventory', async (req, res) => {
    try {
        const { productId, quantity, productName } = req.body;
        
        if (!productId || !quantity) {
            return res.status(400).json({ message: 'Product ID and quantity are required' });
        }

        await productQueries.addInventoryItem(productId, quantity, productName);
        res.json({ message: 'Inventory item added successfully' });
    } catch (error) {
        console.error('Error adding inventory item:', error);
        res.status(500).json({ message: 'Failed to add inventory item' });
    }
});

router.delete('/inventory/:id', async (req, res) => {
    try {
        const inventoryId = parseInt(req.params.id);
        
        if (!inventoryId) {
            return res.status(400).json({ message: 'Invalid inventory ID' });
        }

        await productQueries.deleteInventoryItem(inventoryId);
        res.json({ message: 'Inventory item deleted successfully' });
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        res.status(500).json({ message: 'Failed to delete inventory item' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, description, price, genreId } = req.body;
        
        if (!name || !description || !price || !genreId) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        await productQueries.addProduct(name, description, price, genreId);
        res.json({ message: 'Product added successfully' });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Failed to add product' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        
        if (!productId) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        await productQueries.deleteProduct(productId);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Failed to delete product' });
    }
});

export default router;