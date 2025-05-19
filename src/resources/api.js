// src/resources/api.js
import axios from 'axios'

const baseURL = 'http://localhost:8000'
const apiClient = axios.create({
  baseURL,
  withCredentials: false,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})

export default {
  baseURL,
  
  // Voice profiles
  getProfiles() {
    return apiClient.get('/api/voice-profiles/')
  },
  getProfile(id) {
    return apiClient.get(`/api/voice-profiles/${id}`)
  },
  createProfile(formData) {
    return apiClient.post('/api/voice-profiles/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  updateProfile(id, profile) {
    return apiClient.put(`/api/voice-profiles/${id}`, profile)
  },
  deleteProfile(id) {
    return apiClient.delete(`/api/voice-profiles/${id}`)
  },
  
  // Audio processing
  processAudio(formData) {
    return apiClient.post('/api/audio/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // Get available models
  getAvailableModels() {
    return apiClient.get('/api/audio/models')
  },
  
  // Helper to get full URL for file paths
  getFileUrl(relativePath) {
    // Make sure path starts with a slash
    if (!relativePath.startsWith('/')) {
      relativePath = '/' + relativePath
    }
    return `${baseURL}${relativePath}`
  }
}