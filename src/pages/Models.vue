<!-- src/pages/Models.vue -->
<template>
    <div>
      <h1 class="text-h3 mb-4">Available Models</h1>
      
      <v-alert
        type="info"
        variant="tonal"
        border="start"
        class="mb-4"
      >
        This page provides information about the models available for voice isolation.
        You can compare their characteristics to help choose the right model for your needs.
      </v-alert>
      
      <v-tabs v-model="activeTab" class="mb-4">
        <v-tab value="separation">
          <v-icon start>mdi-waveform</v-icon>
          Separation Models
        </v-tab>
        <v-tab value="embedding">
          <v-icon start>mdi-fingerprint</v-icon>
          Embedding Models
        </v-tab>
        <v-tab value="vad">
          <v-icon start>mdi-microphone</v-icon>
          VAD Processors
        </v-tab>
      </v-tabs>
      
      <v-window v-model="activeTab">
        <!-- Separation Models -->
        <v-window-item value="separation">
          <v-row>
            <v-col cols="12" md="6" v-for="model in separationModels" :key="model.id">
              <ModelInfoCard
                :title="model.name"
                :icon="model.icon"
                :icon-color="model.color"
                :info-items="model.infoItems"
                :description="model.description"
                :actions="model.actions"
                @action="handleModelAction(model, $event)"
              />
            </v-col>
          </v-row>
        </v-window-item>
        
        <!-- Embedding Models -->
        <v-window-item value="embedding">
          <v-row>
            <v-col cols="12" md="6" v-for="model in embeddingModels" :key="model.id">
              <ModelInfoCard
                :title="model.name"
                :icon="model.icon"
                :icon-color="model.color"
                :info-items="model.infoItems"
                :description="model.description"
                :actions="model.actions"
                @action="handleModelAction(model, $event)"
              />
            </v-col>
          </v-row>
        </v-window-item>
        
        <!-- VAD Processors -->
        <v-window-item value="vad">
          <v-row>
            <v-col cols="12" md="6" v-for="model in vadProcessors" :key="model.id">
              <ModelInfoCard
                :title="model.name"
                :icon="model.icon"
                :icon-color="model.color"
                :info-items="model.infoItems"
                :description="model.description"
                :actions="model.actions"
                @action="handleModelAction(model, $event)"
              />
            </v-col>
          </v-row>
        </v-window-item>
      </v-window>
      
      <!-- Model Applied Dialog -->
      <v-dialog v-model="showModelAppliedDialog" max-width="400">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
            Model Selected
          </v-card-title>
          <v-card-text>
            <p class="mb-2">
              <strong>{{ selectedModel.name }}</strong> has been selected as your default model.
            </p>
            <p class="text-caption text-grey">
              This setting will be applied when you go to the Isolation page.
            </p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="grey"
              @click="showModelAppliedDialog = false"
            >
              Close
            </v-btn>
            <v-btn
              color="primary"
              @click="goToIsolationPage"
            >
              Go to Isolation Page
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </template>
  
  <script>
  import ModelInfoCard from '../components/ModelInfoCard.vue'
  import API from '../resources/api.js'
  
  export default {
    name: 'ModelsPage',
    components: {
      ModelInfoCard
    },
    data() {
      return {
        activeTab: 'separation',
        loadingModels: true,
        availableModels: {
          separation_models: {},
          embedding_models: {},
          vad_processors: {}
        },
        showModelAppliedDialog: false,
        selectedModel: null
      }
    },
    computed: {
      separationModels() {
        return [
          {
            id: 'convtasnet',
            name: 'ConvTasNet',
            icon: 'mdi-waveform',
            color: 'primary',
            infoItems: [
              { label: 'Speed', value: 'Fast', showAsChip: true, color: 'success' },
              { label: 'Memory', value: 'Low', showAsChip: true, color: 'success' },
              { label: 'Quality', value: 'Good', showAsChip: true, color: 'info' }
            ],
            description: 'ConvTasNet is a fully-convolutional source separation model that uses time-domain processing. It\'s efficient and works well for speech separation.',
            actions: [
              { name: 'select', label: 'Select as Default', icon: 'mdi-check', color: 'primary' }
            ]
          },
          {
            id: 'demucs',
            name: 'Demucs',
            icon: 'mdi-waveform',
            color: 'deep-purple',
            infoItems: [
              { label: 'Speed', value: 'Medium', showAsChip: true, color: 'info' },
              { label: 'Memory', value: 'High', showAsChip: true, color: 'warning' },
              { label: 'Quality', value: 'Excellent', showAsChip: true, color: 'success' }
            ],
            description: 'Demucs (Deep Extractor for Music Sources) is a state-of-the-art music source separation model from Facebook Research, also effective for voice isolation.',
            actions: [
              { name: 'select', label: 'Select as Default', icon: 'mdi-check', color: 'primary' }
            ]
          },
          {
            id: 'dprnn',
            name: 'DPRNN',
            icon: 'mdi-waveform',
            color: 'teal',
            infoItems: [
              { label: 'Speed', value: 'Medium', showAsChip: true, color: 'info' },
              { label: 'Memory', value: 'Medium', showAsChip: true, color: 'info' },
              { label: 'Quality', value: 'Very Good', showAsChip: true, color: 'success' }
            ],
            description: 'DPRNN (Dual-Path RNN) combines local and global processing for efficient speech separation with good accuracy.',
            actions: [
              { name: 'select', label: 'Select as Default', icon: 'mdi-check', color: 'primary' }
            ]
          }
        ]
      },
      embeddingModels() {
        return [
          {
            id: 'resemblyzer',
            name: 'Resemblyzer',
            icon: 'mdi-fingerprint',
            color: 'indigo',
            infoItems: [
              { label: 'Speed', value: 'Fast', showAsChip: true, color: 'success' },
              { label: 'Embedding Size', value: '256', showAsChip: false },
              { label: 'Accuracy', value: 'Good', showAsChip: true, color: 'info' }
            ],
            description: 'Resemblyzer creates voice embeddings that capture the characteristics of a speaker, enabling voice comparison and matching.',
            actions: [
              { name: 'select', label: 'Select as Default', icon: 'mdi-check', color: 'primary' }
            ]
          },
          {
            id: 'ecapa',
            name: 'ECAPA-TDNN',
            icon: 'mdi-fingerprint',
            color: 'blue',
            infoItems: [
              { label: 'Speed', value: 'Medium', showAsChip: true, color: 'info' },
              { label: 'Embedding Size', value: '192', showAsChip: false },
              { label: 'Accuracy', value: 'Excellent', showAsChip: true, color: 'success' }
            ],
            description: 'ECAPA-TDNN is a state-of-the-art speaker verification system from SpeechBrain, providing accurate voice embedding.',
            actions: [
              { name: 'select', label: 'Select as Default', icon: 'mdi-check', color: 'primary' }
            ]
          },
          {
            id: 'speechbrain',
            name: 'SpeechBrain X-Vector',
            icon: 'mdi-fingerprint',
            color: 'cyan',
            infoItems: [
              { label: 'Speed', value: 'Medium', showAsChip: true, color: 'info' },
              { label: 'Embedding Size', value: '512', showAsChip: false },
              { label: 'Accuracy', value: 'Very Good', showAsChip: true, color: 'success' }
            ],
            description: 'SpeechBrain\'s X-Vector model for robust speaker verification, trained on VoxCeleb dataset.',
            actions: [
              { name: 'select', label: 'Select as Default', icon: 'mdi-check', color: 'primary' }
            ]
          }
        ]
      },
      vadProcessors() {
        return [
          {
            id: 'webrtcvad',
            name: 'WebRTC VAD',
            icon: 'mdi-microphone',
            color: 'green',
            infoItems: [
              { label: 'Speed', value: 'Very Fast', showAsChip: true, color: 'success' },
              { label: 'Memory', value: 'Very Low', showAsChip: true, color: 'success' },
              { label: 'Accuracy', value: 'Good', showAsChip: true, color: 'info' }
            ],
            description: 'WebRTC Voice Activity Detection is a lightweight voice activity detector developed by Google that helps filter out non-speech segments.',
            actions: [
              { name: 'select', label: 'Select as Default', icon: 'mdi-check', color: 'primary' }
            ]
          },
          {
            id: 'pyannote_vad',
            name: 'Pyannote VAD',
            icon: 'mdi-microphone',
            color: 'amber',
            infoItems: [
              { label: 'Speed', value: 'Medium', showAsChip: true, color: 'info' },
              { label: 'Memory', value: 'Medium', showAsChip: true, color: 'info' },
              { label: 'Accuracy', value: 'Excellent', showAsChip: true, color: 'success' }
            ],
            description: 'Pyannote VAD is a deep learning-based voice activity detection system with state-of-the-art accuracy.',
            actions: [
              { name: 'select', label: 'Select as Default', icon: 'mdi-check', color: 'primary' }
            ]
          },
          {
            id: 'speechbrain_vad',
            name: 'SpeechBrain VAD',
            icon: 'mdi-microphone',
            color: 'blue-grey',
            infoItems: [
              { label: 'Speed', value: 'Medium', showAsChip: true, color: 'info' },
              { label: 'Memory', value: 'Medium', showAsChip: true, color: 'info' },
              { label: 'Accuracy', value: 'Very Good', showAsChip: true, color: 'success' }
            ],
            description: 'SpeechBrain Voice Activity Detection provides accurate detection of speech segments in audio recordings.',
            actions: [
              { name: 'select', label: 'Select as Default', icon: 'mdi-check', color: 'primary' }
            ]
          }
        ]
      }
    },
    mounted() {
      this.fetchAvailableModels()
    },
    methods: {
      fetchAvailableModels() {
        this.loadingModels = true
        API.getAvailableModels()
          .then(response => {
            this.availableModels = response.data
            console.log("Available models:", this.availableModels)
          })
          .catch(error => {
            console.error('Error fetching available models:', error)
          })
          .finally(() => {
            this.loadingModels = false
          })
      },
      
      handleModelAction(model, action) {
        if (action === 'select') {
          this.selectModel(model)
        }
      },
      
      selectModel(model) {
        this.selectedModel = model
        
        // Save configuration to localStorage based on model type
        let config = JSON.parse(localStorage.getItem('modelConfig') || '{}')
        
        // Update the right property based on model type
        if (this.activeTab === 'separation') {
          config.separation_model = model.id
        } else if (this.activeTab === 'embedding') {
          config.embedding_model = model.id
        } else if (this.activeTab === 'vad') {
          config.vad_processor = model.id
          config.use_vad = true
        }
        
        localStorage.setItem('modelConfig', JSON.stringify(config))
        
        // Show confirmation dialog
        this.showModelAppliedDialog = true
      },
      
      goToIsolationPage() {
        this.showModelAppliedDialog = false
        this.$router.push('/isolation')
      }
    }
  }
  </script>