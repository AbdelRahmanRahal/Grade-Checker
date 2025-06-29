import { useState } from 'react'
import { toast } from 'react-toastify'

export default function CourseForm({ trackedCourses, setTrackedCourses }) {
  const [courseCode, setCourseCode] = useState('')

  const handleAddCourse = (e) => {
    e.preventDefault()
    
    if (!courseCode.trim()) {
      toast.error('Please enter a course code')
      return
    }
    
    const normalizedCode = courseCode.trim().toUpperCase()
    
    if (trackedCourses.includes(normalizedCode)) {
      toast.error('This course is already being tracked')
      return
    }
    
    const newCourses = [...trackedCourses, normalizedCode]
    setTrackedCourses(newCourses)
    localStorage.setItem('trackedCourses', JSON.stringify(newCourses))
    setCourseCode('')
    toast.success(`Added course ${normalizedCode}`)
  }

  const handleRemoveCourse = (codeToRemove) => {
    const newCourses = trackedCourses.filter(code => code !== codeToRemove)
    setTrackedCourses(newCourses)
    localStorage.setItem('trackedCourses', JSON.stringify(newCourses))
    toast.success(`Removed course ${codeToRemove}`)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Track Courses</h2>
      
      <form onSubmit={handleAddCourse} className="flex gap-2 mb-4">
        <input
          type="text"
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value)}
          placeholder="Enter course code (e.g., CSCI101)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Course
        </button>
      </form>
      
      {trackedCourses.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Currently Tracked Courses</h3>
          <div className="flex flex-wrap gap-2">
            {trackedCourses.map((code) => (
              <div 
                key={code} 
                className="flex items-center bg-gray-100 px-3 py-1 rounded-full"
              >
                <span className="mr-2">{code}</span>
                <button 
                  onClick={() => handleRemoveCourse(code)}
                  className="text-gray-500 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}