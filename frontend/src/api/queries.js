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
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(subscriberData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
        }
        return response.json();
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
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(subscriberData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
        }
        return response.json();
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
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Logout failed');
        }

        return response.json();
    },

    async createSubscriber(subscriberData) {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
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

    async changePassword(passwordData) {
        const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(passwordData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to change password');
        }

        return response.json();
    },

    async updateProfile(profileData) {
        const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update profile');
        }

        return response.json();
    },

    async getProductsByGenre(genreId) {
        const response = await fetch(`${API_BASE_URL}/products/by-genre/${genreId}`, {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        return response.json();
    },

    async getAllGenres() {
        const response = await fetch(`${API_BASE_URL}/products/genres`, {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to fetch genres');
        }
        return response.json();
    },

    getInventoryOverview: async () => {
        const response = await fetch(`${API_BASE_URL}/products/inventory`, {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to fetch inventory');
        }
        return response.json();
    },

    // Employee authentication methods
    loginEmployee: async (credentials) => {
        try {
            const response = await fetch(`${API_BASE_URL}/employee-auth/login`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(credentials)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }
            
            return response.json();
        } catch (error) {
            console.error('Employee login error:', error);
            throw error;
        }
    },

    getCurrentEmployee: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/employee-auth/current`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    return null;
                }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch employee details');
            }
            
            return response.json();
        } catch (error) {
            console.error('Get current employee error:', error);
            throw error;
        }
    },

    logoutEmployee: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/employee-auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Logout failed');
            }
            
            return response.json();
        } catch (error) {
            console.error('Employee logout error:', error);
            throw error;
        }
    },

    // Add these new methods
    getReportSummary: () => fetchQueryData('/reports/summary'),
    getShippingReports: () => fetchQueryData('/reports/shipping'),
    getTransferReports: () => fetchQueryData('/reports/transfers'),

    getAllProducts: async () => {
        const response = await fetch(`${API_BASE_URL}/products/all`, {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        return response.json();
    },

    addInventoryItem: async (inventoryData) => {
        const response = await fetch(`${API_BASE_URL}/products/inventory`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(inventoryData)
        });
        if (!response.ok) {
            throw new Error('Failed to add inventory item');
        }
        return response.json();
    },

    deleteInventoryItem: async (inventoryId) => {
        const response = await fetch(`${API_BASE_URL}/products/inventory/${inventoryId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to delete inventory item');
        }
        return response.json();
    },

    addProduct: async (productData) => {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(productData)
        });
        if (!response.ok) {
            throw new Error('Failed to add product');
        }
        return response.json();
    },

    deleteProduct: async (productId) => {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to delete product');
        }
        return response.json();
    },

    getAllStores: async () => {
        const response = await fetch(`${API_BASE_URL}/products/stores`, {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to fetch stores');
        }
        return response.json();
    },

    transferInventoryToOverstock: async (transferData) => {
        const response = await fetch(`${API_BASE_URL}/products/inventory/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(transferData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to transfer inventory');
        }
        return response.json();
    },

    deleteOverstockItem: async (overstockId) => {
        const response = await fetch(`${API_BASE_URL}/products/overstock/${overstockId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to delete overstock item');
        }
        return response.json();
    },

    getSubscriberShippingHistory: async () => {
        try {
            // First check if user is logged in
            const currentSubscriber = await queryApi.getCurrentSubscriber();
            if (!currentSubscriber) {
                window.location.href = '/subscriberLogin';
                return null;
            }

            const response = await fetch(`${API_BASE_URL}/reports/subscriber/shipping`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch shipping history');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in getSubscriberShippingHistory:', error);
            throw error;
        }
    }
}; 