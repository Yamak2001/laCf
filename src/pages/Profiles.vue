<!-- src/pages/Profiles.vue -->
<template>
  <div>
    <h1 class="text-h3 mb-4">Voice Profile Management</h1>
    
    <v-card class="mb-6">
      <v-card-title>Create New Voice Profile</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submitProfile">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="profileName"
                label="Name"
                required
                :rules="[v => !!v || 'Name is required']"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model="category"
                label="Category (optional)"
                hint="e.g., Family, Medical, Friends"
              ></v-text-field>
            </v-col>
          </v-row>
          
          <v-card flat class="mt-2 pa-4 bg-grey-lighten-4">
            <v-card-title class="px-0">Voice Sample</v-card-title>
            <p class="text-subtitle-2 mb-4">Please record a clear voice sample (30-60 seconds) or import an existing audio file</p>
            
            <v-tabs v-model="activeTab" grow>
              <v-tab value="record">
                <v-icon start>mdi-microphone</v-icon>
                Record
              </v-tab>
              <v-tab value="import">
                <v-icon start>mdi-file-upload</v-icon>
                Import
              </v-tab>
            </v-tabs>
            
            <v-window v-model="activeTab" class="mt-4">
              <!-- Recording Tab -->
              <v-window-item value="record">
                <AudioRecorder 
                  ref="audioRecorder"
                  :is-processing="isSubmitting"
                  @recording-complete="handleRecordingComplete"
                />
              </v-window-item>
              
              <!-- Import Tab -->
              <v-window-item value="import">
                <div class="py-4">
                  <v-file-input
                    v-model="importedFile"
                    accept="audio/*"
                    label="Select audio file"
                    prepend-icon="mdi-file-music"
                    show-size
                    :rules="[v => !v || v.size < 50000000 || 'File size should be less than 50MB']"
                    @update:model-value="handleFileImport"
                  ></v-file-input>
                  
                  <div v-if="audioPreviewUrl" class="mt-4">
                    <p class="text-subtitle-2 mb-2">Preview:</p>
                    <audio controls :src="audioPreviewUrl" style="width: 100%"></audio>
                  </div>
                </div>
              </v-window-item>
            </v-window>
          </v-card>
          
          <v-btn
            color="primary"
            type="submit"
            class="mt-4"
            :disabled="(!audioBlob && !importedFile) || isSubmitting"
            :loading="isSubmitting"
          >
            Create Profile
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
    
    <v-card>
      <v-card-title>
        Voice Profiles
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search"
          single-line
          hide-details
        ></v-text-field>
      </v-card-title>
      
      <v-data-table
        :headers="headers"
        :items="profiles"
        :search="search"
        :loading="loading"
        loading-text="Loading profiles..."
      >
        <!-- Name column -->
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center">
            <v-avatar color="primary" size="36" class="mr-2">
              <span class="text-h6 text-white">{{ item.name.charAt(0) }}</span>
            </v-avatar>
            {{ item.name }}
          </div>
        </template>
        
        <!-- Created at column -->
        <template v-slot:item.created_at="{ item }">
          {{ new Date(item.created_at).toLocaleString() }}
        </template>
        
        <!-- Actions column -->
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            size="small"
            color="info"
            @click="playAudio(item)"
          >
            <v-icon>mdi-play</v-icon>
          </v-btn>
          
          <v-btn
            icon
            size="small"
            color="error"
            @click="confirmDelete(item)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
    
    <!-- Audio Player Dialog -->
    <v-dialog v-model="audioDialog" max-width="500px">
      <v-card>
        <v-card-title>
          Voice Sample: {{ selectedProfile?.name }}
        </v-card-title>
        <v-card-text>
          <audio controls :src="audioSrc" style="width: 100%"></audio>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="audioDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title>
          Delete Profile
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete the profile for {{ selectedProfile?.name }}?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn 
            color="error" 
            @click="deleteProfile"
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
  name: 'ProfilesPage',
  components: {
    AudioRecorder
  },
  data() {
    return {
      // Profile creation
      profileName: '',
      category: '',
      audioBlob: null,
      isSubmitting: false,
      activeTab: 'record',
      importedFile: null,
      audioPreviewUrl: null,
      
      // Profiles table
      search: '',
      profiles: [],
      loading: true,
      headers: [
        { title: 'Name', key: 'name', sortable: true },
        { title: 'Category', key: 'category', sortable: true },
        { title: 'Created', key: 'created_at', sortable: true },
        { title: 'Actions', key: 'actions', sortable: false }
      ],
      
      // Dialogs
      audioDialog: false,
      deleteDialog: false,
      selectedProfile: null,
      audioSrc: '',
      isDeleting: false
    }
  },
  mounted() {
    this.fetchProfiles()
  },
  methods: {
    fetchProfiles() {
      this.loading = true
      API.getProfiles()
        .then(response => {
          this.profiles = response.data
        })
        .catch(error => {
          console.error('Error fetching profiles:', error)
        })
        .finally(() => {
          this.loading = false
        })
    },
    
    handleRecordingComplete(blob) {
      this.audioBlob = blob
      // Clear import tab data if recording is used
      if (this.importedFile) {
        this.importedFile = null
        this.audioPreviewUrl = null
      }
    },
    
    handleFileImport(file) {
      if (!file) {
        this.audioPreviewUrl = null
        return
      }
      
      // Clear recording tab data if import is used
      if (this.audioBlob) {
        this.audioBlob = null
        if (this.$refs.audioRecorder) {
          this.$refs.audioRecorder.resetRecording()
        }
      }
      
      // Create audio preview URL
      if (this.audioPreviewUrl) {
        URL.revokeObjectURL(this.audioPreviewUrl)
      }
      this.audioPreviewUrl = URL.createObjectURL(file)
    },
    
    submitProfile() {
      if (!this.profileName || (!this.audioBlob && !this.importedFile)) {
        alert('Please provide a name and either record or import audio.')
        return
      }
      
      this.isSubmitting = true
      
      const formData = new FormData()
      formData.append('name', this.profileName)
      if (this.category) {
        formData.append('category', this.category)
      }
      
      // Append either recorded blob or imported file
      if (this.audioBlob) {
        formData.append('audio_file', this.audioBlob, `${this.profileName.replace(/\s+/g, '_')}.wav`)
      } else if (this.importedFile) {
        formData.append('audio_file', this.importedFile, this.importedFile.name)
      }
      
      API.createProfile(formData)
        .then(response => {
          this.profiles.push(response.data)
          this.resetForm()
        })
        .catch(error => {
          console.error('Error creating profile:', error)
          alert('Failed to create profile. Please try again.')
        })
        .finally(() => {
          this.isSubmitting = false
        })
    },
    
    resetForm() {
      this.profileName = ''
      this.category = ''
      this.audioBlob = null
      this.importedFile = null
      
      if (this.audioPreviewUrl) {
        URL.revokeObjectURL(this.audioPreviewUrl)
        this.audioPreviewUrl = null
      }
      
      if (this.$refs.audioRecorder) {
        this.$refs.audioRecorder.resetRecording()
      }
    },
    
    playAudio(profile) {
      this.selectedProfile = profile
      
      // Extract just the filename from the full path
      const filename = profile.file_path.split('/').pop()
      
      // Construct URL to the static file endpoint
      this.audioSrc = `http://localhost:8000/data/audio/${filename}`
      
      this.audioDialog = true
    },
    
    confirmDelete(profile) {
      this.selectedProfile = profile
      this.deleteDialog = true
    },
    
    deleteProfile() {
      if (!this.selectedProfile) return
      
      this.isDeleting = true
      
      API.deleteProfile(this.selectedProfile.id)
        .then(() => {
          this.profiles = this.profiles.filter(p => p.id !== this.selectedProfile.id)
          this.deleteDialog = false
          this.selectedProfile = null
        })
        .catch(error => {
          console.error('Error deleting profile:', error)
          alert('Failed to delete profile. Please try again.')
        })
        .finally(() => {
          this.isDeleting = false
        })
    }
  }
}
</script>