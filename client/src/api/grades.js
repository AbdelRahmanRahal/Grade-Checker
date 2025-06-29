export const fetchGrades = async ({ cookies, trackedCourses }) => {
  try {
    const response = await fetch('http://localhost:3001/grades/fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cookies, trackedCourses }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch grades')
    }

    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}