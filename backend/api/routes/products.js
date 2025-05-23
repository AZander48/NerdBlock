import express from 'express';
import sql from 'mssql';
import { executeQuery, getConnection } from '../utils/db.js';

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

            await executeQuery(
                `DELETE FROM [Overstock] WHERE ProductID = @productId`,
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
    },

    transferInventoryToOverstock: async (inventoryId, storeId, quantity, transferSortingKey) => {
        const pool = await getConnection();
        const transaction = new sql.Transaction(pool);

        try {
            console.log('Starting transfer process with params:', {
                inventoryId,
                storeId,
                quantity,
                transferSortingKey
            });

            await transaction.begin();

            // Create a request object bound to the transaction
            const request = new sql.Request(transaction);

            // Get inventory item details
            const inventoryResult = await request
                .input('inventoryId', sql.Int, inventoryId)
                .query(`
                    SELECT i.ProductID, i.Quantity, i.ProductName 
                    FROM [Inventory] i 
                    WHERE i.InventoryID = @inventoryId
                `);

            if (!inventoryResult.recordset[0]) {
                throw new Error('Inventory item not found');
            }

            const inventoryItem = inventoryResult.recordset[0];

            if (inventoryItem.Quantity < quantity) {
                throw new Error('Insufficient quantity available for transfer');
            }

            // Generate a numeric transfer key if none is provided
            const finalTransferKey = transferSortingKey ? 
                parseInt(transferSortingKey.replace(/\D/g, '')) : // Remove non-digits and parse
                parseInt(new Date().getTime().toString().slice(-9)); // Use timestamp last 9 digits

            // Clear previous parameters and add new ones for overstock insert
            request.parameters = {};
            await request
                .input('productId', sql.Int, inventoryItem.ProductID)
                .input('storeId', sql.Int, storeId)
                .input('transferQuantity', sql.Int, quantity)
                .input('transferSortingKey', sql.Numeric(9), finalTransferKey)
                .query(`
                    INSERT INTO [Overstock] (ProductID, StoreID, Quantity, TransferSortingKey)
                    VALUES (@productId, @storeId, @transferQuantity, @transferSortingKey)
                `);

            // Create transfer report entry
            await request
                .input('transferDate', sql.DateTime, new Date())
                .input('transferKey', sql.Numeric(9), finalTransferKey)
                .query(`
                    INSERT INTO [TransferReport] (Date, TransferSortingKey)
                    VALUES (@transferDate, @transferKey)
                `);

            // Update Inventory quantity
            request.parameters = {};
            await request
                .input('updateQuantity', sql.Int, quantity)
                .input('updateInventoryId', sql.Int, inventoryId)
                .query(`
                    UPDATE [Inventory]
                    SET Quantity = Quantity - @updateQuantity
                    WHERE InventoryID = @updateInventoryId
                `);

            // Delete if quantity becomes 0
            request.parameters = {};
            await request
                .input('deleteInventoryId', sql.Int, inventoryId)
                .query(`
                    DELETE FROM [Inventory]
                    WHERE InventoryID = @deleteInventoryId AND Quantity <= 0
                `);

            await transaction.commit();
            return { success: true, transferKey: finalTransferKey };
        } catch (error) {
            if (transaction) {
                try {
                    await transaction.rollback();
                } catch (rollbackError) {
                    console.error('Error rolling back transaction:', rollbackError);
                }
            }
            console.error('Database error in transferInventoryToOverstock:', error);
            throw new Error('Failed to transfer inventory: ' + error.message);
        }
    },

    getAllStores: async () => {
        try {
            const result = await executeQuery(`
                SELECT 
                    CAST(s.[StoreID] as INT) as StoreID,
                    s.[City],
                    s.[StreetAddress]
                FROM [Stores] s
                ORDER BY s.[City], s.[StreetAddress]
            `);
            return result.recordset;
        } catch (error) {
            console.error('Database error in getAllStores:', error);
            throw error;
        }
    },

    deleteOverstockItem: async (overstockId) => {
        const pool = await getConnection();
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();
            const request = new sql.Request(transaction);

            // Get the transfer sorting key first
            const keyResult = await request
                .input('overstockId', sql.Int, overstockId)
                .query(`
                    SELECT TransferSortingKey 
                    FROM [Overstock] 
                    WHERE OverstockID = @overstockId
                `);

            if (keyResult.recordset.length > 0) {
                const transferKey = keyResult.recordset[0].TransferSortingKey;

                // Delete both records in a single transaction
                await request
                    .input('transferKey', sql.Numeric(9), transferKey)
                    .query(`
                        BEGIN
                            DELETE FROM [TransferReport] 
                            WHERE TransferSortingKey = @transferKey;

                            DELETE FROM [Overstock] 
                            WHERE OverstockID = @overstockId;
                        END
                    `);
            } else {
                // If no key found, just delete the overstock record
                await request.query(`
                    DELETE FROM [Overstock] 
                    WHERE OverstockID = @overstockId
                `);
            }

            await transaction.commit();
            return { success: true };
        } catch (error) {
            if (transaction) {
                try {
                    await transaction.rollback();
                } catch (rollbackError) {
                    console.error('Error rolling back transaction:', rollbackError);
                }
            }
            console.error('Database error in deleteOverstockItem:', error);
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

router.get('/stores', async (req, res) => {
    try {
        const stores = await productQueries.getAllStores();
        res.json(stores);
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to fetch stores',
            error: error.message
        });
    }
});

router.post('/inventory/transfer', async (req, res) => {
    try {
        const { inventoryId, storeId, quantity, transferSortingKey } = req.body;
        
        if (!inventoryId || !storeId || !quantity) {
            return res.status(400).json({ message: 'Missing required fields: inventoryId, storeId, or quantity' });
        }

        await productQueries.transferInventoryToOverstock(
            parseInt(inventoryId),
            parseInt(storeId),
            parseInt(quantity),
            transferSortingKey // This can now be undefined or null
        );

        res.json({ message: 'Transfer successful' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to transfer inventory',
            error: error.message
        });
    }
});

router.delete('/overstock/:id', async (req, res) => {
    try {
        const overstockId = parseInt(req.params.id);
        
        if (!overstockId) {
            return res.status(400).json({ message: 'Invalid overstock ID' });
        }

        await productQueries.deleteOverstockItem(overstockId);
        res.json({ message: 'Overstock item deleted successfully' });
    } catch (error) {
        console.error('Error deleting overstock item:', error);
        res.status(500).json({ 
            message: 'Failed to delete overstock item',
            error: error.message 
        });
    }
});

export default router;