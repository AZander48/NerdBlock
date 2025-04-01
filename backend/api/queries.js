import express from 'express';
import authRoutes from './routes/auth.js';
import analyticsRoutes from './routes/analytics.js';
import productsRoutes from './routes/products.js';
import subscriptionsRoutes from './routes/subscriptions.js';

const router = express.Router();

// Mount the routes
router.use('/auth', authRoutes);  // This mounts all auth routes under /api/auth
router.use('/analytics', analyticsRoutes);
router.use('/products', productsRoutes);
router.use('/subscriptions', subscriptionsRoutes);

// Export the queryApi object for frontend use
export const queryApi = {
    createSubscriber: (subscriberData) => createSubscriber(subscriberData),
    getCurrentSubscriber: async () => {
        const response = await fetch('/api/auth/current');
        if (!response.ok) return null;
        return response.json();
    },
};

export default router; 