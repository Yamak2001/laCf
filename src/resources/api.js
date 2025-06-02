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
  deleteAllProfiles() {
    return apiClient.delete('/api/voice-profiles/all?confirm=true')
  },
  
  // Audio processing
  processAudio(formData) {
    return apiClient.post('/api/audio/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // Benchmark models
  benchmarkModels(formData) {
    return apiClient.post('/api/audio/benchmark', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // Get available models
  getAvailableModels() {
    return apiClient.get('/api/audio/models')
  },
  
  // Visualization endpoints
  getAudioVisualization(audioPath, visualizationType = 'waveform') {
    // Remove leading slash if present
    const normalizedPath = audioPath.startsWith('/') ? audioPath.substring(1) : audioPath
    console.log('Requesting visualization:', { audioPath, normalizedPath, visualizationType })
    return apiClient.get('/api/audio/visualize', {
      params: {
        audio_path: normalizedPath,
        type: visualizationType
      }
    })
  },
  
  getProcessingVisualization(taskId) {
    return apiClient.get(`/api/audio/process/${taskId}/visualization`)
  },
  
  getComparisonVisualization(originalPath, isolatedPath, visualizationType = 'waveform') {
    // Remove leading slashes if present
    const normalizedOriginal = originalPath.startsWith('/') ? originalPath.substring(1) : originalPath
    const normalizedIsolated = isolatedPath.startsWith('/') ? isolatedPath.substring(1) : isolatedPath
    return apiClient.post('/api/audio/visualize/comparison', {
      original_audio: normalizedOriginal,
      isolated_audio: normalizedIsolated,
      type: visualizationType
    })
  },
  
  // Audio analysis endpoints
  getAudioAnalysis(audioPath) {
    // Remove leading slash if present
    const normalizedPath = audioPath.startsWith('/') ? audioPath.substring(1) : audioPath
    return apiClient.get('/api/audio/analyze', {
      params: { audio_path: normalizedPath }
    })
  },
  
  // Batch visualization for history
  getBatchVisualization(audioPaths) {
    // Remove leading slashes from all paths
    const normalizedPaths = audioPaths.map(path => 
      path.startsWith('/') ? path.substring(1) : path
    )
    return apiClient.post('/api/audio/visualize/batch', {
      audio_paths: normalizedPaths
    })
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