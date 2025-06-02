<template>
  <div class="simple-audio-graph">
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 100px;">
      <v-progress-circular 
        indeterminate 
        size="24" 
        width="2" 
        color="primary"
      ></v-progress-circular>
    </div>
    
    <div v-else-if="error" class="text-center text-caption text-grey pa-2">
      <v-icon size="small" class="mb-1">mdi-alert-circle-outline</v-icon>
      <div>{{ error }}</div>
      <div v-if="audioPath" class="text-caption mt-1">
        Path: {{ audioPath }}
      </div>
    </div>
    
    <div v-else-if="imageUrl" class="graph-container">
      <img 
        :src="imageUrl" 
        :alt="graphType + ' visualization'"
        class="graph-image"
        @error="handleImageError"
        @load="handleImageLoad"
      />
    </div>
    
    <canvas 
      v-else-if="graphData"
      ref="graphCanvas" 
      :style="{ width: '100%', height: canvasHeight + 'px' }"
    ></canvas>
    
    <!-- Debug info - remove in production -->
    <div v-else class="text-center text-caption text-grey pa-2">
      <v-icon size="small" class="mb-1">mdi-help-circle-outline</v-icon>
      <div>No visualization data</div>
      <div v-if="audioPath" class="text-caption mt-1">
        Waiting for: {{ audioPath }}
      </div>
    </div>
  </div>
</template>

<script>
import API from '../resources/api.js'

export default {
  name: 'SimpleAudioGraph',
  props: {
    audioPath: {
      type: String,
      required: true
    },
    graphType: {
      type: String,
      default: 'waveform',
      validator: value => ['waveform', 'spectrogram', 'frequency'].includes(value)
    },
    height: {
      type: Number,
      default: 100
    },
    color: {
      type: String,
      default: '#1976d2'
    }
  },
  data() {
    return {
      loading: false,
      error: null,
      imageUrl: null,
      graphData: null
    }
  },
  computed: {
    canvasHeight() {
      return this.height
    }
  },
  watch: {
    audioPath: {
      immediate: true,
      handler() {
        this.loadGraph()
      }
    },
    graphType() {
      this.loadGraph()
    }
  },
  methods: {
    async loadGraph() {
      if (!this.audioPath) return
      
      this.loading = true
      this.error = null
      this.imageUrl = null
      this.graphData = null
      
      try {
        const response = await API.getAudioVisualization(this.audioPath, this.graphType)
        
        console.log('Visualization response:', response.data) // Debug log
        
        // Check if response is just a string (base64 data directly)
        if (typeof response.data === 'string') {
          // Backend might be returning base64 string directly
          if (response.data.startsWith('data:image')) {
            this.imageUrl = response.data
          } else {
            this.imageUrl = `data:image/png;base64,${response.data}`
          }
        } else if (response.data && response.data.type === 'image') {
          // If backend returns base64 image
          // Ensure it has the proper data URL prefix
          if (response.data.data.startsWith('data:image')) {
            this.imageUrl = response.data.data
          } else {
            // Add data URL prefix if missing
            this.imageUrl = `data:image/png;base64,${response.data.data}`
          }
        } else if (response.data && response.data.type === 'url') {
          // If backend returns image URL
          this.imageUrl = API.getFileUrl(response.data.data)
        } else if (response.data && response.data.type === 'data') {
          // If backend returns raw data
          this.graphData = response.data.data
          this.$nextTick(() => this.renderGraph())
        } else {
          // Handle unexpected response format
          console.error('Unexpected visualization response format:', response.data)
          this.error = 'Unexpected visualization format'
        }
      } catch (error) {
        console.error('Error loading graph:', error)
        this.error = 'Failed to load visualization'
      } finally {
        this.loading = false
      }
    },
    
    handleImageError(event) {
      console.error('Image failed to load:', event, this.imageUrl)
      this.error = 'Failed to load image'
    },
    
    handleImageLoad(event) {
      console.log('Image loaded successfully:', event.target.src.substring(0, 50) + '...')
    },
    
    renderGraph() {
      const canvas = this.$refs.graphCanvas
      if (!canvas || !this.graphData) return
      
      const ctx = canvas.getContext('2d')
      const rect = canvas.getBoundingClientRect()
      
      // Set actual canvas size
      canvas.width = rect.width
      canvas.height = this.canvasHeight
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      if (this.graphType === 'waveform') {
        this.drawWaveform(ctx, canvas.width, canvas.height)
      } else if (this.graphType === 'frequency') {
        this.drawFrequencyBars(ctx, canvas.width, canvas.height)
      }
    },
    
    drawWaveform(ctx, width, height) {
      if (!this.graphData.samples) return
      
      const samples = this.graphData.samples
      const step = width / samples.length
      const centerY = height / 2
      
      ctx.strokeStyle = this.color
      ctx.lineWidth = 1
      ctx.beginPath()
      
      for (let i = 0; i < samples.length; i++) {
        const x = i * step
        const y = centerY - (samples[i] * centerY * 0.8)
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      
      ctx.stroke()
      
      // Draw center line
      ctx.strokeStyle = '#e0e0e0'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(0, centerY)
      ctx.lineTo(width, centerY)
      ctx.stroke()
    },
    
    drawFrequencyBars(ctx, width, height) {
      if (!this.graphData.frequencies) return
      
      const frequencies = this.graphData.frequencies
      const barWidth = Math.max(1, width / frequencies.length - 1)
      const maxValue = Math.max(...frequencies)
      
      ctx.fillStyle = this.color
      
      frequencies.forEach((value, i) => {
        const x = i * (barWidth + 1)
        const barHeight = (value / maxValue) * height * 0.9
        const y = height - barHeight
        
        ctx.fillRect(x, y, barWidth, barHeight)
      })
    }
  },
  mounted() {
    // Re-render on window resize
    this.resizeObserver = new ResizeObserver(() => {
      if (this.graphData) {
        this.renderGraph()
      }
    })
    this.resizeObserver.observe(this.$el)
  },
  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
  }
}
</script>

<style scoped>
.simple-audio-graph {
  width: 100%;
  position: relative;
  min-height: 60px; /* Ensure minimum height */
}

.graph-container {
  width: 100%;
  overflow: hidden;
  background-color: #f5f5f5; /* Add background to see if container is visible */
  min-height: 60px;
}

.graph-image {
  width: 100%;
  height: auto;
  display: block;
  max-width: 100%; /* Ensure image doesn't overflow */
}
</style>