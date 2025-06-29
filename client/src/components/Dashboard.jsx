import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import GradeTable from './GradeTable'
import CourseForm from './CourseForm'
import { fetchGrades } from '../api/grades'

export default function Dashboard({ credentials, setAuthenticated }) {
  const [grades, setGrades] = useState(null)
  const [trackedCourses, setTrackedCourses] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [refreshInterval, setRefreshInterval] = useState(30) // Default 30 minutes
  const [isAutoRefresh, setIsAutoRefresh] = useState(false)
  const [nextRefresh, setNextRefresh] = useState(null)
  const autoRefreshEnabled = useRef(false) // To track if auto-refresh is enabled to avoid multiple setups
  const refreshTimer = useRef(null)

  // Load tracked courses and interval settings from localStorage on initial render
  useEffect(() => {
    const savedCourses = localStorage.getItem('trackedCourses')
    if (savedCourses) {
      setTrackedCourses(JSON.parse(savedCourses))
    }

    const savedInterval = localStorage.getItem('refreshInterval')
    if (savedInterval) {
      setRefreshInterval(parseInt(savedInterval))
    }
  }, [])

  const handleLogout = () => {
    setAuthenticated(false)
    setIsAutoRefresh(false)
    if (refreshTimer.current) clearInterval(refreshTimer.current)
    toast.success('Logged out successfully')
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      const authCookies = JSON.parse(sessionStorage.getItem('authCookies'))
      if (!authCookies) {
        throw new Error('Session expired. Please login again.')
      }

      const response = await fetchGrades({
        cookies: authCookies,
        trackedCourses
      })

      if (response.success) {
        setGrades({
          gpa: response.gpa,
          creditHours: response.creditHours,
          courses: response.courses
        })
        setLastUpdated(new Date())

        // Show notification for new grades
        if (response.newGrades.length > 0) {
          response.newGrades.forEach(course => {
            toast.success(`New grade for ${course.code}: ${course.grade}`, {
              autoClose: false,
              closeOnClick: false
            })
          })
        }

        if (!grades) {
          toast.success('Grades loaded successfully')
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch grades')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle auto-refresh
  useEffect(() => {
    if (isAutoRefresh && !autoRefreshEnabled.current) {
      autoRefreshEnabled.current = true
      
      // Immediate first refresh when enabling auto-refresh
      handleRefresh()
      
      // Set up interval
      const intervalMs = refreshInterval * 60 * 1000
      refreshTimer.current = setInterval(() => {
        handleRefresh()
      }, intervalMs)

      // Calculate next refresh time
      const now = new Date()
      const next = new Date(now.getTime() + intervalMs)
      setNextRefresh(next)
    } else if (!isAutoRefresh && autoRefreshEnabled.current) {
      autoRefreshEnabled.current = false
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current)
        refreshTimer.current = null
      }
    }

    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current)
      }
    }
  }, [isAutoRefresh, refreshInterval])

  // Update next refresh time display
  useEffect(() => {
    let timeout
    if (nextRefresh) {
      const updateNextRefreshDisplay = () => {
        const now = new Date()
        const diff = nextRefresh - now
        if (diff > 0) {
          const minutes = Math.floor(diff / 60000)
          const seconds = Math.floor((diff % 60000) / 1000)
          timeout = setTimeout(updateNextRefreshDisplay, 1000)
        }
      }
      updateNextRefreshDisplay()
    }
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [nextRefresh])

  const handleIntervalChange = (e) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setRefreshInterval(value)
      localStorage.setItem('refreshInterval', value.toString())
    }
  }

  const toggleAutoRefresh = () => {
    const newState = !isAutoRefresh
    setIsAutoRefresh(newState)
    if (newState) {
      toast.info(`Auto-refresh enabled (every ${refreshInterval} minutes)`)
    } else {
      toast.info('Auto-refresh disabled')
    }
  }

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

      {/* Always show the controls section */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">Grade Tracker Controls</h2>
            {lastUpdated && (
              <p className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
            {nextRefresh && isAutoRefresh && (
              <p className="text-sm text-gray-500">
                Next refresh: {nextRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleAutoRefresh}
              className={`py-2 px-4 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                isAutoRefresh 
                  ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500'
              }`}
            >
              {isAutoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-blue-600 text-white py-2 px-4 rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Refreshing...' : 'Refresh Now'}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {grades ? (
            <>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500">Cumulative GPA</p>
                <p className="text-3xl font-bold">{grades.gpa}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500">Total Credit Hours</p>
                <p className="text-3xl font-bold">{grades.creditHours}</p>
              </div>
            </>
          ) : (
            <div className="col-span-2 text-center py-4">
              <p className="text-gray-500">
                {trackedCourses.length > 0 
                  ? "Click 'Refresh Now' to fetch your grades" 
                  : "Add courses to track and then refresh"}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Auto-refresh Interval (minutes)
          </label>
          <input
            type="number"
            min="1"
            value={refreshInterval}
            onChange={handleIntervalChange}
            disabled={isAutoRefresh}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {
            isAutoRefresh ? (
              <p className="text-xs text-gray-500 mt-1">
                Disable auto-refresh to change interval
              </p>
            ) : (
              <p className="text-xs text-red-600 mt-1">
                Hot tip: Don't set this too low, as it may lead to rate limiting from the server, or unexpected behavior from the code.
              </p>
            )
          }
        </div>
      </div>

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