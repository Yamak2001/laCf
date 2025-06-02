<template>
  <v-card>
    <v-card-title>
      <v-icon start>mdi-chart-timeline-variant</v-icon>
      Processing Metrics
    </v-card-title>
    
    <v-card-text>
      <!-- Summary Stats -->
      <v-row dense class="mb-4">
        <v-col cols="12" md="3">
          <v-card variant="tonal" color="primary">
            <v-card-text class="text-center">
              <div class="text-h4">{{ formatTime(metrics.timings?.total || 0) }}</div>
              <div class="text-caption">Total Processing Time</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="3">
          <v-card variant="tonal" color="success">
            <v-card-text class="text-center">
              <div class="text-h4">{{ processingSpeed }}x</div>
              <div class="text-caption">Processing Speed</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="3">
          <v-card variant="tonal" color="info">
            <v-card-text class="text-center">
              <div class="text-h4">{{ bestSimilarity }}%</div>
              <div class="text-caption">Match Confidence</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="3">
          <v-card variant="tonal" color="warning">
            <v-card-text class="text-center">
              <div class="text-h4">{{ formatFileSize(totalDataProcessed) }}</div>
              <div class="text-caption">Data Processed</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Timing Breakdown -->
      <v-expansion-panels v-model="expandedPanels" multiple>
        <v-expansion-panel value="timings">
          <v-expansion-panel-title>
            <v-icon start size="small">mdi-timer-outline</v-icon>
            Timing Breakdown
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list dense>
              <v-list-item v-for="(time, key) in sortedTimings" :key="key">
                <template v-slot:prepend>
                  <v-icon :icon="getTimingIcon(key)" size="small"></v-icon>
                </template>
                
                <v-list-item-title>{{ formatTimingLabel(key) }}</v-list-item-title>
                
                <template v-slot:append>
                  <div class="text-right">
                    <div class="text-body-2">{{ formatTime(time) }}</div>
                    <div class="text-caption text-grey">{{ getTimingPercentage(time) }}%</div>
                  </div>
                </template>
                
                <v-progress-linear
                  :model-value="getTimingPercentage(time)"
                  :color="getTimingColor(key)"
                  height="2"
                  class="mt-1"
                ></v-progress-linear>
              </v-list-item>
            </v-list>
            
            <!-- Performance Ratios -->
            <v-divider class="my-3"></v-divider>
            <v-row dense>
              <v-col cols="6">
                <div class="text-caption text-grey">Separation Overhead</div>
                <div class="text-body-2">
                  {{ (metrics.summary?.separation_to_total_ratio * 100).toFixed(1) }}%
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-grey">Matching Overhead</div>
                <div class="text-body-2">
                  {{ (metrics.summary?.matching_to_total_ratio * 100).toFixed(1) }}%
                </div>
              </v-col>
            </v-row>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Audio Information -->
        <v-expansion-panel value="audio">
          <v-expansion-panel-title>
            <v-icon start size="small">mdi-waveform</v-icon>
            Audio Information
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-row dense>
              <v-col cols="6" md="3">
                <div class="text-caption text-grey">Duration</div>
                <div class="text-body-2">{{ formatTime(metrics.audio_info?.duration_seconds || 0) }}</div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-caption text-grey">Sample Rate</div>
                <div class="text-body-2">{{ (metrics.audio_info?.sample_rate || 0).toLocaleString() }} Hz</div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-caption text-grey">Total Samples</div>
                <div class="text-body-2">{{ (metrics.audio_info?.num_samples || 0).toLocaleString() }}</div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-caption text-grey">Sources Found</div>
                <div class="text-body-2">{{ metrics.result?.num_sources_separated || 0 }}</div>
              </v-col>
            </v-row>
            
            <v-divider class="my-3"></v-divider>
            
            <!-- File Sizes -->
            <div class="text-subtitle-2 mb-2">File Sizes</div>
            <v-row dense>
              <v-col cols="4">
                <div class="text-caption text-grey">Input Audio</div>
                <div class="text-body-2">{{ formatFileSize(metrics.file_sizes?.mixed_audio || 0) }}</div>
              </v-col>
              <v-col cols="4">
                <div class="text-caption text-grey">Output Audio</div>
                <div class="text-body-2">{{ formatFileSize(metrics.file_sizes?.isolated_audio || 0) }}</div>
              </v-col>
              <v-col cols="4">
                <div class="text-caption text-grey">Profile Embedding</div>
                <div class="text-body-2">{{ formatFileSize(metrics.file_sizes?.embedding || 0) }}</div>
              </v-col>
            </v-row>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Detailed Similarities -->
        <v-expansion-panel value="similarities" v-if="metrics.detailed_timings?.all_similarities">
          <v-expansion-panel-title>
            <v-icon start size="small">mdi-vector-difference</v-icon>
            Source Similarity Analysis
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list dense>
              <v-list-item 
                v-for="(similarity, index) in metrics.detailed_timings.all_similarities" 
                :key="index"
                :class="{ 'bg-success-lighten-5': similarity.source_index === metrics.result?.best_source_index }"
              >
                <template v-slot:prepend>
                  <v-icon 
                    :icon="similarity.source_index === metrics.result?.best_source_index ? 'mdi-check-circle' : 'mdi-circle-outline'"
                    :color="similarity.source_index === metrics.result?.best_source_index ? 'success' : 'grey'"
                    size="small"
                  ></v-icon>
                </template>
                
                <v-list-item-title>
                  Source {{ similarity.source_index + 1 }}
                  <v-chip 
                    v-if="similarity.source_index === metrics.result?.best_source_index"
                    size="x-small"
                    color="success"
                    class="ml-2"
                  >
                    Selected
                  </v-chip>
                </v-list-item-title>
                
                <template v-slot:append>
                  <div class="text-right">
                    <div class="text-body-2">{{ (similarity.similarity * 100).toFixed(1) }}%</div>
                    <div class="text-caption text-grey">
                      {{ formatTime(metrics.detailed_timings.per_source_timings?.embedding_times[index] || 0) }}
                    </div>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Model Information -->
        <v-expansion-panel value="models">
          <v-expansion-panel-title>
            <v-icon start size="small">mdi-brain</v-icon>
            Model Configuration
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-row dense>
              <v-col cols="12" md="4">
                <div class="text-caption text-grey">Separation Model</div>
                <div class="text-body-2 font-weight-medium">{{ metrics.models?.separation || 'N/A' }}</div>
              </v-col>
              <v-col cols="12" md="4">
                <div class="text-caption text-grey">Embedding Model</div>
                <div class="text-body-2 font-weight-medium">{{ metrics.models?.embedding || 'N/A' }}</div>
              </v-col>
              <v-col cols="12" md="4">
                <div class="text-caption text-grey">VAD Processor</div>
                <div class="text-body-2 font-weight-medium">{{ metrics.models?.vad || 'None' }}</div>
              </v-col>
            </v-row>
            
            <v-row dense class="mt-3">
              <v-col cols="6">
                <div class="text-caption text-grey">GPU Acceleration</div>
                <v-chip 
                  :color="metrics.use_gpu ? 'success' : 'grey'"
                  size="small"
                  variant="tonal"
                >
                  {{ metrics.use_gpu ? 'Enabled' : 'Disabled' }}
                </v-chip>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-grey">Processing Started</div>
                <div class="text-body-2">{{ formatTimestamp(metrics.start_time) }}</div>
              </v-col>
            </v-row>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Errors/Warnings -->
        <v-expansion-panel value="errors" v-if="metrics.errors && metrics.errors.length > 0">
          <v-expansion-panel-title>
            <v-icon start size="small" color="warning">mdi-alert</v-icon>
            Warnings & Errors
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-alert
              v-for="(error, index) in metrics.errors"
              :key="index"
              type="warning"
              density="compact"
              variant="tonal"
              class="mb-2"
            >
              {{ error }}
            </v-alert>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'MetricsDisplay',
  props: {
    metrics: {
      type: Object,
      required: true,
      default: () => ({})
    }
  },
  data() {
    return {
      expandedPanels: ['timings']
    }
  },
  computed: {
    processingSpeed() {
      if (!this.metrics.audio_info?.duration_seconds || !this.metrics.timings?.total) {
        return '0.0'
      }
      const speed = this.metrics.audio_info.duration_seconds / this.metrics.timings.total
      return speed.toFixed(1)
    },
    
    bestSimilarity() {
      return ((this.metrics.result?.similarity || 0) * 100).toFixed(1)
    },
    
    totalDataProcessed() {
      const sizes = this.metrics.file_sizes || {}
      return (sizes.mixed_audio || 0) + (sizes.isolated_audio || 0)
    },
    
    sortedTimings() {
      const timings = this.metrics.timings || {}
      const filtered = Object.entries(timings)
        .filter(([key]) => key !== 'total')
        .sort(([, a], [, b]) => b - a)
      
      return Object.fromEntries(filtered)
    }
  },
  methods: {
    formatTime(seconds) {
      if (!seconds || seconds === 0) return '0ms'
      
      if (seconds < 0.001) return '<1ms'
      if (seconds < 1) return `${Math.round(seconds * 1000)}ms`
      if (seconds < 60) return `${seconds.toFixed(2)}s`
      
      const minutes = Math.floor(seconds / 60)
      const secs = (seconds % 60).toFixed(1)
      return `${minutes}m ${secs}s`
    },
    
    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 B'
      
      const units = ['B', 'KB', 'MB', 'GB']
      const index = Math.floor(Math.log(bytes) / Math.log(1024))
      const size = (bytes / Math.pow(1024, index)).toFixed(2)
      
      return `${size} ${units[index]}`
    },
    
    formatTimestamp(timestamp) {
      if (!timestamp) return 'N/A'
      return new Date(timestamp * 1000).toLocaleString()
    },
    
    formatTimingLabel(key) {
      const labels = {
        profile_loading: 'Profile Loading',
        embedding_retrieval: 'Embedding Retrieval',
        vad_processing: 'VAD Processing',
        model_loading: 'Model Loading',
        audio_separation: 'Audio Separation',
        embedding_generation: 'Embedding Generation',
        similarity_comparison: 'Similarity Comparison',
        file_operations: 'File Operations',
        post_processing: 'Post-Processing'
      }
      return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    },
    
    getTimingIcon(key) {
      const icons = {
        profile_loading: 'mdi-account-circle',
        embedding_retrieval: 'mdi-database',
        vad_processing: 'mdi-waveform',
        model_loading: 'mdi-brain',
        audio_separation: 'mdi-call-split',
        embedding_generation: 'mdi-vector-polyline',
        similarity_comparison: 'mdi-compare',
        file_operations: 'mdi-file-multiple',
        post_processing: 'mdi-tune'
      }
      return icons[key] || 'mdi-timer'
    },
    
    getTimingColor(key) {
      const colors = {
        audio_separation: 'primary',
        model_loading: 'secondary',
        embedding_generation: 'info',
        similarity_comparison: 'success'
      }
      return colors[key] || 'grey'
    },
    
    getTimingPercentage(time) {
      const total = this.metrics.timings?.total || 0
      if (!total) return 0
      return Math.round((time / total) * 100)
    }
  }
}
</script>

<style scoped>
.v-expansion-panel-text {
  padding-top: 16px;
}
</style>