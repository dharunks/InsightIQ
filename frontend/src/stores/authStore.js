import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api'
import toast from 'react-hot-toast'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Login action
      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/login', { email, password })
          const { token, user } = response.data

          // Set token in axios defaults
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          })

          toast.success('Welcome back!')
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          console.error('Login error:', error)
          
          let message = 'Login failed'
          if (error.code === 'ECONNABORTED') {
            message = 'Connection timeout. Please check your internet connection.'
          } else if (error.code === 'ERR_NETWORK') {
            message = 'Cannot connect to server. Please check if the backend is running.'
          } else if (error.response?.data?.message) {
            message = error.response.data.message
          } else if (error.message) {
            message = error.message
          }
          
          toast.error(message)
          return { success: false, error: message }
        }
      },

      // Register action
      register: async (userData) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/register', userData)
          const { token, user } = response.data

          // Set token in axios defaults
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          })

          toast.success('Account created successfully!')
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          console.error('Registration error:', error)
          
          let message = 'Registration failed'
          if (error.code === 'ECONNABORTED') {
            message = 'Connection timeout. Please check your internet connection.'
          } else if (error.code === 'ERR_NETWORK') {
            message = 'Cannot connect to server. Please check if the backend is running.'
          } else if (error.response?.data?.message) {
            message = error.response.data.message
          } else if (error.message) {
            message = error.message
          }
          
          toast.error(message)
          return { success: false, error: message }
        }
      },

      // Logout action
      logout: () => {
        // Remove token from axios defaults
        delete api.defaults.headers.common['Authorization']

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        })

        toast.success('Logged out successfully')
      },

      // Update user profile
      updateProfile: async (profileData) => {
        try {
          const response = await api.put('/auth/profile', profileData)
          const { user } = response.data

          set({ user })
          toast.success('Profile updated successfully!')
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to update profile'
          toast.error(message)
          return { success: false, error: message }
        }
      },

      // Check auth status (for app initialization)
      checkAuth: async () => {
        const { token } = get()
        
        if (!token) {
          return false
        }

        try {
          // Set token in axios defaults
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          const response = await api.get('/auth/me')
          const { user } = response.data

          set({
            user,
            isAuthenticated: true
          })

          return true
        } catch (error) {
          // Token is invalid, clear auth state
          get().logout()
          return false
        }
      },

      // Refresh token
      refreshToken: async () => {
        try {
          const response = await api.post('/auth/refresh')
          const { token } = response.data

          set({ token })
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          return true
        } catch (error) {
          get().logout()
          return false
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

export { useAuthStore }