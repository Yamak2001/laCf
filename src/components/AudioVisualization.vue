<template>
  <v-card>
    <v-card-title>
      <v-icon start>mdi-chart-line</v-icon>
      Audio Visualization
    </v-card-title>
    
    <v-card-text>
      <!-- Visualization Type Selector -->
      <v-tabs v-model="activeVisualization" class="mb-4">
        <v-tab value="waveform">Waveform</v-tab>
        <v-tab value="spectrogram">Spectrogram</v-tab>
        <v-tab value="frequency">Frequency Spectrum</v-tab>
        <v-tab value="frequency_response">Frequency Response</v-tab>
        <v-tab value="comparison" v-if="comparisonAudioPath">Comparison</v-tab>
      </v-tabs>
      
      <!-- Visualization Container -->
      <v-window v-model="activeVisualization">
        <v-window-item value="waveform">
          <div v-if="loading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-2">Loading waveform...</p>
          </div>
          <div v-else-if="visualizationData.waveform" class="visualization-container">
            <img 
              v-if="visualizationData.waveform.type === 'image'" 
              :src="visualizationData.waveform.data" 
              alt="Audio Waveform"
              class="visualization-image"
            />
            <canvas 
              v-else 
              ref="waveformCanvas" 
              class="visualization-canvas"
            ></canvas>
          </div>
        </v-window-item>
        
        <v-window-item value="spectrogram">
          <div v-if="loading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-2">Loading spectrogram...</p>
          </div>
          <div v-else-if="visualizationData.spectrogram" class="visualization-container">
            <img 
              v-if="visualizationData.spectrogram.type === 'image'" 
              :src="visualizationData.spectrogram.data" 
              alt="Audio Spectrogram"
              class="visualization-image"
            />
            <canvas 
              v-else 
              ref="spectrogramCanvas" 
              class="visualization-canvas"
            ></canvas>
          </div>
        </v-window-item>
        
        <v-window-item value="frequency">
          <div v-if="loading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-2">Loading frequency spectrum...</p>
          </div>
          <div v-else-if="visualizationData.frequency" class="visualization-container">
            <img 
              v-if="visualizationData.frequency.type === 'image'" 
              :src="visualizationData.frequency.data" 
              alt="Frequency Spectrum"
              class="visualization-image"
            />
            <canvas 
              v-else 
              ref="frequencyCanvas" 
              class="visualization-canvas"
            ></canvas>
          </div>
        </v-window-item>
        
        <v-window-item value="frequency_response">
          <div v-if="loading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-2">Loading frequency response curve...</p>
          </div>
          <div v-else-if="visualizationData.frequency_response" class="visualization-container">
            <img 
              v-if="visualizationData.frequency_response.type === 'image'" 
              :src="visualizationData.frequency_response.data" 
              alt="Frequency Response Curve"
              class="visualization-image"
            />
            <canvas 
              v-else 
              ref="frequencyResponseCanvas" 
              class="visualization-canvas"
            ></canvas>
          </div>
        </v-window-item>
        
        <v-window-item value="comparison" v-if="comparisonAudioPath">
          <div v-if="loading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-2">Loading comparison...</p>
          </div>
          <div v-else-if="visualizationData.comparison" class="visualization-container">
            <!-- Comparison Type Selector -->
            <v-btn-toggle v-model="comparisonType" class="mb-4" mandatory>
              <v-btn value="waveform">Waveform</v-btn>
              <v-btn value="frequency_response">Frequency Response</v-btn>
              <v-btn value="spectrogram">Spectrogram</v-btn>
            </v-btn-toggle>
            
            <div class="comparison-grid">
              <div>
                <h4 class="text-subtitle-2 mb-2">Original (Mixed Audio)</h4>
                <img 
                  v-if="getComparisonImage('original')" 
                  :src="getComparisonImage('original')" 
                  alt="Original Audio"
                  class="visualization-image"
                />
              </div>
              <div>
                <h4 class="text-subtitle-2 mb-2">Isolated Voice</h4>
                <img 
                  v-if="getComparisonImage('isolated')" 
                  :src="getComparisonImage('isolated')" 
                  alt="Isolated Audio"
                  class="visualization-image"
                />
              </div>
            </div>
            
            <!-- Comparison Info -->
            <v-alert 
              v-if="comparisonType === 'frequency_response'"
              type="info"
              density="compact"
              variant="tonal"
              class="mt-3"
            >
              <div class="text-caption">Frequency response comparison shows the spectral characteristics of both the original mixed audio and isolated voice, highlighting the effectiveness of voice isolation across different frequency ranges.</div>
            </v-alert>
          </div>
        </v-window-item>
      </v-window>
      
      <!-- Visualization Information -->
      <v-alert 
        v-if="visualizationInfo[activeVisualization]"
        type="info"
        density="compact"
        variant="tonal"
        class="mb-3"
      >
        <div class="text-caption">{{ visualizationInfo[activeVisualization] }}</div>
      </v-alert>
      
      <!-- Audio Analysis Metrics -->
      <v-card v-if="analysisData" class="mt-4" variant="outlined">
        <v-card-title class="text-subtitle-1">Audio Analysis</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="6" sm="3" v-for="(value, key) in analysisData" :key="key">
              <div class="text-caption text-grey">{{ formatMetricName(key) }}</div>
              <div class="text-body-2 font-weight-medium">{{ formatMetricValue(value, key) }}</div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
</template>

<script>
import API from '../resources/api.js'

export default {
  name: 'AudioVisualization',
  props: {
    audioPath: {
      type: String,
      required: true
    },
    comparisonAudioPath: {
      type: String,
      default: null
    },
    showAnalysis: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      activeVisualization: 'waveform',
      loading: false,
      visualizationData: {
        waveform: null,
        spectrogram: null,
        frequency: null,
        frequency_response: null,
        comparison: null
      },
      analysisData: null,
      error: null,
      comparisonType: 'waveform',
      visualizationInfo: {
        waveform: 'Time domain representation showing audio amplitude over time',
        spectrogram: 'Time-frequency representation showing how frequencies change over time',
        frequency: 'Frequency spectrum analysis showing magnitude in decibels (dB) across frequencies. Features logarithmic scale with focus on voice frequencies (80-4000 Hz)',
        frequency_response: 'Averaged frequency response curve highlighting important voice frequency regions: fundamentals (80-250 Hz), vowels (250-2000 Hz), and consonants (2000-4000 Hz)',
        comparison: 'Side-by-side visualization comparing original mixed audio with isolated voice'
      }
    }
  },
  watch: {
    audioPath: {
      immediate: true,
      handler() {
        this.loadVisualizations()
      }
    },
    activeVisualization(newVal) {
      this.loadVisualization(newVal)
    },
    comparisonType() {
      // Reload comparison with new type when changed
      if (this.activeVisualization === 'comparison') {
        this.visualizationData.comparison = null
        this.loadVisualization('comparison')
      }
    }
  },
  methods: {
    async loadVisualizations() {
      // Load the active visualization immediately
      await this.loadVisualization(this.activeVisualization)
      
      // Load analysis data if requested
      if (this.showAnalysis) {
        await this.loadAnalysis()
      }
    },
    
    async loadVisualization(type) {
      if (!this.audioPath) return
      
      // Skip if already loaded
      if (this.visualizationData[type]) return
      
      this.loading = true
      this.error = null
      
      try {
        if (type === 'comparison' && this.comparisonAudioPath) {
          const response = await API.getComparisonVisualization(
            this.audioPath,
            this.comparisonAudioPath,
            this.comparisonType
          )
          
          console.log('Comparison visualization response:', response.data) // Debug log
          
          // Process comparison data - handle both single type and multi-type responses
          if (response.data[this.comparisonType]) {
            // Multi-type response structure
            this.visualizationData.comparison = response.data
          } else {
            // Single type response structure (backward compatibility)
            const processedData = {}
            processedData[this.comparisonType] = {
              original: response.data.original,
              isolated: response.data.isolated
            }
            
            // Ensure proper base64 image format
            ['original', 'isolated'].forEach(key => {
              if (processedData[this.comparisonType][key] && !processedData[this.comparisonType][key].startsWith('data:image')) {
                processedData[this.comparisonType][key] = `data:image/png;base64,${processedData[this.comparisonType][key]}`
              }
            })
            
            this.visualizationData.comparison = processedData
          }
        } else if (type !== 'comparison') {
          const response = await API.getAudioVisualization(this.audioPath, type)
          
          console.log(`Visualization response for ${type}:`, response.data) // Debug log
          
          // Process the response based on type
          if (response.data.type === 'image' || response.data.data) {
            // Ensure base64 image has proper data URL prefix
            if (response.data.data && response.data.data.startsWith('data:image')) {
              this.visualizationData[type] = response.data
            } else if (response.data.data) {
              this.visualizationData[type] = {
                type: 'image',
                data: `data:image/png;base64,${response.data.data}`
              }
            } else {
              // For direct base64 response
              this.visualizationData[type] = {
                type: 'image',
                data: response.data.startsWith('data:image') ? response.data : `data:image/png;base64,${response.data}`
              }
            }
          } else {
            this.visualizationData[type] = response.data
            
            // If data is JSON (not image), render it on canvas
            this.$nextTick(() => {
              if (response.data.type === 'data') {
                this.renderVisualization(type, response.data.data)
              }
            })
          }
        }
      } catch (error) {
        console.error(`Error loading ${type} visualization:`, error)
        this.error = `Failed to load ${type} visualization`
      } finally {
        this.loading = false
      }
    },
    
    async loadAnalysis() {
      if (!this.audioPath) return
      
      try {
        const response = await API.getAudioAnalysis(this.audioPath)
        this.analysisData = response.data
      } catch (error) {
        console.error('Error loading audio analysis:', error)
      }
    },
    
    renderVisualization(type, data) {
      const canvas = this.$refs[`${type}Canvas`]
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      
      // Simple rendering logic - customize based on your backend data format
      if (type === 'waveform' && data.samples) {
        this.renderWaveform(ctx, canvas, data.samples)
      } else if (type === 'frequency' && data.frequencies) {
        this.renderFrequencySpectrum(ctx, canvas, data.frequencies)
      }
    },
    
    renderWaveform(ctx, canvas, samples) {
      const width = canvas.width = canvas.offsetWidth
      const height = canvas.height = 200
      
      ctx.clearRect(0, 0, width, height)
      ctx.strokeStyle = '#1976d2'
      ctx.lineWidth = 1
      
      ctx.beginPath()
      const step = width / samples.length
      
      for (let i = 0; i < samples.length; i++) {
        const x = i * step
        const y = (1 - samples[i]) * height / 2
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      
      ctx.stroke()
    },
    
    renderFrequencySpectrum(ctx, canvas, frequencies) {
      const width = canvas.width = canvas.offsetWidth
      const height = canvas.height = 200
      
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#1976d2'
      
      const barWidth = width / frequencies.length
      
      frequencies.forEach((freq, i) => {
        const barHeight = freq * height
        const x = i * barWidth
        const y = height - barHeight
        
        ctx.fillRect(x, y, barWidth - 1, barHeight)
      })
    },
    
    formatMetricName(key) {
      return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    },
    
    formatMetricValue(value, key) {
      if (typeof value === 'number') {
        if (key.includes('db') || key.includes('decibel')) {
          return `${value.toFixed(1)} dB`
        } else if (key.includes('percent') || key.includes('similarity')) {
          return `${(value * 100).toFixed(1)}%`
        } else if (key.includes('time') || key.includes('duration')) {
          return `${value.toFixed(2)}s`
        } else if (key.includes('frequency') || key.includes('hz')) {
          return `${value.toFixed(0)} Hz`
        }
        return value.toFixed(2)
      }
      return value
    },
    
    getComparisonImage(audioType) {
      if (!this.visualizationData.comparison) return null
      
      // Check if data has the current comparison type
      if (this.visualizationData.comparison[this.comparisonType]) {
        return this.visualizationData.comparison[this.comparisonType][audioType]
      }
      
      // Fallback to direct properties (backward compatibility)
      return this.visualizationData.comparison[audioType]
    }
  }
}
</script>

<style scoped>
.visualization-container {
  width: 100%;
  min-height: 200px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 16px;
  overflow: hidden;
}

.visualization-image {
  max-width: 100%;
  max-height: 350px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.visualization-canvas {
  width: 100%;
  max-width: 100%;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
  margin-top: 16px;
}

.comparison-grid .visualization-image {
  max-height: 250px;
}

@media (max-width: 600px) {
  .comparison-grid {
    grid-template-columns: 1fr;
  }
}
</style>