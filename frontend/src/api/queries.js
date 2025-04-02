const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Fetches query data from the API
 * @param {string} endpoint - The query endpoint to fetch from
 * @returns {Promise<Object[]|null>} The query results or null if there's an error
 */
async function fetchQueryData(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching query data:', error);
        throw error; // Let the component handle the error
    }
}

/**
 * Registers a new subscriber
 * @param {Object} subscriberData - The subscriber registration data
 * @param {string} subscriberData.userName - Username
 * @param {string} subscriberData.firstName - Subscriber's first name
 * @param {string} subscriberData.lastName - Subscriber's last name
 * @param {string} subscriberData.email - Subscriber's email
 * @param {string} subscriberData.password - Subscriber's password
 * @returns {Promise<Object>} The registration result
 */
export async function registerSubscriber(subscriberData) {
    try {
        const response = await fetch(`${API_BASE_URL}/queries/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscriberData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Registration failed');
        }
        return await response.json();
    } catch (error) {
        console.error('Error registering subscriber:', error);
        throw error;
    }
}

export const queryApi = {
    getCountries: () => fetchQueryData('/countries'),
    getProducts: () => fetchQueryData('/products'),
    getSubscriptionAnalytics: () => fetchQueryData('subscription-analytics'),
    getRevenueAnalytics: () => fetchQueryData('revenue-analytics'),
    async registerSubscriber(subscriberData) {
        const response = await fetch(`${API_BASE_URL}/queries/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscriberData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Registration failed');
        }
        return await response.json();
    },
    async loginSubscriber(loginData) {
        const response = await fetch(`${API_BASE_URL}/subscribers/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                identifier: loginData.identifier,
                password: loginData.password
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }

        return response.json();
    },
    async logoutSubscriber() {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Logout failed');
        }

        return response.json();
    },

    async createSubscriber(subscriberData) {
        const response = await fetch(`${API_BASE_URL}/subscribers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscriberData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    },

    async getSubscriptionPlans() {
        try {
            const response = await fetch(`${API_BASE_URL}/subscriptions/plans`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch subscription plans');
            }

            return response.json();
        } catch (error) {
            console.error('Error fetching subscription plans:', error);
            throw error;
        }
    },

    async getCurrentSubscriber() {
        try {
            console.log('Fetching current subscriber...');
            const response = await fetch(`${API_BASE_URL}/subscribers/current`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                console.log('User not authenticated');
                return null;
            }

            if (!response.ok) {
                const error = await response.json();
                console.error('Error response:', error);
                throw new Error(error.message || 'Failed to fetch current subscriber');
            }

            const data = await response.json();
            console.log('Subscriber data:', data);
            return data;
        } catch (error) {
            console.error('getCurrentSubscriber error:', error);
            throw new Error('Error fetching subscriber data');
        }
    },

    getSubscriptionTypes: () => fetchQueryData('/subscriptions/types'),

    async createSubscription(subscriptionData) {
        try {
            const response = await fetch(`${API_BASE_URL}/subscriptions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(subscriptionData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create subscription');
            }

            return response.json();
        } catch (error) {
            console.error('Error creating subscription:', error);
            throw error;
        }
    },

    // Add other API methods here
}; 