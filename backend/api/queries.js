import express from 'express';
import authRoutes from './routes/auth.js';
import analyticsRoutes from './routes/analytics.js';
import productsRoutes from './routes/products.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import countriesRoutes from './routes/countries.js';
import employeeAuthRoutes from './routes/employeeAuth.js';

const router = express.Router();

// Mount the routes
router.use('/auth', authRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/products', productsRoutes);
router.use('/subscriptions', subscriptionsRoutes);
router.use('/countries', countriesRoutes);
router.use('/employee-auth', employeeAuthRoutes);

export default router; 