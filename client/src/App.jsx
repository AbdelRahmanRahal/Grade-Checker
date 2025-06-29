import { useState, useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import AuthForm from './components/AuthForm'
import Dashboard from './components/Dashboard'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [credentials, setCredentials] = useState({ username: '', password: '' })

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <ToastContainer position="top-right" />
      <div className="container mx-auto p-4">
        {!isAuthenticated ? (
          <AuthForm
            setAuthenticated={setIsAuthenticated}
            credentials={credentials}
            setCredentials={setCredentials}
          />
        ) : (
          <Dashboard
            credentials={credentials}
            setAuthenticated={setIsAuthenticated}
          />
        )}
      </div>
    </div>
  )
}
