<!-- src/pages/Streamlined.vue -->
<template>
  <div>
    <h1 class="text-h4 mb-3">Quick Voice Isolation</h1>
    
    <v-row align="stretch">
      <!-- Voice Profile Selection (Left) -->
      <v-col cols="12" md="3" class="pa-2 d-flex">
        <v-card class="flex-grow-1">
          <v-card-title class="text-subtitle-1">
            <v-icon color="primary" class="mr-2" size="small">mdi-account-voice</v-icon>
            Select Voice
          </v-card-title>
          <v-card-text>
            <v-select
              v-model="selectedProfileId"
              :items="profileOptions"
              label="Voice Profile"
              item-title="text"
              item-value="value"
              :disabled="isProcessing"
              :loading="loadingProfiles"
              density="compact"
              variant="outlined"
            ></v-select>
            
            <div v-if="selectedProfileId" class="mt-3">
              <v-btn
                block
                size="small"
                color="primary"
                variant="tonal"
                @click="playProfileAudio"
                :disabled="!getSelectedProfile"
              >
                <v-icon start size="small">mdi-play</v-icon>
                Play Profile
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Mixed Audio Import (Middle) -->
      <v-col cols="12" md="6" class="pa-2 d-flex">
        <v-card class="flex-grow-1">
          <v-card-title class="text-subtitle-1">
            <v-icon color="primary" class="mr-2" size="small">mdi-music</v-icon>
            Import Mixed Audio
          </v-card-title>
          <v-card-text>
            <v-file-input
              v-model="importedFile"
              accept="audio/*"
              label="Select audio file with multiple speakers"
              prepend-icon=""
              show-size
              density="compact"
              variant="outlined"
              :disabled="!selectedProfileId || isProcessing"
              :rules="[v => !v || v.size < 50000000 || 'File size should be less than 50MB']"
              @update:model-value="handleFileImport"
            ></v-file-input>
            
            <div v-if="originalAudioUrl" class="mt-3">
              <audio controls :src="originalAudioUrl" style="width: 100%"></audio>
            </div>
            
            <v-btn
              color="primary"
              block
              class="mt-4"
              size="large"
              :disabled="!importedFile || !selectedProfileId || isProcessing"
              :loading="isProcessing"
              @click="processAudio"
            >
              <v-icon start>mdi-auto-fix</v-icon>
              Isolate Voice
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Results (Right) -->
      <v-col cols="12" md="3" class="pa-2 d-flex">
        <v-card class="flex-grow-1">
          <v-card-title class="text-subtitle-1">
            <v-icon color="success" class="mr-2" size="small">mdi-check-circle</v-icon>
            Results
          </v-card-title>
          <v-card-text>
            <!-- Current Result -->
            <div v-if="result">
              <div class="text-caption text-grey mb-1">Current Result</div>
              <v-card variant="outlined" density="compact" class="pa-2 mb-3">
                <div class="text-caption">
                  Match: <strong>{{ (result.similarity * 100).toFixed(1) }}%</strong>
                </div>
                <audio controls :src="isolatedAudioUrl" style="width: 100%; height: 30px;" class="mt-1"></audio>
                <v-btn
                  size="x-small"
                  color="primary"
                  variant="text"
                  block
                  class="mt-1"
                  @click="showVisualization = true"
                >
                  <v-icon start size="small">mdi-chart-line</v-icon>
                  Visualize
                </v-btn>
              </v-card>
            </div>
            
            <!-- History -->
            <div class="text-caption text-grey mb-1">History</div>
            <v-virtual-scroll
              :items="recentHistory"
              :height="result ? 300 : 400"
              item-height="80"
            >
              <template v-slot:default="{ item }">
                <v-card 
                  variant="outlined" 
                  density="compact" 
                  class="pa-2 mb-2"
                  @click="playHistoryItem(item)"
                  style="cursor: pointer;"
                >
                  <div class="text-caption">
                    <strong>{{ item.profile }}</strong>
                    <v-chip size="x-small" class="ml-1">{{ (item.similarity * 100).toFixed(0) }}%</v-chip>
                  </div>
                  <div class="text-caption text-grey">
                    {{ formatRelativeTime(item.date) }}
                  </div>
                </v-card>
              </template>
            </v-virtual-scroll>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Audio Player Dialog -->
    <v-dialog v-model="audioDialog" max-width="500px">
      <v-card>
        <v-card-title>{{ audioDialogTitle }}</v-card-title>
        <v-card-text>
          <audio controls :src="audioDialogUrl" style="width: 100%"></audio>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="audioDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Visualization Dialog -->
    <v-dialog v-model="showVisualization" max-width="900px">
      <v-card>
        <v-card-title>
          <v-icon start>mdi-chart-line</v-icon>
          Audio Visualization
        </v-card-title>
        <v-card-text>
          <AudioVisualization
            v-if="result && showVisualization"
            :audio-path="result.file_path"
            :comparison-audio-path="result.mixed_audio_path"
            :show-analysis="true"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="showVisualization = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import AudioVisualization from '../components/AudioVisualization.vue'
import API from '../resources/api.js'

export default {
  name: 'StreamlinedPage',
  components: {
    AudioVisualization
  },
  data() {
    return {
      // Main functionality
      profiles: [],
      loadingProfiles: true,
      selectedProfileId: null,
      importedFile: null,
      isProcessing: false,
      originalAudioUrl: null,
      isolatedAudioUrl: null,
      result: null,
      processingStartTime: null,
      
      // History
      isolationHistory: [],
      
      // Dialogs
      audioDialog: false,
      audioDialogTitle: '',
      audioDialogUrl: null,
      showVisualization: false,
      
      // Fixed model configuration (hidden from user)
      fixedConfig: {
        separation_model: 'convtasnet',
        embedding_model: 'resemblyzer',
        use_vad: true,
        vad_processor: 'webrtcvad',
        use_gpu: true
      }
    }
  },
  computed: {
    profileOptions() {
      return this.profiles.map(profile => ({
        text: profile.name,
        value: profile.id
      }))
    },
    getSelectedProfile() {
      return this.profiles.find(profile => profile.id === this.selectedProfileId) || null
    },
    recentHistory() {
      // Show only the 10 most recent results
      return this.isolationHistory.slice(0, 10)
    }
  },
  mounted() {
    this.fetchProfiles()
    this.loadHistoryFromStorage()
  },
  methods: {
    fetchProfiles() {
      this.loadingProfiles = true
      API.getProfiles()
        .then(response => {
          this.profiles = response.data
        })
        .catch(error => {
          console.error('Error fetching profiles:', error)
        })
        .finally(() => {
          this.loadingProfiles = false
        })
    },
    
    loadHistoryFromStorage() {
      try {
        const savedHistory = localStorage.getItem('isolationHistory')
        if (savedHistory) {
          this.isolationHistory = JSON.parse(savedHistory)
        }
      } catch (e) {
        console.error('Error loading history from storage:', e)
        this.isolationHistory = []
      }
    },
    
    saveHistoryToStorage() {
      try {
        localStorage.setItem('isolationHistory', JSON.stringify(this.isolationHistory))
      } catch (e) {
        console.error('Error saving history to storage:', e)
      }
    },
    
    playProfileAudio() {
      if (!this.getSelectedProfile) return
      
      const filename = this.getSelectedProfile.file_path.split('/').pop()
      this.audioDialogUrl = `${API.baseURL}/data/audio/${filename}`
      this.audioDialogTitle = `Voice Profile: ${this.getSelectedProfile.name}`
      this.audioDialog = true
    },
    
    handleFileImport(file) {
      if (!file) {
        this.originalAudioUrl = null
        return
      }
      
      // Create audio preview URL
      if (this.originalAudioUrl) {
        URL.revokeObjectURL(this.originalAudioUrl)
      }
      this.originalAudioUrl = URL.createObjectURL(file)
    },
    
    processAudio() {
      if (!this.selectedProfileId || !this.importedFile) {
        return
      }
      
      this.isProcessing = true
      this.result = null
      this.isolatedAudioUrl = null
      this.processingStartTime = Date.now()
      
      const formData = new FormData()
      formData.append('profile_id', this.selectedProfileId)
      
      // Apply fixed configuration
      Object.keys(this.fixedConfig).forEach(key => {
        formData.append(key, this.fixedConfig[key])
      })
      
      // Append audio file
      formData.append('audio_file', this.importedFile, this.importedFile.name)
      
      API.processAudio(formData)
        .then(response => {
          this.result = response.data
          this.isolatedAudioUrl = API.getFileUrl(response.data.file_path)
          const processingTime = ((Date.now() - this.processingStartTime) / 1000).toFixed(1)
          
          // Add to history
          this.addToHistory(response.data, processingTime)
        })
        .catch(error => {
          console.error('Error processing audio:', error)
          alert('Failed to process audio. Please try again.')
        })
        .finally(() => {
          this.isProcessing = false
        })
    },
    
    addToHistory(result, processingTime) {
      const profile = this.getSelectedProfile
      if (!profile) return
      
      const historyItem = {
        id: Date.now().toString(),
        profile: profile.name,
        profileId: profile.id,
        date: new Date().toISOString(),
        similarity: result.similarity,
        filePath: result.file_path,
        processingTime: processingTime,
        isolatedAudioUrl: this.isolatedAudioUrl,
        mixedAudioPath: result.mixed_audio_path,
        mixedAudioUrl: API.baseURL + result.mixed_audio_path
      }
      
      this.isolationHistory.unshift(historyItem)
      this.saveHistoryToStorage()
    },
    
    formatRelativeTime(dateString) {
      const date = new Date(dateString)
      const now = new Date()
      const seconds = Math.floor((now - date) / 1000)
      
      if (seconds < 60) return 'just now'
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
      return `${Math.floor(seconds / 86400)}d ago`
    },
    
    playHistoryItem(item) {
      this.audioDialogUrl = item.isolatedAudioUrl
      this.audioDialogTitle = `Isolated Voice: ${item.profile}`
      this.audioDialog = true
    }
  }
}
</script>

<style scoped>
.v-virtual-scroll {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}
</style>