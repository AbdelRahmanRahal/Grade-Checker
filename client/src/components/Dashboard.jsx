import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import GradeTable from './GradeTable'
import CourseForm from './CourseForm'

export default function Dashboard({ credentials, setAuthenticated }) {
  const [grades, setGrades] = useState(null)
  const [trackedCourses, setTrackedCourses] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Load tracked courses from localStorage on initial render
  useEffect(() => {
    const savedCourses = localStorage.getItem('trackedCourses')
    if (savedCourses) {
      setTrackedCourses(JSON.parse(savedCourses))
    }
  }, [])

  const handleLogout = () => {
    setAuthenticated(false)
    toast.success('Logged out successfully')
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      // This will be replaced with actual scraping later
      const mockGrades = {
        gpa: 3.8,
        creditHours: 45,
        courses: trackedCourses.map(course => ({
          code: course,
          name: `Course ${course}`,
          grade: ['A', 'B+', 'A-', 'B', 'A'][Math.floor(Math.random() * 5)] // Random grade for demo
        }))
      }
      
      setTimeout(() => {
        setGrades(mockGrades)
        setLastUpdated(new Date())
        setIsLoading(false)
        toast.success('Grades updated successfully')
      }, 1000)
    } catch (error) {
      toast.error('Failed to fetch grades')
      setIsLoading(false)
    }
  }

  // Auto-refresh every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (grades) {
        handleRefresh()
      }
    }, 30 * 60 * 1000) // 30 minutes
    
    return () => clearInterval(interval)
  }, [grades])

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Grade Dashboard</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 hover:text-red-800 transition-colors"
        >
          Logout
        </button>
      </div>

      {grades && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold">Academic Summary</h2>
              <p className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-blue-600 text-white py-2 px-4 rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500">Cumulative GPA</p>
              <p className="text-3xl font-bold">{grades.gpa}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500">Total Credit Hours</p>
              <p className="text-3xl font-bold">{grades.creditHours}</p>
            </div>
          </div>
        </div>
      )}

      <CourseForm 
        trackedCourses={trackedCourses} 
        setTrackedCourses={setTrackedCourses} 
      />

      <GradeTable 
        grades={grades} 
        trackedCourses={trackedCourses} 
        isLoading={isLoading} 
      />
    </div>
  )
}