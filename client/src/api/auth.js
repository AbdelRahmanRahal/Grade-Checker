/**
 * API client for authentication operations
 * @module api/auth
 */

/**
 * Authenticates with the backend using provided credentials
 * @async
 * @function login
 * @param {Object} credentials - User credentials
 * @param {string} credentials.username - University username
 * @param {string} credentials.password - University password
 * @returns {Promise<Object>} Response object with success status and cookies
 * @throws {Error} If authentication fails
 */
export const login = async (credentials) => {
  try {
    const response = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
