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
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
        const response = await fetch(`${API_BASE_URL}/subscriptions/plans`);
        if (!response.ok) {
            throw new Error('Failed to fetch subscription plans');
        }
        return response.json();
    },

    async getCurrentSubscriber() {
        const response = await fetch(`${API_BASE_URL}/auth/current`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        // Special handling for 401 (not logged in)
        if (response.status === 401) {
            return null; // Return null instead of throwing error for not logged in
        }

        // Handle other errors
        if (!response.ok) {
            throw new Error('Failed to fetch current subscriber');
        }

        return response.json();
    },

    getSubscriptionTypes: () => fetchQueryData('/subscriptions/types'),

    async createSubscription(subscriptionData) {
        const response = await fetch(`${API_BASE_URL}/subscriptions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(subscriptionData)
        });
        if (!response.ok) {
            throw new Error('Failed to create subscription');
        }
        return response.json();
    },

    async cancelSubscription(subscriptionId) {
        const response = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Failed to cancel subscription');
        }
        return response.json();
    },

    // Add other API methods here
}; 