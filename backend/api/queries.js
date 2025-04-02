import express from 'express';
import authRoutes from './routes/auth.js';
import analyticsRoutes from './routes/analytics.js';
import productsRoutes from './routes/products.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import countriesRoutes from './routes/countries.js';

const router = express.Router();

// Mount the routes
router.use('/auth', authRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/products', productsRoutes);
router.use('/subscriptions', subscriptionsRoutes);
router.use('/countries', countriesRoutes);

// Export the queryApi object for frontend use
export const queryApi = {
    createSubscriber: (subscriberData) => createSubscriber(subscriberData),
    getCurrentSubscriber: async () => {
        const response = await fetch('/api/auth/current');
        if (!response.ok) return null;
        return response.json();
    },
    async loginSubscriber(loginData) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(loginData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }

        return response.json();
    }
};

export default router; 