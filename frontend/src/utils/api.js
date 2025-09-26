import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Token will be set by auth store
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - token might be expired
      // The auth store will handle this
      const event = new CustomEvent('unauthorized')
      window.dispatchEvent(event)
    }

    if (error.response?.status === 429) {
      // Rate limited
      console.warn('Rate limited:', error.response.data.message)
    }

    if (error.code === 'ECONNABORTED') {
      // Request timeout
      error.message = 'Request timeout. Please check your connection.'
    }

    if (!error.response) {
      // Network error
      error.message = 'Network error. Please check your connection.'
    }

    return Promise.reject(error)
  }
)

export default api