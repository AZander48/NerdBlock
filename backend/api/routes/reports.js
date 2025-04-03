import express from 'express';
import sql from 'mssql';
import { executeQuery } from '../utils/db.js';

const router = express.Router();

const reportQueries = {
    getShippingReports: async () => {
        try {
            const result = await executeQuery(`
                SELECT 
                    s.ShippingID,
                    s.TransactionID,
                    sub.FirstName + ' ' + sub.LastName as SubscriberName,
                    s.Date,
                    s.ShippingDuration,
                    t.TotalPrice as TransactionAmount
                FROM ShippingReport s
                JOIN Subscriber sub ON s.SubscriberID = sub.SubscriberID
                JOIN Transactions t ON s.TransactionID = t.TransactionID
                ORDER BY s.Date DESC
            `);
            return result.recordset;
        } catch (error) {
            console.error('Error fetching shipping reports:', error);
            throw error;
        }
    },

    getTransferReports: async () => {
        try {
            const result = await executeQuery(`
                SELECT 
                    tr.TransferReportID,
                    tr.Date,
                    tr.TransferSortingKey,
                    o.ProductID,
                    p.Name as ProductName,
                    o.Quantity as TransferQuantity,
                    s.City as DestinationStore
                FROM TransferReport tr
                JOIN Overstock o ON tr.TransferSortingKey = o.TransferSortingKey
                JOIN Products p ON o.ProductID = p.ProductID
                JOIN Stores s ON o.StoreID = s.StoreID
                ORDER BY tr.Date DESC
            `);
            return result.recordset;
        } catch (error) {
            console.error('Error fetching transfer reports:', error);
            throw error;
        }
    },

    getReportSummary: async () => {
        try {
            const result = await executeQuery(`
                SELECT 
                    (SELECT COUNT(*) FROM ShippingReport) as TotalShipments,
                    (SELECT AVG(CAST(ShippingDuration as FLOAT)) FROM ShippingReport) as AvgShippingDuration,
                    (SELECT COUNT(*) FROM TransferReport) as TotalTransfers,
                    (SELECT COUNT(DISTINCT SubscriberID) FROM ShippingReport) as UniqueCustomers
            `);
            return result.recordset[0];
        } catch (error) {
            console.error('Error fetching report summary:', error);
            throw error;
        }
    }
};

router.get('/shipping', async (req, res) => {
    try {
        const reports = await reportQueries.getShippingReports();
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch shipping reports' });
    }
});

router.get('/transfers', async (req, res) => {
    try {
        const reports = await reportQueries.getTransferReports();
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch transfer reports' });
    }
});

router.get('/summary', async (req, res) => {
    try {
        const summary = await reportQueries.getReportSummary();
        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch report summary' });
    }
});

export default router; 