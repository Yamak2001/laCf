<!-- src/pages/Isolation.vue -->
<template>
  <div>
    <h1 class="text-h4 mb-3">Voice Isolation Test</h1>
    
    <v-row align="stretch">
      <!-- Voice Profile Selection (Column 1) -->
      <v-col cols="12" md="4" class="pa-2 d-flex">
        <v-card class="flex-grow-1">
          <v-card-title>
            <v-icon color="primary" class="mr-2">mdi-account-voice</v-icon>
            Voice Profiles
          </v-card-title>
          <v-card-text>
            <!-- Profile Selection -->
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
              <v-btn
                icon
                size="small"
                color="error"
                @click="confirmDeleteProfile(getSelectedProfile)"
                :disabled="!getSelectedProfile || isProcessing"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
            
            <v-divider class="my-4"></v-divider>
            
            <!-- Create New Profile -->
            <!-- <v-icon size="small" class="mr-1">mdi-plus</v-icon> -->
            <div class="text-subtitle-2 mb-2">
              Add New Profile
            </div>
            
            <v-text-field
              v-model="newProfileName"
              label="Profile Name"
              density="compact"
              :disabled="isProcessing || isSubmittingProfile"
            ></v-text-field>
            
            <!-- VAD Configuration for Profile Creation -->
            <v-expansion-panels class="mb-2">
              <v-expansion-panel>
                <v-expansion-panel-title class="text-caption">
                  Advanced Settings
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-checkbox
                    v-model="profileUseVAD"
                    label="Use Voice Activity Detection (VAD)"
                    density="compact"
                    hide-details
                    hint="Improves embedding quality by removing silence"
                  ></v-checkbox>
                  
                  <v-select
                    v-model="profileVADAggressiveness"
                    :items="[
                      { value: 0, title: 'Low (0) - Less filtering' },
                      { value: 1, title: 'Medium-Low (1)' },
                      { value: 2, title: 'Medium-High (2)' },
                      { value: 3, title: 'High (3) - More filtering' }
                    ]"
                    label="VAD Aggressiveness"
                    :disabled="!profileUseVAD || isProcessing || isSubmittingProfile"
                    density="compact"
                    hide-details
                    class="mt-2"
                  ></v-select>
                  
                  <p class="text-caption text-grey mt-2">
                    VAD removes silence and noise for better voice profile quality. Higher aggressiveness removes more non-speech segments.
                  </p>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            
            <v-tabs v-model="profileCreationTab" grow class="mt-2">
              <v-tab value="record" density="compact">
                <v-icon start size="small">mdi-microphone</v-icon>
                Record
              </v-tab>
              <v-tab value="import" density="compact">
                <v-icon start size="small">mdi-file-upload</v-icon>
                Import
              </v-tab>
            </v-tabs>
            
            <v-window v-model="profileCreationTab" class="mt-2">
              <!-- Recording Tab -->
              <v-window-item value="record">
                <AudioRecorder 
                  ref="profileAudioRecorder"
                  :is-processing="isSubmittingProfile"
                  @recording-complete="handleProfileRecordingComplete"
                  :disabled="isProcessing"
                />
              </v-window-item>
              
              <!-- Import Tab -->
              <v-window-item value="import">
                <v-file-input
                  v-model="profileImportedFile"
                  accept="audio/*"
                  label="Select audio file"
                  prepend-icon="mdi-file-music"
                  show-size
                  density="compact"
                  :disabled="isProcessing || isSubmittingProfile"
                  :rules="[v => !v || v.size < 50000000 || 'File size should be less than 50MB']"
                  @update:model-value="handleProfileFileImport"
                ></v-file-input>
                
                <div v-if="profileAudioPreviewUrl && profileCreationTab === 'import'" class="mt-2">
                  <p class="text-caption mb-1">Preview:</p>
                  <audio controls :src="profileAudioPreviewUrl" style="width: 100%; height: 30px;"></audio>
                </div>
              </v-window-item>
            </v-window>
            
            <v-btn
              color="success"
              block
              size="small"
              class="mt-2"
              :disabled="(!profileAudioBlob && !profileImportedFile) || !newProfileName || isSubmittingProfile || isProcessing"
              :loading="isSubmittingProfile"
              @click="createProfile"
            >
              <v-icon class="mr-1" size="small">mdi-plus</v-icon>
              Create Profile
            </v-btn>
            
            <p class="text-caption mt-2 text-grey">
              Select or create a voice profile to isolate from mixed audio.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Test Audio and Model Selection (Column 2) -->
      <v-col cols="12" md="8" class="pa-2 d-flex">
        <v-card class="flex-grow-1">
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
            
            <!-- Post-Processing Options -->
            <v-divider class="my-3"></v-divider>
            <v-expansion-panels v-model="postProcessingExpanded">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon color="primary" class="mr-2">mdi-tune</v-icon>
                    <span class="text-subtitle-1">Post-Processing Options</span>
                    <v-spacer></v-spacer>
                    <v-chip size="x-small" v-if="enabledPostProcessingCount > 0" color="primary">
                      {{ enabledPostProcessingCount }} active
                    </v-chip>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <!-- Preset Buttons -->
                  <v-row dense class="mb-2">
                    <v-col cols="12">
                      <v-chip-group v-model="selectedPreset" mandatory selected-class="v-chip--selected">
                        <v-chip
                          value="none"
                          size="small"
                          @click="applyPreset('none')"
                        >
                          No Processing
                        </v-chip>
                        <v-chip
                          value="cleanup"
                          size="small"
                          @click="applyPreset('cleanup')"
                        >
                          Cleanup Only
                        </v-chip>
                        <v-chip
                          value="clean"
                          size="small"
                          @click="applyPreset('clean')"
                        >
                          Clean Voice
                        </v-chip>
                        <v-chip
                          value="enhanced"
                          size="small"
                          @click="applyPreset('enhanced')"
                        >
                          Enhanced
                        </v-chip>
                        <v-chip
                          value="restored"
                          size="small"
                          @click="applyPreset('restored')"
                        >
                          Restored
                        </v-chip>
                      </v-chip-group>
                    </v-col>
                  </v-row>
                  
                  <!-- Individual Feature Controls -->
                  <v-expansion-panels variant="accordion" class="mt-2">
                <!-- Noise Reduction -->
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <v-checkbox
                      v-model="postProcessing.noise_reduction.enabled"
                      label="Noise Reduction"
                      @click.stop
                      hide-details
                      density="compact"
                    ></v-checkbox>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-slider
                      v-model="postProcessing.noise_reduction.strength"
                      label="Reduction Strength"
                      :min="0"
                      :max="1"
                      :step="0.1"
                      thumb-label
                      :disabled="!postProcessing.noise_reduction.enabled"
                      density="compact"
                      hint="Higher values remove more noise but may affect voice quality"
                      persistent-hint
                    ></v-slider>
                    <v-slider
                      v-model="postProcessing.noise_reduction.noise_gate_db"
                      label="Noise Gate (dB)"
                      :min="-60"
                      :max="-20"
                      :step="5"
                      thumb-label
                      :disabled="!postProcessing.noise_reduction.enabled"
                      density="compact"
                      hint="Silence sounds below this threshold"
                      persistent-hint
                    ></v-slider>
                  </v-expansion-panel-text>
                </v-expansion-panel>
                
                <!-- Audio Enhancement -->
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <v-checkbox
                      v-model="postProcessing.audio_enhancement.enabled"
                      label="Audio Enhancement"
                      @click.stop
                      hide-details
                      density="compact"
                    ></v-checkbox>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-checkbox
                      v-model="postProcessing.audio_enhancement.normalize"
                      label="Normalize Volume"
                      :disabled="!postProcessing.audio_enhancement.enabled"
                      density="compact"
                      hide-details
                    ></v-checkbox>
                    
                    <v-slider
                      v-model="postProcessing.audio_enhancement.target_loudness_db"
                      label="Target Loudness (dB)"
                      :min="-30"
                      :max="-10"
                      :step="1"
                      thumb-label
                      :disabled="!postProcessing.audio_enhancement.enabled || !postProcessing.audio_enhancement.normalize"
                      density="compact"
                      class="mt-2"
                    ></v-slider>
                    
                    <v-select
                      v-model="postProcessing.audio_enhancement.eq_preset"
                      :items="['voice', 'bright', 'warm']"
                      label="EQ Preset"
                      :disabled="!postProcessing.audio_enhancement.enabled"
                      density="compact"
                      class="mt-2"
                    ></v-select>
                    
                    <v-checkbox
                      v-model="postProcessing.audio_enhancement.compression"
                      label="Dynamic Compression"
                      :disabled="!postProcessing.audio_enhancement.enabled"
                      density="compact"
                      hide-details
                      class="mt-2"
                    ></v-checkbox>
                    
                    <v-checkbox
                      v-model="postProcessing.audio_enhancement.de_ess"
                      label="De-essing (Reduce Sibilance)"
                      :disabled="!postProcessing.audio_enhancement.enabled"
                      density="compact"
                      hide-details
                      class="mt-2"
                    ></v-checkbox>
                  </v-expansion-panel-text>
                </v-expansion-panel>
                
                <!-- Voice Clarity -->
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <v-checkbox
                      v-model="postProcessing.voice_clarity.enabled"
                      label="Voice Clarity"
                      @click.stop
                      hide-details
                      density="compact"
                    ></v-checkbox>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-checkbox
                      v-model="postProcessing.voice_clarity.enhance_formants"
                      label="Enhance Vocal Formants"
                      :disabled="!postProcessing.voice_clarity.enabled"
                      density="compact"
                      hide-details
                      hint="Boosts vocal characteristics for clarity"
                    ></v-checkbox>
                    
                    <v-slider
                      v-model="postProcessing.voice_clarity.clarity_level"
                      label="Clarity Boost Level"
                      :min="0"
                      :max="1"
                      :step="0.1"
                      thumb-label
                      :disabled="!postProcessing.voice_clarity.enabled"
                      density="compact"
                      class="mt-2"
                      hint="Controls formant boost strength (0-3 dB)"
                      persistent-hint
                    ></v-slider>
                    
                    <v-checkbox
                      v-model="postProcessing.voice_clarity.presence_boost"
                      label="Presence Boost (1-4 kHz)"
                      :disabled="!postProcessing.voice_clarity.enabled"
                      density="compact"
                      hide-details
                      class="mt-2"
                      hint="Improves speech intelligibility"
                    ></v-checkbox>
                  </v-expansion-panel-text>
                </v-expansion-panel>
                
                <!-- Voice Restoration -->
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <v-checkbox
                      v-model="postProcessing.voice_restoration.enabled"
                      label="Voice Restoration"
                      @click.stop
                      hide-details
                      density="compact"
                    ></v-checkbox>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <p class="text-caption text-grey-darken-1 mb-2">
                      Uses the selected voice profile as reference to restore voice characteristics
                    </p>
                    <v-slider
                      v-model="postProcessing.voice_restoration.restore_strength"
                      label="Restoration Strength"
                      :min="0"
                      :max="1"
                      :step="0.1"
                      thumb-label
                      :disabled="!postProcessing.voice_restoration.enabled"
                      density="compact"
                      hint="How strongly to match the profile's voice characteristics"
                      persistent-hint
                    ></v-slider>
                  </v-expansion-panel-text>
                </v-expansion-panel>
                
                <!-- Voice Isolation Cleanup -->
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <v-checkbox
                      v-model="postProcessing.voice_isolation_cleanup.enabled"
                      label="Voice Isolation Cleanup"
                      @click.stop
                      hide-details
                      density="compact"
                    ></v-checkbox>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <p class="text-caption text-grey-darken-1 mb-2">
                      Advanced cleanup to remove unwanted audio bleed-through and enhance isolated voice quality
                    </p>
                    
                    <v-slider
                      v-model="postProcessing.voice_isolation_cleanup.energy_threshold"
                      label="Energy Threshold"
                      :min="0.01"
                      :max="0.1"
                      :step="0.01"
                      thumb-label
                      :disabled="!postProcessing.voice_isolation_cleanup.enabled"
                      density="compact"
                      hint="Higher values remove more low-energy segments (more aggressive)"
                      persistent-hint
                    ></v-slider>
                    
                    <v-slider
                      v-model="postProcessing.voice_isolation_cleanup.min_speech_duration"
                      label="Min Speech Duration (seconds)"
                      :min="0.1"
                      :max="1.0"
                      :step="0.1"
                      thumb-label
                      :disabled="!postProcessing.voice_isolation_cleanup.enabled"
                      density="compact"
                      class="mt-2"
                      hint="Minimum duration to consider as valid speech"
                      persistent-hint
                    ></v-slider>
                    
                    <v-checkbox
                      v-model="postProcessing.voice_isolation_cleanup.spectral_gating"
                      label="Spectral Gating"
                      :disabled="!postProcessing.voice_isolation_cleanup.enabled"
                      density="compact"
                      hide-details
                      class="mt-2"
                      hint="Focus on voice-specific frequencies"
                    ></v-checkbox>
                    
                    <v-checkbox
                      v-model="postProcessing.voice_isolation_cleanup.harmonic_enhancement"
                      label="Harmonic Enhancement"
                      :disabled="!postProcessing.voice_isolation_cleanup.enabled"
                      density="compact"
                      hide-details
                      class="mt-2"
                      hint="Enhance voice harmonics for clearer speech"
                    ></v-checkbox>
                  </v-expansion-panel-text>
                </v-expansion-panel>
                  </v-expansion-panels>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            
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
    </v-row>
    
    <!-- Results Section (Full Width Below) -->
    <v-row v-if="result" class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
            Voice Isolation Results
          </v-card-title>
          <v-card-text>
            <div class="mb-3">
              <p class="text-body-2 mb-1">
                Match confidence: <strong>{{ (result.similarity * 100).toFixed(1) }}%</strong>
              </p>
              <v-progress-linear
                :model-value="result.similarity * 100"
                :color="getSimilarityColor(result.similarity)"
                height="8"
                rounded
              ></v-progress-linear>
            </div>
            
            <v-tabs v-model="activeResultTab">
              <v-tab value="comparison">Compare</v-tab>
              <v-tab value="original">Original</v-tab>
              <v-tab value="isolated">Isolated</v-tab>
              <v-tab value="visualization">Visualize</v-tab>
              <v-tab value="metrics">Metrics</v-tab>
            </v-tabs>
            
            <v-window v-model="activeResultTab" class="mt-2">
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
                      
                      <v-divider class="my-2"></v-divider>
                      
                      <div class="px-4 py-2">
                        <SimpleAudioGraph
                          v-if="result.mixed_audio_path"
                          :audio-path="result.mixed_audio_path"
                          graph-type="waveform"
                          :height="60"
                          color="#9e9e9e"
                        />
                      </div>
                      
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
                      
                      <v-divider class="my-2"></v-divider>
                      
                      <div class="px-4 py-2">
                        <SimpleAudioGraph
                          v-if="result.file_path"
                          :audio-path="result.file_path"
                          graph-type="waveform"
                          :height="60"
                          color="#4caf50"
                        />
                      </div>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-window-item>
              
              <!-- Visualization Tab -->
              <v-window-item value="visualization">
                <div v-if="result">
                  <!-- Quick Visualization Type Selector -->
                  <v-select
                    v-model="selectedVisualizationType"
                    :items="visualizationTypes"
                    label="Visualization Type"
                    density="compact"
                    variant="outlined"
                    class="mb-3"
                    hide-details
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props">
                        <v-list-item-title>{{ item.title }}</v-list-item-title>
                        <v-list-item-subtitle class="text-caption">{{ item.subtitle }}</v-list-item-subtitle>
                      </v-list-item>
                    </template>
                  </v-select>
                  
                  <AudioVisualization
                    :audio-path="result.file_path"
                    :comparison-audio-path="result.mixed_audio_path"
                    :show-analysis="true"
                    ref="audioVisualization"
                  />
                </div>
              </v-window-item>
              
              <!-- Metrics Tab -->
              <v-window-item value="metrics">
                <MetricsDisplay
                  v-if="result && result.metrics"
                  :metrics="result.metrics"
                />
                <v-card v-else flat>
                  <v-card-text>
                    <v-alert type="info" variant="tonal">
                      No metrics data available for this result.
                    </v-alert>
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
      </v-col>
    </v-row>
    
    <!-- Empty State -->
    <v-row v-else class="mt-4">
      <v-col cols="12">
        <v-card class="d-flex align-center justify-center" style="min-height: 400px;">
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
    
    <!-- Results History Section -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon color="primary" class="mr-2">mdi-history</v-icon>
            Processing History
            <v-spacer></v-spacer>
            <v-btn
              v-if="isolationHistory.length > 0"
              color="error"
              size="small"
              variant="outlined"
              @click="confirmDeleteAllHistory"
              class="mr-2"
            >
              <v-icon start>mdi-delete-sweep</v-icon>
              Clear History
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="historySearch"
              append-icon="mdi-magnify"
              label="Search history"
              single-line
              density="compact"
              hide-details
              variant="outlined"
              class="mb-4"
            ></v-text-field>
            
            <v-data-table
              :headers="historyHeaders"
              :items="isolationHistory"
              :search="historySearch"
              :loading="loadingHistory"
              loading-text="Loading history..."
              :items-per-page="10"
              density="compact"
              class="results-history-table"
              :footer-props="{
                'items-per-page-options': [10, 20, 50, -1],
                'items-per-page-text': 'Records per page',
                'class': 'text-caption'
              }"
            >
              <!-- Profile column -->
              <template v-slot:item.profile="{ item }">
                <div class="d-flex align-center">
                  <v-avatar color="primary" size="32" class="mr-2">
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
                  size="small"
                  label
                >
                  {{ (item.similarity * 100).toFixed(1) }}%
                </v-chip>
              </template>
              
              <!-- Models column -->
              <template v-slot:item.models="{ item }">
                <v-tooltip bottom>
                  <template v-slot:activator="{ props }">
                    <div v-bind="props" class="text-truncate" style="max-width: 200px;">
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
                      size="small"
                      v-bind="props"
                    >
                      <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="playHistoryItem(item, 'profile')">
                      <v-list-item-title>
                        <v-icon size="small" start>mdi-account-voice</v-icon>
                        Play Profile
                      </v-list-item-title>
                    </v-list-item>
                    
                    <v-list-item @click="playHistoryItem(item, 'isolated')">
                      <v-list-item-title>
                        <v-icon size="small" start>mdi-music</v-icon>
                        Play Isolated
                      </v-list-item-title>
                    </v-list-item>
                    
                    <v-list-item @click="playHistoryItem(item, 'mixed')">
                      <v-list-item-title>
                        <v-icon size="small" start>mdi-waveform</v-icon>
                        Play Mixed Audio
                      </v-list-item-title>
                    </v-list-item>
                    
                    <v-divider class="my-1"></v-divider>
                    
                    <v-list-item @click="viewHistoryDetails(item)">
                      <v-list-item-title>
                        <v-icon size="small" start>mdi-information-outline</v-icon>
                        View Details
                      </v-list-item-title>
                    </v-list-item>
                    
                    <v-list-item @click="deleteHistoryItem(item)">
                      <v-list-item-title class="text-error">
                        <v-icon size="small" start color="error">mdi-delete</v-icon>
                        Delete
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
              
              <template v-slot:no-data>
                <div class="text-center pa-4">
                  <v-icon size="48" color="grey-lighten-1">mdi-history</v-icon>
                  <p class="text-body-2 mt-2">No processing history yet</p>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
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
    <v-dialog v-model="historyDialog" max-width="900px" scrollable>
      <v-card>
        <v-card-title>
          <v-icon start color="info">mdi-information-outline</v-icon>
          Isolation Details - {{ selectedHistoryItem?.profile }}
          <v-spacer></v-spacer>
          <v-btn
            icon
            variant="text"
            @click="historyDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text v-if="selectedHistoryItem" class="pa-0">
          <!-- Match Confidence Bar -->
          <div class="px-6 pt-4 pb-2">
            <p class="text-body-2 mb-1">
              Match confidence: <strong>{{ (selectedHistoryItem.similarity * 100).toFixed(1) }}%</strong>
            </p>
            <v-progress-linear
              :model-value="selectedHistoryItem.similarity * 100"
              :color="getSimilarityColor(selectedHistoryItem.similarity)"
              height="8"
              rounded
            ></v-progress-linear>
          </div>
          
          <!-- Tabs for different views -->
          <v-tabs v-model="historyDetailTab" class="px-4">
            <v-tab value="overview">Overview</v-tab>
            <v-tab value="comparison">Audio Comparison</v-tab>
            <v-tab value="metrics" v-if="selectedHistoryItem.metrics">Metrics</v-tab>
            <v-tab value="visualization">Visualization</v-tab>
          </v-tabs>
          
          <v-window v-model="historyDetailTab" class="mt-2">
            <!-- Overview Tab -->
            <v-window-item value="overview">
              <div class="pa-4">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-list density="compact">
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon>mdi-calendar</v-icon>
                        </template>
                        <v-list-item-title>Date</v-list-item-title>
                        <v-list-item-subtitle>{{ formatDate(selectedHistoryItem.date) }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon>mdi-file</v-icon>
                        </template>
                        <v-list-item-title>Output File</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedHistoryItem.fileName }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon>mdi-timer</v-icon>
                        </template>
                        <v-list-item-title>Processing Time</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedHistoryItem.processingTime }} seconds</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <v-list density="compact">
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon>mdi-brain</v-icon>
                        </template>
                        <v-list-item-title>Separation Model</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedHistoryItem.separationModel || 'convtasnet' }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon>mdi-vector-polyline</v-icon>
                        </template>
                        <v-list-item-title>Embedding Model</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedHistoryItem.embeddingModel || 'resemblyzer' }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item v-if="selectedHistoryItem.useVad">
                        <template v-slot:prepend>
                          <v-icon>mdi-waveform</v-icon>
                        </template>
                        <v-list-item-title>VAD Processor</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedHistoryItem.vadProcessor || 'webrtcvad' }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-col>
                </v-row>
              </div>
            </v-window-item>
            
            <!-- Audio Comparison Tab -->
            <v-window-item value="comparison">
              <div class="pa-4">
                <v-list density="compact">
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-avatar color="primary" size="28">
                        <span class="text-caption text-white">{{ selectedHistoryItem.profile.charAt(0) }}</span>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="text-caption">Profile Sample</v-list-item-title>
                    <template v-slot:append>
                      <audio controls :src="selectedHistoryItem.profileAudioUrl" style="max-width: 300px;"></audio>
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
                      <audio controls :src="selectedHistoryItem.mixedAudioUrl" style="max-width: 300px;"></audio>
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
                      <audio controls :src="selectedHistoryItem.isolatedAudioUrl" style="max-width: 300px;"></audio>
                    </template>
                  </v-list-item>
                  
                  <v-divider class="my-2"></v-divider>
                  
                  <!-- Mixed Audio Waveform -->
                  <div class="text-caption text-grey ml-4 mb-1">Mixed Audio Waveform</div>
                  <div class="px-4 py-2" v-if="selectedHistoryItem.mixedAudioPath">
                    <SimpleAudioGraph
                      :audio-path="selectedHistoryItem.mixedAudioPath"
                      graph-type="waveform"
                      :height="80"
                      color="#9e9e9e"
                    />
                  </div>
                  
                  <!-- Isolated Voice Waveform -->
                  <div class="text-caption text-grey ml-4 mb-1 mt-3">Isolated Voice Waveform</div>
                  <div class="px-4 py-2" v-if="selectedHistoryItem.isolatedPath || selectedHistoryItem.filePath">
                    <SimpleAudioGraph
                      :audio-path="selectedHistoryItem.isolatedPath || selectedHistoryItem.filePath"
                      graph-type="waveform"
                      :height="80"
                      color="#4caf50"
                    />
                  </div>
                  
                  <!-- Debug info - remove in production -->
                  <div v-if="false" class="text-caption pa-2">
                    Debug: isolatedPath={{ selectedHistoryItem.isolatedPath }}, filePath={{ selectedHistoryItem.filePath }}
                  </div>
                </v-list>
              </div>
            </v-window-item>
            
            <!-- Metrics Tab -->
            <v-window-item value="metrics">
              <div class="pa-4">
                <MetricsDisplay
                  v-if="selectedHistoryItem.metrics"
                  :metrics="selectedHistoryItem.metrics"
                />
                <v-alert v-else type="info" variant="tonal">
                  Metrics data not available for this history item.
                </v-alert>
              </div>
            </v-window-item>
            
            <!-- Visualization Tab -->
            <v-window-item value="visualization">
              <div class="pa-4">
                <AudioVisualization
                  v-if="selectedHistoryItem.isolatedPath || selectedHistoryItem.filePath"
                  :audio-path="selectedHistoryItem.isolatedPath || selectedHistoryItem.filePath"
                  :comparison-audio-path="selectedHistoryItem.mixedAudioPath"
                  :show-analysis="true"
                />
                <v-alert v-else type="info" variant="tonal">
                  Audio visualization not available for this history item.
                </v-alert>
              </div>
            </v-window-item>
          </v-window>
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
    
    <!-- Delete Profile Confirmation Dialog -->
    <v-dialog v-model="deleteProfileDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <v-icon start color="error">mdi-delete</v-icon>
          Delete Profile
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete the profile for {{ profileToDelete?.name }}?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="deleteProfileDialog = false">Cancel</v-btn>
          <v-btn 
            color="error" 
            @click="deleteProfile"
            :loading="isDeletingProfile"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete All History Confirmation Dialog -->
    <v-dialog v-model="deleteAllHistoryDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon color="error" class="mr-2">mdi-alert</v-icon>
          Clear Processing History
        </v-card-title>
        <v-card-text>
          <v-alert type="warning" variant="tonal" class="mb-4">
            This action cannot be undone!
          </v-alert>
          <p>
            Are you sure you want to delete <strong>ALL {{ isolationHistory.length }} history records</strong>?
          </p>
          <p class="mt-2">
            This will permanently remove all processing history from this session.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="deleteAllHistoryDialog = false">Cancel</v-btn>
          <v-btn 
            color="error" 
            variant="flat"
            @click="deleteAllHistory"
            :loading="isDeletingAllHistory"
          >
            Clear All History
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
  </div>
</template>

<script>
import AudioRecorder from '../components/AudioRecorder.vue'
import AudioVisualization from '../components/AudioVisualization.vue'
import SimpleAudioGraph from '../components/SimpleAudioGraph.vue'
import MetricsDisplay from '../components/MetricsDisplay.vue'
import API from '../resources/api.js'

export default {
  name: 'IsolationPage',
  components: {
    AudioRecorder,
    AudioVisualization,
    SimpleAudioGraph,
    MetricsDisplay
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
      historyDetailTab: 'metrics',
      selectedHistoryItem: null,
      historyAudioDialog: false,
      historyAudioUrl: null,
      historyAudioTitle: '',
      deleteHistoryDialog: false,
      deleteAllHistoryDialog: false,
      itemToDelete: null,
      isDeleting: false,
      isDeletingAllHistory: false,
      
      // Profile creation
      newProfileName: '',
      newProfileCategory: '',
      profileAudioBlob: null,
      profileImportedFile: null,
      profileAudioPreviewUrl: null,
      profileCreationTab: 'record',
      isSubmittingProfile: false,
      profileUseVAD: true,
      profileVADAggressiveness: 2,
      
      // Profile deletion
      deleteProfileDialog: false,
      profileToDelete: null,
      isDeletingProfile: false,
      
      // Visualization options
      selectedVisualizationType: 'waveform',
      visualizationTypes: [
        { 
          value: 'waveform', 
          title: 'Waveform',
          subtitle: 'Time domain amplitude view'
        },
        { 
          value: 'spectrogram', 
          title: 'Spectrogram',
          subtitle: 'Time-frequency heat map'
        },
        { 
          value: 'frequency', 
          title: 'Frequency Spectrum',
          subtitle: 'Frequency analysis with voice focus (80-4000 Hz)'
        },
        { 
          value: 'frequency_response', 
          title: 'Frequency Response',
          subtitle: 'Averaged frequency response curve'
        }
      ],
      
      // Post-processing
      selectedPreset: 'none',
      postProcessingExpanded: undefined, // undefined = closed by default
      postProcessing: {
        noise_reduction: {
          enabled: false,
          strength: 0.5,
          noise_gate_db: -40
        },
        audio_enhancement: {
          enabled: false,
          normalize: true,
          target_loudness_db: -20,
          eq_preset: 'voice',
          compression: true,
          de_ess: true
        },
        voice_clarity: {
          enabled: false,
          clarity_level: 0.5,
          enhance_formants: true,
          presence_boost: true
        },
        voice_restoration: {
          enabled: false,
          restore_strength: 0.5
        },
        voice_isolation_cleanup: {
          enabled: false,
          energy_threshold: 0.02,
          min_speech_duration: 0.3,
          spectral_gating: true,
          harmonic_enhancement: true
        }
      }
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
    },
    enabledPostProcessingCount() {
      return Object.keys(this.postProcessing).filter(
        key => this.postProcessing[key].enabled
      ).length
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
    },
    selectedVisualizationType(newVal) {
      // Update the AudioVisualization component to show the selected type
      if (this.$refs.audioVisualization) {
        this.$refs.audioVisualization.activeVisualization = newVal
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
      
      // Append post-processing configuration
      const enabledProcessing = []
      const processingParams = {}
      
      if (this.postProcessing.noise_reduction.enabled) {
        enabledProcessing.push('noise_reduction')
        processingParams.noise_reduction = {
          reduction_factor: this.postProcessing.noise_reduction.strength,
          noise_gate_db: this.postProcessing.noise_reduction.noise_gate_db
        }
      }
      
      if (this.postProcessing.audio_enhancement.enabled) {
        enabledProcessing.push('audio_enhancement')
        processingParams.audio_enhancement = {
          normalize: this.postProcessing.audio_enhancement.normalize,
          target_loudness_db: this.postProcessing.audio_enhancement.target_loudness_db,
          eq_preset: this.postProcessing.audio_enhancement.eq_preset,
          compression: this.postProcessing.audio_enhancement.compression,
          de_ess: this.postProcessing.audio_enhancement.de_ess
        }
      }
      
      if (this.postProcessing.voice_clarity.enabled) {
        enabledProcessing.push('voice_clarity')
        processingParams.voice_clarity = {
          enhance_formants: this.postProcessing.voice_clarity.enhance_formants,
          formant_boost_db: Math.round(3 * this.postProcessing.voice_clarity.clarity_level),
          presence_boost: this.postProcessing.voice_clarity.presence_boost
        }
      }
      
      if (this.postProcessing.voice_restoration.enabled) {
        enabledProcessing.push('voice_restoration')
        // Voice restoration uses the profile_id which is already in the formData
        processingParams.voice_restoration = {}
      }
      
      if (this.postProcessing.voice_isolation_cleanup.enabled) {
        enabledProcessing.push('voice_isolation_cleanup')
        processingParams.voice_isolation_cleanup = {
          energy_threshold: this.postProcessing.voice_isolation_cleanup.energy_threshold,
          min_speech_duration: this.postProcessing.voice_isolation_cleanup.min_speech_duration,
          spectral_gating: this.postProcessing.voice_isolation_cleanup.spectral_gating,
          harmonic_enhancement: this.postProcessing.voice_isolation_cleanup.harmonic_enhancement
        }
      }
      
      if (enabledProcessing.length > 0) {
        formData.append('post_processing', enabledProcessing.join(','))
        formData.append('post_processing_params', JSON.stringify(processingParams))
      }
      
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
        isolatedPath: result.file_path,
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
        vadProcessor: result.vad_processor || this.selectedVADProcessor,
        
        // Add metrics if available
        metrics: result.metrics || null,
        
        // Add post-processing information
        postProcessing: JSON.parse(JSON.stringify(this.postProcessing)),
        postProcessingEnabled: Object.keys(this.postProcessing).filter(
          key => this.postProcessing[key].enabled
        )
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
      // Set default tab based on whether metrics are available
      this.historyDetailTab = item.metrics ? 'metrics' : 'overview'
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
    
    confirmDeleteAllHistory() {
      this.deleteAllHistoryDialog = true
    },
    
    deleteAllHistory() {
      this.isDeletingAllHistory = true
      
      // Clear all history
      this.isolationHistory = []
      
      // Save empty history to storage
      this.saveHistoryToStorage()
      
      // Reset state
      this.isDeletingAllHistory = false
      this.deleteAllHistoryDialog = false
      
      // Show success message
      alert('Processing history has been cleared.')
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
    },
    
    // Profile creation methods
    handleProfileRecordingComplete(blob) {
      this.profileAudioBlob = blob
      // Clear import tab data if recording is used
      if (this.profileImportedFile) {
        this.profileImportedFile = null
        this.profileAudioPreviewUrl = null
      }
    },
    
    handleProfileFileImport(file) {
      if (!file) {
        this.profileAudioPreviewUrl = null
        return
      }
      
      // Clear recording tab data if import is used
      if (this.profileAudioBlob) {
        this.profileAudioBlob = null
        if (this.$refs.profileAudioRecorder) {
          this.$refs.profileAudioRecorder.resetRecording()
        }
      }
      
      // Create audio preview URL
      if (this.profileAudioPreviewUrl) {
        URL.revokeObjectURL(this.profileAudioPreviewUrl)
      }
      this.profileAudioPreviewUrl = URL.createObjectURL(file)
    },
    
    createProfile() {
      if (!this.newProfileName || (!this.profileAudioBlob && !this.profileImportedFile)) {
        alert('Please provide a name and either record or import audio.')
        return
      }
      
      this.isSubmittingProfile = true
      
      const formData = new FormData()
      formData.append('name', this.newProfileName)
      if (this.newProfileCategory) {
        formData.append('category', this.newProfileCategory)
      }
      
      // Add VAD parameters
      formData.append('use_vad', this.profileUseVAD)
      if (this.profileUseVAD) {
        formData.append('vad_aggressiveness', this.profileVADAggressiveness)
      }
      
      // Append either recorded blob or imported file
      if (this.profileAudioBlob) {
        formData.append('audio_file', this.profileAudioBlob, `${this.newProfileName.replace(/\s+/g, '_')}.wav`)
      } else if (this.profileImportedFile) {
        formData.append('audio_file', this.profileImportedFile, this.profileImportedFile.name)
      }
      
      API.createProfile(formData)
        .then(response => {
          // Add new profile to the list
          this.profiles.push(response.data)
          
          // Auto-select the newly created profile
          this.selectedProfileId = response.data.id
          
          // Reset the form
          this.resetProfileForm()
          
          // Show success message
          alert(`Profile "${response.data.name}" created successfully!`)
        })
        .catch(error => {
          console.error('Error creating profile:', error)
          alert('Failed to create profile. Please try again.')
        })
        .finally(() => {
          this.isSubmittingProfile = false
        })
    },
    
    resetProfileForm() {
      this.newProfileName = ''
      this.newProfileCategory = ''
      this.profileAudioBlob = null
      this.profileImportedFile = null
      this.profileUseVAD = true
      this.profileVADAggressiveness = 2
      
      if (this.profileAudioPreviewUrl) {
        URL.revokeObjectURL(this.profileAudioPreviewUrl)
        this.profileAudioPreviewUrl = null
      }
      
      if (this.$refs.profileAudioRecorder) {
        this.$refs.profileAudioRecorder.resetRecording()
      }
      
      this.profileCreationTab = 'record'
    },
    
    // Profile deletion methods
    confirmDeleteProfile(profile) {
      this.profileToDelete = profile
      this.deleteProfileDialog = true
    },
    
    deleteProfile() {
      if (!this.profileToDelete) return
      
      this.isDeletingProfile = true
      
      API.deleteProfile(this.profileToDelete.id)
        .then(() => {
          // Remove from profiles array
          this.profiles = this.profiles.filter(p => p.id !== this.profileToDelete.id)
          
          // If the deleted profile was selected, clear selection
          if (this.selectedProfileId === this.profileToDelete.id) {
            this.selectedProfileId = null
          }
          
          // Close dialog and reset
          this.deleteProfileDialog = false
          this.profileToDelete = null
          
          alert('Profile deleted successfully!')
        })
        .catch(error => {
          console.error('Error deleting profile:', error)
          alert('Failed to delete profile. Please try again.')
        })
        .finally(() => {
          this.isDeletingProfile = false
        })
    },
    
    // Post-processing preset methods
    applyPreset(preset) {
      this.selectedPreset = preset
      
      switch (preset) {
        case 'none':
          // Disable all post-processing
          this.postProcessing.noise_reduction.enabled = false
          this.postProcessing.audio_enhancement.enabled = false
          this.postProcessing.voice_clarity.enabled = false
          this.postProcessing.voice_restoration.enabled = false
          this.postProcessing.voice_isolation_cleanup.enabled = false
          break
          
        case 'cleanup':
          // Cleanup only: just voice isolation cleanup
          this.postProcessing.noise_reduction.enabled = false
          this.postProcessing.audio_enhancement.enabled = false
          this.postProcessing.voice_clarity.enabled = false
          this.postProcessing.voice_restoration.enabled = false
          this.postProcessing.voice_isolation_cleanup.enabled = true
          this.postProcessing.voice_isolation_cleanup.energy_threshold = 0.02
          this.postProcessing.voice_isolation_cleanup.min_speech_duration = 0.3
          this.postProcessing.voice_isolation_cleanup.spectral_gating = true
          this.postProcessing.voice_isolation_cleanup.harmonic_enhancement = true
          break
          
        case 'clean':
          // Clean Voice: noise reduction + voice clarity + cleanup
          this.postProcessing.noise_reduction.enabled = true
          this.postProcessing.noise_reduction.strength = 0.7
          this.postProcessing.noise_reduction.noise_gate_db = -40
          this.postProcessing.audio_enhancement.enabled = false
          this.postProcessing.voice_clarity.enabled = true
          this.postProcessing.voice_clarity.clarity_level = 0.5
          this.postProcessing.voice_clarity.enhance_formants = true
          this.postProcessing.voice_clarity.presence_boost = true
          this.postProcessing.voice_restoration.enabled = false
          this.postProcessing.voice_isolation_cleanup.enabled = true
          this.postProcessing.voice_isolation_cleanup.energy_threshold = 0.02
          this.postProcessing.voice_isolation_cleanup.min_speech_duration = 0.3
          this.postProcessing.voice_isolation_cleanup.spectral_gating = true
          this.postProcessing.voice_isolation_cleanup.harmonic_enhancement = true
          break
          
        case 'enhanced':
          // Enhanced: noise reduction + audio enhancement + voice clarity + cleanup
          this.postProcessing.noise_reduction.enabled = true
          this.postProcessing.noise_reduction.strength = 0.5
          this.postProcessing.noise_reduction.noise_gate_db = -40
          this.postProcessing.audio_enhancement.enabled = true
          this.postProcessing.audio_enhancement.normalize = true
          this.postProcessing.audio_enhancement.target_loudness_db = -20
          this.postProcessing.audio_enhancement.eq_preset = 'voice'
          this.postProcessing.audio_enhancement.compression = true
          this.postProcessing.audio_enhancement.de_ess = true
          this.postProcessing.voice_clarity.enabled = true
          this.postProcessing.voice_clarity.clarity_level = 0.7
          this.postProcessing.voice_clarity.enhance_formants = true
          this.postProcessing.voice_clarity.presence_boost = true
          this.postProcessing.voice_restoration.enabled = false
          this.postProcessing.voice_isolation_cleanup.enabled = true
          this.postProcessing.voice_isolation_cleanup.energy_threshold = 0.03
          this.postProcessing.voice_isolation_cleanup.min_speech_duration = 0.3
          this.postProcessing.voice_isolation_cleanup.spectral_gating = true
          this.postProcessing.voice_isolation_cleanup.harmonic_enhancement = true
          break
          
        case 'restored':
          // Restored: all features for damaged audio including aggressive cleanup
          this.postProcessing.noise_reduction.enabled = true
          this.postProcessing.noise_reduction.strength = 0.8
          this.postProcessing.noise_reduction.noise_gate_db = -45
          this.postProcessing.audio_enhancement.enabled = true
          this.postProcessing.audio_enhancement.normalize = true
          this.postProcessing.audio_enhancement.target_loudness_db = -18
          this.postProcessing.audio_enhancement.eq_preset = 'voice'
          this.postProcessing.audio_enhancement.compression = true
          this.postProcessing.audio_enhancement.de_ess = true
          this.postProcessing.voice_clarity.enabled = true
          this.postProcessing.voice_clarity.clarity_level = 0.8
          this.postProcessing.voice_clarity.enhance_formants = true
          this.postProcessing.voice_clarity.presence_boost = true
          this.postProcessing.voice_restoration.enabled = true
          this.postProcessing.voice_restoration.restore_strength = 0.7
          this.postProcessing.voice_isolation_cleanup.enabled = true
          this.postProcessing.voice_isolation_cleanup.energy_threshold = 0.05
          this.postProcessing.voice_isolation_cleanup.min_speech_duration = 0.4
          this.postProcessing.voice_isolation_cleanup.spectral_gating = true
          this.postProcessing.voice_isolation_cleanup.harmonic_enhancement = true
          break
      }
    }
  }
}
</script>

<style scoped>
.results-history-table {
  max-height: 600px;
  overflow-y: auto;
}

.v-chip--selected {
  background-color: rgb(var(--v-theme-primary)) !important;
  color: white !important;
}

/* Remove fixed heights for better responsive layout */
@media (max-width: 960px) {
  .v-card {
    height: auto !important;
  }
}
</style>