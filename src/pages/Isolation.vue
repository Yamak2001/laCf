<!-- src/pages/Isolation.vue -->
<template>
  <div>
    <h1 class="text-h4 mb-3">Voice Isolation Test</h1>
    
    <v-row>
      <!-- Voice Profile Selection (Column 1) -->
      <v-col cols="12" md="3" class="pa-2">
        <v-card height="calc(100vh - 180px)" style="overflow-y: auto">
          <v-card-title>
            <v-icon color="primary" class="mr-2">mdi-account-voice</v-icon>
            Select Voice Profile
          </v-card-title>
          <v-card-text>
            <v-select
              v-model="selectedProfileId"
              :items="profileOptions"
              label="Select a voice profile"
              item-title="text"
              item-value="value"
              :disabled="isRecording || isProcessing"
              :loading="loadingProfiles"
            ></v-select>
            
            <div v-if="selectedProfileId" class="d-flex align-center mt-4">
              <v-avatar color="primary" size="36" class="mr-2">
                <span class="text-h6 text-white">{{ getSelectedProfile?.name.charAt(0) || '?' }}</span>
              </v-avatar>
              <div>
                <div class="text-subtitle-1">{{ getSelectedProfile?.name }}</div>
                <div class="text-caption" v-if="getSelectedProfile?.category">{{ getSelectedProfile.category }}</div>
              </div>
              <v-spacer></v-spacer>
              <v-btn
                icon
                size="small"
                color="info"
                @click="playProfileAudio"
                :disabled="!getSelectedProfile"
              >
                <v-icon>mdi-play</v-icon>
              </v-btn>
            </div>
            
            <p class="text-body-2 mt-2">
              Select the voice profile you want to isolate from mixed audio.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Test Audio and Model Selection (Column 2) -->
      <v-col cols="12" md="5" class="pa-2">
        <v-card height="calc(100vh - 180px)" class="d-flex flex-column" style="overflow-y: auto">
          <v-card-title>
            <v-icon color="primary" class="mr-2">mdi-music</v-icon>
            Test Audio
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-2">
              Record or import audio with multiple speakers, including the profile you selected.
            </p>
            
            <v-tabs v-model="activeSourceTab" grow>
              <v-tab value="record">
                <v-icon start>mdi-microphone</v-icon>
                Record
              </v-tab>
              <v-tab value="import">
                <v-icon start>mdi-file-upload</v-icon>
                Import
              </v-tab>
            </v-tabs>
            
            <v-window v-model="activeSourceTab" class="mt-2">
              <!-- Recording Tab -->
              <v-window-item value="record">
                <AudioRecorder 
                  ref="audioRecorder"
                  :is-processing="isProcessing"
                  @recording-complete="handleRecordingComplete"
                  :disabled="!selectedProfileId"
                />
              </v-window-item>
              
              <!-- Import Tab -->
              <v-window-item value="import">
                <div class="py-2">
                  <v-file-input
                    v-model="importedFile"
                    accept="audio/*"
                    label="Select audio file"
                    prepend-icon="mdi-file-music"
                    show-size
                    density="compact"
                    :disabled="!selectedProfileId || isProcessing"
                    :rules="[v => !v || v.size < 50000000 || 'File size should be less than 50MB']"
                    @update:model-value="handleFileImport"
                  ></v-file-input>
                  
                  <div v-if="originalAudioUrl && activeSourceTab === 'import'" class="mt-2">
                    <p class="text-subtitle-2 mb-2">Preview:</p>
                    <audio controls :src="originalAudioUrl" style="width: 100%"></audio>
                  </div>
                </div>
              </v-window-item>
            </v-window>
            
            <!-- Model Selection Card (within the same column, below Test Audio) -->
            <v-divider class="my-3"></v-divider>
            <div>
              <div class="text-subtitle-1 d-flex align-center mb-2">
                <v-icon color="primary" class="mr-2">mdi-cog</v-icon>
                Model Selection
              </div>
              
              <v-row dense>
                <v-col cols="6">
                  <v-select
                    v-model="selectedSeparationModel"
                    :items="separationModelOptions"
                    label="Separation Model"
                    :disabled="isProcessing"
                    :loading="loadingModels"
                    density="compact"
                    hint="Separates audio sources"
                    persistent-hint
                  ></v-select>
                </v-col>
                
                <v-col cols="6">
                  <v-select
                    v-model="selectedEmbeddingModel"
                    :items="embeddingModelOptions"
                    label="Embedding Model"
                    :disabled="isProcessing"
                    :loading="loadingModels"
                    density="compact"
                    hint="Matches voice profiles"
                    persistent-hint
                  ></v-select>
                </v-col>
              </v-row>
              
              <v-row dense class="mt-1">
                <v-col cols="6">
                  <v-switch
                    v-model="useVAD"
                    label="Use VAD"
                    :disabled="isProcessing"
                    density="compact"
                    hide-details
                  ></v-switch>
                </v-col>
                
                <v-col cols="6" v-if="useVAD">
                  <v-select
                    v-model="selectedVADProcessor"
                    :items="vadProcessorOptions"
                    label="VAD Processor"
                    :disabled="isProcessing || !useVAD"
                    :loading="loadingModels"
                    density="compact"
                    hide-details
                  ></v-select>
                </v-col>
              </v-row>
              
              <v-row>
                <v-col cols="12">
                  <v-checkbox
                    v-model="useGPU"
                    label="Use GPU acceleration (if available)"
                    :disabled="isProcessing"
                    density="compact"
                    hide-details
                  ></v-checkbox>
                </v-col>
              </v-row>
            </div>
            
            <v-btn
              color="primary"
              block
              class="mt-3"
              :disabled="!audioBlob && !importedFile || !selectedProfileId || isProcessing"
              :loading="isProcessing"
              @click="processAudio"
            >
              <v-icon class="mr-2">mdi-auto-fix</v-icon>
              Isolate Voice
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Results Column (Column 3) -->
      <v-col cols="12" md="4" class="pa-2">
        <v-card v-if="result" height="calc(100vh - 180px)" class="d-flex flex-column" style="overflow-y: auto">
          <v-card-title>
            <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
            Voice Isolation Results
          </v-card-title>
          <v-card-text class="flex-grow-1 d-flex flex-column">
            <p class="text-body-2">
              Match confidence: <strong>{{ (result.similarity * 100).toFixed(1) }}%</strong>
            </p>
            
            <v-tabs v-model="activeResultTab">
              <v-tab value="original">Original</v-tab>
              <v-tab value="isolated">Isolated</v-tab>
              <v-tab value="comparison">Compare</v-tab>
              <v-tab value="history">Results History</v-tab>
            </v-tabs>
            
            <v-window v-model="activeResultTab" class="mt-2 flex-grow-1">
              <v-window-item value="original">
                <v-card flat>
                  <v-card-text>
                    <audio controls :src="originalAudioUrl" style="width: 100%"></audio>
                    <p class="text-body-2 mt-2">Original mixed audio with multiple speakers.</p>
                  </v-card-text>
                </v-card>
              </v-window-item>
              
              <v-window-item value="isolated">
                <v-card flat>
                  <v-card-text>
                    <audio controls :src="isolatedAudioUrl" style="width: 100%"></audio>
                    <p class="text-body-2 mt-2">Isolated voice matching the selected profile.</p>
                  </v-card-text>
                </v-card>
              </v-window-item>
              
              <v-window-item value="comparison">
                <v-card flat>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-avatar color="primary" size="28">
                            <span class="text-caption text-white">{{ getSelectedProfile?.name.charAt(0) || '?' }}</span>
                          </v-avatar>
                        </template>
                        <v-list-item-title class="text-caption">Profile Sample</v-list-item-title>
                        <template v-slot:append>
                          <audio controls :src="profileAudioUrl" style="max-width: 180px; height: 30px;"></audio>
                        </template>
                      </v-list-item>
                      
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-avatar color="grey" size="28">
                            <v-icon size="small">mdi-microphone</v-icon>
                          </v-avatar>
                        </template>
                        <v-list-item-title class="text-caption">Mixed Audio</v-list-item-title>
                        <template v-slot:append>
                          <audio controls :src="originalAudioUrl" style="max-width: 180px; height: 30px;"></audio>
                        </template>
                      </v-list-item>
                      
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-avatar color="success" size="28">
                            <v-icon size="small">mdi-account-voice</v-icon>
                          </v-avatar>
                        </template>
                        <v-list-item-title class="text-caption">Isolated Voice</v-list-item-title>
                        <template v-slot:append>
                          <audio controls :src="isolatedAudioUrl" style="max-width: 180px; height: 30px;"></audio>
                        </template>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-window-item>
              
              <!-- Results History Tab -->
              <v-window-item value="history">
                <v-card flat>
                  <v-card-text>
                    <v-text-field
                      v-model="historySearch"
                      append-icon="mdi-magnify"
                      label="Search"
                      single-line
                      density="compact"
                      hide-details
                      variant="underlined"
                      class="mb-2"
                    ></v-text-field>
                    
                    <v-data-table
                      :headers="historyHeaders"
                      :items="isolationHistory"
                      :search="historySearch"
                      :loading="loadingHistory"
                      loading-text="Loading history..."
                      :items-per-page="5"
                      density="compact"
                      class="results-history-table"
                      :footer-props="{
                        'items-per-page-options': [5, 10, 20, -1],
                        'items-per-page-text': 'Per page',
                        'class': 'text-caption'
                      }"
                    >
                      <!-- Profile column -->
                      <template v-slot:item.profile="{ item }">
                        <div class="d-flex align-center">
                          <v-avatar color="primary" size="28" class="mr-2">
                            <span class="text-caption text-white">{{ item.profile.charAt(0) }}</span>
                          </v-avatar>
                          {{ item.profile }}
                        </div>
                      </template>
                      
                      <!-- Date column -->
                      <template v-slot:item.date="{ item }">
                        {{ formatDate(item.date) }}
                      </template>
                      
                      <!-- Similarity column -->
                      <template v-slot:item.similarity="{ item }">
                        <v-chip
                          :color="getSimilarityColor(item.similarity)"
                          size="x-small"
                          label
                        >
                          {{ (item.similarity * 100).toFixed(1) }}%
                        </v-chip>
                      </template>
                      
                      <!-- Models column -->
                      <template v-slot:item.models="{ item }">
                        <v-tooltip bottom>
                          <template v-slot:activator="{ props }">
                            <div v-bind="props" class="text-truncate" style="max-width: 150px;">
                              {{ item.separationModel || 'convtasnet' }} / {{ item.embeddingModel || 'resemblyzer' }}
                            </div>
                          </template>
                          <span>
                            Separation: {{ item.separationModel || 'convtasnet' }}<br>
                            Embedding: {{ item.embeddingModel || 'resemblyzer' }}<br>
                            VAD: {{ item.useVad ? (item.vadProcessor || 'webrtcvad') : 'disabled' }}
                          </span>
                        </v-tooltip>
                      </template>
                      
                      <!-- Actions column -->
                      <template v-slot:item.actions="{ item }">
                        <v-menu>
                          <template v-slot:activator="{ props }">
                            <v-btn
                              icon
                              size="x-small"
                              v-bind="props"
                            >
                              <v-icon size="small">mdi-dots-vertical</v-icon>
                            </v-btn>
                          </template>
                          <v-list density="compact">
                            <v-list-item @click="playHistoryItem(item, 'profile')">
                              <v-list-item-title class="text-caption">
                                <v-icon size="small" start>mdi-account-voice</v-icon>
                                Play Profile
                              </v-list-item-title>
                            </v-list-item>
                            
                            <v-list-item @click="playHistoryItem(item, 'isolated')">
                              <v-list-item-title class="text-caption">
                                <v-icon size="small" start>mdi-music</v-icon>
                                Play Isolated
                              </v-list-item-title>
                            </v-list-item>
                            
                            <v-list-item @click="playHistoryItem(item, 'mixed')">
                              <v-list-item-title class="text-caption">
                                <v-icon size="small" start>mdi-waveform</v-icon>
                                Play Mixed Audio
                              </v-list-item-title>
                            </v-list-item>
                            
                            <v-list-item @click="viewHistoryDetails(item)">
                              <v-list-item-title class="text-caption">
                                <v-icon size="small" start>mdi-information-outline</v-icon>
                                View Details
                              </v-list-item-title>
                            </v-list-item>
                            
                            <v-list-item @click="deleteHistoryItem(item)">
                              <v-list-item-title class="text-caption">
                                <v-icon size="small" start color="error">mdi-delete</v-icon>
                                Delete
                              </v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-menu>
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </v-window-item>
            </v-window>
            
            <v-card class="mt-2" variant="outlined">
              <v-card-title class="text-subtitle-2 py-1">Processing Details</v-card-title>
              <v-divider></v-divider>
              <v-list density="compact" lines="two">
                <v-list-item density="compact">
                  <v-list-item-title class="text-caption">Process Time</v-list-item-title>
                  <v-list-item-subtitle class="text-caption">{{ processingTime }} seconds</v-list-item-subtitle>
                </v-list-item>
                <v-list-item density="compact">
                  <v-list-item-title class="text-caption">Models</v-list-item-title>
                  <v-list-item-subtitle class="text-caption">{{ result.separation_model }} / {{ result.embedding_model }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item density="compact" v-if="result.use_vad">
                  <v-list-item-title class="text-caption">VAD</v-list-item-title>
                  <v-list-item-subtitle class="text-caption">{{ result.vad_processor }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card>
          </v-card-text>
        </v-card>
        
        <v-card v-else class="d-flex align-center justify-center" height="calc(100vh - 180px)">
          <div class="text-center pa-4">
            <v-icon size="64" color="grey-lighten-1">mdi-waveform</v-icon>
            <p class="text-h6 mt-2">Results will appear here</p>
            <p class="text-body-2">
              Select a profile and provide audio, then click "Isolate Voice"
            </p>
          </div>
        </v-card>
      </v-col>
    </v-row>

    
    <!-- Audio Player Dialog for Profile Sample -->
    <v-dialog v-model="audioDialog" max-width="500px">
      <v-card>
        <v-card-title>
          Voice Profile Sample: {{ getSelectedProfile?.name }}
        </v-card-title>
        <v-card-text>
          <audio controls :src="profileAudioUrl" style="width: 100%"></audio>
          <p class="text-body-2 mt-2">
            This is the original voice sample used to create this profile.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="audioDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- History Item Dialog -->
    <v-dialog v-model="historyDialog" max-width="700px">
      <v-card>
        <v-card-title>
          <v-icon start color="info">mdi-information-outline</v-icon>
          Isolation Details
        </v-card-title>
        <v-card-text v-if="selectedHistoryItem">
          <v-row>
            <v-col cols="12" md="6">
              <v-list>
                <v-list-item>
                  <v-list-item-title>Profile</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedHistoryItem.profile }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-title>Date</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(selectedHistoryItem.date) }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-title>Match Confidence</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="getSimilarityColor(selectedHistoryItem.similarity)"
                      size="small"
                      label
                    >
                      {{ (selectedHistoryItem.similarity * 100).toFixed(1) }}%
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-title>File Name</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedHistoryItem.fileName }}</v-list-item-subtitle>
                </v-list-item>
                
                <!-- NEW: Models Information -->
                <v-list-item>
                  <v-list-item-title>Separation Model</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedHistoryItem.separationModel || 'convtasnet' }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-title>Embedding Model</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedHistoryItem.embeddingModel || 'resemblyzer' }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item v-if="selectedHistoryItem.useVad">
                  <v-list-item-title>VAD Processor</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedHistoryItem.vadProcessor || 'webrtcvad' }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-title>Processing Time</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedHistoryItem.processingTime }} seconds</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-card flat>
                <v-card-text>
                  <div class="text-subtitle-1 mb-2 mt-4">Mixed Audio</div>
                  <audio 
                    controls 
                    :src="selectedHistoryItem.mixedAudioUrl" 
                    style="width: 100%"
                  ></audio>
                           
                  <div class="text-subtitle-1 mb-2">Voice Profile Sample</div>
                  <audio 
                    controls 
                    :src="selectedHistoryItem.profileAudioUrl" 
                    style="width: 100%"
                  ></audio>
                  
                  <div class="text-subtitle-1 mb-2 mt-4">Isolated Voice</div>
                  <audio 
                    controls 
                    :src="selectedHistoryItem.isolatedAudioUrl" 
                    style="width: 100%"
                  ></audio>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="historyDialog = false">Close</v-btn>
          <v-btn 
            color="error" 
            @click="deleteHistoryItem(selectedHistoryItem); historyDialog = false"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- History Audio Player Dialog -->
    <v-dialog v-model="historyAudioDialog" max-width="500px">
      <v-card>
        <v-card-title>
          {{ historyAudioTitle }}
        </v-card-title>
        <v-card-text>
          <audio controls :src="historyAudioUrl" style="width: 100%"></audio>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="historyAudioDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteHistoryDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <v-icon start color="error">mdi-delete</v-icon>
          Delete History Item
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete this history item? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="deleteHistoryDialog = false">Cancel</v-btn>
          <v-btn 
            color="error" 
            @click="confirmDeleteHistoryItem"
            :loading="isDeleting"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
  </div>
</template>

<script>
import AudioRecorder from '../components/AudioRecorder.vue'
import API from '../resources/api.js'

export default {
  name: 'IsolationPage',
  components: {
    AudioRecorder
  },
  data() {
    return {
      // Main functionality
      profiles: [],
      loadingProfiles: true,
      selectedProfileId: null,
      audioBlob: null,
      importedFile: null,
      isRecording: false,
      isProcessing: false,
      originalAudioUrl: null,
      isolatedAudioUrl: null,
      profileAudioUrl: null,
      audioDialog: false,
      result: null,
      activeSourceTab: 'record',
      activeResultTab: 'comparison',
      processingStartTime: null,
      processingTime: 0,
      
      // NEW: Model selection
      loadingModels: true,
      availableModels: {
        separation_models: {},
        embedding_models: {},
        vad_processors: {}
      },
      selectedSeparationModel: 'convtasnet',
      selectedEmbeddingModel: 'resemblyzer',
      useVAD: false,
      selectedVADProcessor: 'webrtcvad',
      useGPU: false,
      
      // NEW: Benchmarking
      showBenchmarkDialog: false,
      benchmarkSeparationModels: ['convtasnet'],
      benchmarkEmbeddingModels: ['resemblyzer'],
      benchmarkUseVAD: false,
      benchmarkVADProcessors: ['webrtcvad'],
      benchmarkOutputFormat: 'json',
      isBenchmarking: false,
      showBenchmarkResults: false,
      benchmarkResults: null,
      outputFormatOptions: [
        { title: 'JSON', value: 'json' },
        { title: 'CSV', value: 'csv' },
        { title: 'Markdown', value: 'markdown' }
      ],
      benchmarkHeaders: [
        { title: 'Separation Model', key: 'separation_model', sortable: true },
        { title: 'Embedding Model', key: 'embedding_model', sortable: true },
        { title: 'VAD', key: 'use_vad', sortable: true },
        { title: 'Match', key: 'similarity', sortable: true },
        { title: 'Time (s)', key: 'total_time', sortable: true },
      ],
      
      // History functionality
      isolationHistory: [],
      loadingHistory: false,
      historySearch: '',
      historyHeaders: [
        { title: 'Profile', key: 'profile', sortable: true },
        { title: 'Date', key: 'date', sortable: true },
        { title: 'Match', key: 'similarity', sortable: true },
        { title: 'Models', key: 'models', sortable: true },
        { title: 'Processing Time', key: 'processingTime', sortable: true },
        { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
      ],
      historyDialog: false,
      selectedHistoryItem: null,
      historyAudioDialog: false,
      historyAudioUrl: null,
      historyAudioTitle: '',
      deleteHistoryDialog: false,
      itemToDelete: null,
      isDeleting: false
    }
  },
  computed: {
    profileOptions() {
      return this.profiles.map(profile => ({
        text: profile.name + (profile.category ? ` (${profile.category})` : ''),
        value: profile.id
      }))
    },
    getSelectedProfile() {
      return this.profiles.find(profile => profile.id === this.selectedProfileId) || null
    },
    separationModelOptions() {
      if (!this.availableModels.separation_models) return []
      return Object.keys(this.availableModels.separation_models).map(key => ({
        title: this.availableModels.separation_models[key] || key,
        value: key
      }))
    },
    embeddingModelOptions() {
      if (!this.availableModels.embedding_models) return []
      return Object.keys(this.availableModels.embedding_models).map(key => ({
        title: this.availableModels.embedding_models[key] || key,
        value: key
      }))
    },
    vadProcessorOptions() {
      if (!this.availableModels.vad_processors) return []
      return Object.keys(this.availableModels.vad_processors).map(key => ({
        title: this.availableModels.vad_processors[key] || key,
        value: key
      }))
    }
  },
  watch: {
    selectedProfileId(newVal) {
      if (newVal) {
        // Update profile audio URL when profile changes
        this.updateProfileAudioUrl()
      } else {
        this.profileAudioUrl = null
      }
    }
  },
  mounted() {
    this.fetchProfiles()
    this.fetchAvailableModels()
    this.fetchIsolationHistory()
    
    // Load history from local storage
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
    
    // NEW: Fetch available models
    fetchAvailableModels() {
      this.loadingModels = true
      API.getAvailableModels()
        .then(response => {
          this.availableModels = response.data
          console.log("Available models:", this.availableModels)
          
          // Set defaults if available
          if (this.availableModels.separation_models && Object.keys(this.availableModels.separation_models).length > 0) {
            this.selectedSeparationModel = Object.keys(this.availableModels.separation_models)[0]
            this.benchmarkSeparationModels = [this.selectedSeparationModel]
          }
          
          if (this.availableModels.embedding_models && Object.keys(this.availableModels.embedding_models).length > 0) {
            this.selectedEmbeddingModel = Object.keys(this.availableModels.embedding_models)[0]
            this.benchmarkEmbeddingModels = [this.selectedEmbeddingModel]
          }
          
          if (this.availableModels.vad_processors && Object.keys(this.availableModels.vad_processors).length > 0) {
            this.selectedVADProcessor = Object.keys(this.availableModels.vad_processors)[0]
            this.benchmarkVADProcessors = [this.selectedVADProcessor]
          }
        })
        .catch(error => {
          console.error('Error fetching available models:', error)
        })
        .finally(() => {
          this.loadingModels = false
        })
    },
    
    // Placeholder method - you'll need to implement actual API if needed
    fetchIsolationHistory() {
      // This would be replaced with an actual API call if you have a backend endpoint
      // Otherwise, we're using local storage as shown in loadHistoryFromStorage()
      this.loadingHistory = true
      
      // Simulate API call delay
      setTimeout(() => {
        this.loadingHistory = false
      }, 500)
    },
    
    loadHistoryFromStorage() {
      try {
        const savedHistory = localStorage.getItem('isolationHistory')
        if (savedHistory) {
          this.isolationHistory = JSON.parse(savedHistory)
        }
      } catch (e) {
        console.error('Error loading history from storage:', e)
        // Initialize with empty array if there's an error
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
    
    updateProfileAudioUrl() {
      if (!this.getSelectedProfile) return
      
      // Extract just the filename from the full path
      const filename = this.getSelectedProfile.file_path.split('/').pop()
      
      // Construct URL to the static file endpoint
      this.profileAudioUrl = `${API.baseURL}/data/audio/${filename}`
    },
    
    playProfileAudio() {
      if (!this.getSelectedProfile) return
      
      this.updateProfileAudioUrl()
      this.audioDialog = true
    },
    
    handleRecordingComplete(blob) {
      this.audioBlob = blob
      
      // Clear imported file if it exists
      if (this.importedFile) {
        this.importedFile = null
      }
      
      // Create object URL for preview
      if (this.originalAudioUrl) {
        URL.revokeObjectURL(this.originalAudioUrl)
      }
      this.originalAudioUrl = URL.createObjectURL(blob)
    },
    
    handleFileImport(file) {
      if (!file) {
        this.originalAudioUrl = null
        return
      }
      
      // Clear recorded audio if it exists
      if (this.audioBlob) {
        this.audioBlob = null
        if (this.$refs.audioRecorder) {
          this.$refs.audioRecorder.resetRecording()
        }
      }
      
      // Create audio preview URL
      if (this.originalAudioUrl) {
        URL.revokeObjectURL(this.originalAudioUrl)
      }
      this.originalAudioUrl = URL.createObjectURL(file)
    },
    
    processAudio() {
      if (!this.selectedProfileId || (!this.audioBlob && !this.importedFile)) {
        alert('Please select a profile and record or import audio first.')
        return
      }
      
      this.isProcessing = true
      this.result = null
      this.isolatedAudioUrl = null
      this.processingStartTime = Date.now()
      
      const formData = new FormData()
      formData.append('profile_id', this.selectedProfileId)
      
      // NEW: Append model selection parameters
      formData.append('separation_model', this.selectedSeparationModel)
      formData.append('embedding_model', this.selectedEmbeddingModel)
      formData.append('use_vad', this.useVAD)
      if (this.useVAD) {
        formData.append('vad_processor', this.selectedVADProcessor)
      }
      formData.append('use_gpu', this.useGPU)
      
      // Append either recorded blob or imported file
      if (this.audioBlob) {
        formData.append('audio_file', this.audioBlob, 'test_audio.wav')
      } else if (this.importedFile) {
        formData.append('audio_file', this.importedFile, this.importedFile.name)
      }
      
      API.processAudio(formData)
        .then(response => {
          this.result = response.data
          this.isolatedAudioUrl = API.getFileUrl(response.data.file_path)
          this.processingTime = ((Date.now() - this.processingStartTime) / 1000).toFixed(1)
          this.activeResultTab = 'comparison' // Show comparison tab by default
          
          // Add to isolation history
          this.addToHistory(response.data)
        })
        .catch(error => {
          console.error('Error processing audio:', error)
          alert('Failed to process audio. Please try again.')
        })
        .finally(() => {
          this.isProcessing = false
        })
    },
    
    // NEW: Run benchmark
    runBenchmark() {
      if (!this.selectedProfileId || (!this.audioBlob && !this.importedFile)) {
        alert('Please select a profile and record or import audio first.')
        return
      }
      
      this.isBenchmarking = true
      this.benchmarkResults = null
      
      const formData = new FormData()
      formData.append('profile_id', this.selectedProfileId)
      
      // Append benchmark parameters
      formData.append('separation_models', this.benchmarkSeparationModels.join(','))
      formData.append('embedding_models', this.benchmarkEmbeddingModels.join(','))
      formData.append('use_vad', this.benchmarkUseVAD)
      if (this.benchmarkUseVAD) {
        formData.append('vad_processors', this.benchmarkVADProcessors.join(','))
      }
      formData.append('output_format', this.benchmarkOutputFormat)
      
      // Append audio file
      if (this.audioBlob) {
        formData.append('audio_file', this.audioBlob, 'benchmark_audio.wav')
      } else if (this.importedFile) {
        formData.append('audio_file', this.importedFile, this.importedFile.name)
      }
      
      API.benchmarkModels(formData)
        .then(response => {
          this.benchmarkResults = response.data
          console.log("Benchmark results:", this.benchmarkResults)
          
          // Close benchmark dialog and show results
          this.showBenchmarkDialog = false
          this.showBenchmarkResults = true
        })
        .catch(error => {
          console.error('Error benchmarking models:', error)
          alert('Failed to benchmark models. Please try again.')
        })
        .finally(() => {
          this.isBenchmarking = false
        })
    },
    
    // NEW: Apply best model from benchmark
    applyBestModel() {
      if (!this.benchmarkResults || !this.benchmarkResults.results || this.benchmarkResults.results.length === 0) {
        return
      }
      
      // Sort results by similarity (highest first)
      const sortedResults = [...this.benchmarkResults.results].sort((a, b) => b.similarity - a.similarity)
      const bestModel = sortedResults[0]
      
      // Apply best model configuration
      this.selectedSeparationModel = bestModel.separation_model
      this.selectedEmbeddingModel = bestModel.embedding_model
      this.useVAD = bestModel.use_vad
      if (bestModel.use_vad && bestModel.vad_processor) {
        this.selectedVADProcessor = bestModel.vad_processor
      }
      
      // Close benchmark results dialog
      this.showBenchmarkResults = false
      
      // Show confirmation
      alert(`Applied best model configuration:\nSeparation: ${bestModel.separation_model}\nEmbedding: ${bestModel.embedding_model}\nVAD: ${bestModel.use_vad ? bestModel.vad_processor : 'disabled'}\nSimilarity: ${(bestModel.similarity * 100).toFixed(1)}%`)
    },
    
    addToHistory(result) {
      const profile = this.getSelectedProfile
      if (!profile) return
      
      // Create history item
      const historyItem = {
        id: Date.now().toString(),
        profile: profile.name,
        profileId: profile.id,
        date: new Date().toISOString(),
        similarity: result.similarity,
        fileName: result.file_name,
        filePath: result.file_path,
        processingTime: this.processingTime,
        profileAudioUrl: this.profileAudioUrl,
        isolatedAudioUrl: this.isolatedAudioUrl,
        
        // Add mixed audio URL
        mixedAudioPath: result.mixed_audio_path,
        mixedAudioUrl: API.baseURL + result.mixed_audio_path,
        
        // NEW: Add model information
        separationModel: result.separation_model || this.selectedSeparationModel,
        embeddingModel: result.embedding_model || this.selectedEmbeddingModel,
        useVad: result.use_vad || this.useVAD,
        vadProcessor: result.vad_processor || this.selectedVADProcessor
      }
      
      // Add to history and save
      this.isolationHistory.unshift(historyItem)
      this.saveHistoryToStorage()
    },
    
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleString()
    },
    
    getSimilarityColor(similarity) {
      if (similarity >= 0.8) return 'success'
      if (similarity >= 0.6) return 'info'
      if (similarity >= 0.4) return 'warning'
      return 'error'
    },
    
    playHistoryItem(item, type) {
      if (type === 'profile') {
        this.historyAudioUrl = item.profileAudioUrl
        this.historyAudioTitle = `Profile: ${item.profile}`
      } else if (type === 'isolated') {
        this.historyAudioUrl = item.isolatedAudioUrl
        this.historyAudioTitle = `Isolated Voice: ${item.profile}`
      } else if (type === 'mixed') {
        this.historyAudioUrl = item.mixedAudioUrl
        this.historyAudioTitle = `Mixed Audio: ${item.profile}`
      }
      
      this.historyAudioDialog = true
    },
    
    viewHistoryDetails(item) {
      this.selectedHistoryItem = item
      this.historyDialog = true
    },
    
    deleteHistoryItem(item) {
      this.itemToDelete = item
      this.deleteHistoryDialog = true
    },
    
    confirmDeleteHistoryItem() {
      if (!this.itemToDelete) {
        this.deleteHistoryDialog = false
        return
      }
      
      this.isDeleting = true
      
      // Remove from history array
      this.isolationHistory = this.isolationHistory.filter(
        item => item.id !== this.itemToDelete.id
      )
      
      // Save updated history
      this.saveHistoryToStorage()
      
      // Reset state
      this.isDeleting = false
      this.deleteHistoryDialog = false
      this.itemToDelete = null
      
      // If the details dialog is open, close it
      if (this.historyDialog) {
        this.historyDialog = false
      }
    },
    
    resetForm() {
      this.audioBlob = null
      this.importedFile = null
      
      if (this.originalAudioUrl) {
        URL.revokeObjectURL(this.originalAudioUrl)
        this.originalAudioUrl = null
      }
      
      if (this.$refs.audioRecorder) {
        this.$refs.audioRecorder.resetRecording()
      }
      
      this.result = null
      this.isolatedAudioUrl = null
    }
  }
}
</script>

<style scoped>
.results-history-table {
  max-height: 250px;
  overflow-y: auto;
}
</style>