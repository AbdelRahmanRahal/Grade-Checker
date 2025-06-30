/**
 * API client for grades operations
 * @module api/grades
 */

/**
 * Fetches grades from the backend using session cookies
 * @async
 * @function fetchGrades
 * @param {Object} params - Request parameters
 * @param {Array} params.cookies - Session cookies for authentication
 * @param {Array<string>} params.trackedCourses - List of course codes to track
 * @returns {Promise<Object>} Response object with grades data
 * @throws {Error} If grade fetch fails
 */
export const fetchGrades = async ({ cookies, trackedCourses }) => {
  try {
    const response = await fetch('http://localhost:3001/grades/fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cookies, trackedCourses }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch grades');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}