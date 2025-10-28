import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'

// Components
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Interview from './pages/Interview'
import InterviewSession from './pages/InterviewSession'
import InterviewResults from './pages/InterviewResults'
import Analytics from './pages/Analytics'
import Gamification from './pages/Gamification'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore()

  // Check authentication on app startup
  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        
        <main className="flex-grow pt-16">
          <Routes>
            {/* Public routes */}
            <Route 
              path="/" 
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Home />} 
            />
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
            />
            <Route 
              path="/register" 
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} 
            />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interviews"
              element={
                <ProtectedRoute>
                  <Interview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/:id"
              element={
                <ProtectedRoute>
                  <InterviewSession />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/:id/results"
              element={
                <ProtectedRoute>
                  <InterviewResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gamification"
              element={
                <ProtectedRoute>
                  <Gamification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <Footer />

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10b981',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App