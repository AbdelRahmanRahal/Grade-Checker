/**
 * Displays a table of course grades with loading state handling.
 * @component
 * @param {Object} props - Component props
 * @param {Object|null} props.grades - Grades data including courses array
 * @param {Array<string>} props.trackedCourses - List of course codes being tracked
 * @param {boolean} props.isLoading - Loading state indicator
 * @returns {JSX.Element} Responsive table displaying course grades
 */
export default function GradeTable({ grades, trackedCourses, isLoading }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Course Grades</h2>
      
      {isLoading ? (
        // Loading state
        <div className="text-center py-8">
          <p>Loading grades...</p>
        </div>
      ) : (
        // Grades table
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trackedCourses.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                    No courses tracked yet. Add courses above to see grades.
                  </td>
                </tr>
              ) : (
                // Course rows
                trackedCourses.map((courseCode) => {
                  const course = grades?.courses?.find(c => c.code === courseCode)
                  return (
                    <tr key={courseCode}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{courseCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        {course?.grade || '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}