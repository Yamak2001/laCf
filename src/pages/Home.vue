<!-- src/pages/Home.vue -->
<template>
  <v-card class="mt-4">
    <v-card-title class="text-h4">
      Voice Isolation System for the Elderly
    </v-card-title>
    
    <v-card-text>
      <p class="text-body-1">
        Welcome to the Loud & Clear voice isolation system, designed specifically for elderly users to help them focus on pre-registered voices in noisy environments.
      </p>
      
      <v-row class="mt-6">
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>
              <v-icon left color="primary">mdi-account-voice</v-icon>
              Manage Voice Profiles
            </v-card-title>
            <v-card-text>
              Create and manage voice profiles for important people in your life. Record their voice to help the system recognize them in noisy environments.
            </v-card-text>
            <v-card-actions>
              <v-btn color="primary" to="/profiles">
                Manage Profiles
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>
              <v-icon left color="primary">mdi-audio-input-stereo-minijack</v-icon>
              Test Voice Isolation
            </v-card-title>
            <v-card-text>
              Test the voice isolation system by recording or uploading audio with multiple speakers. The system will isolate the voices you've registered.
            </v-card-text>
            <v-card-actions>
              <v-btn color="primary" to="/isolation">
                Test Isolation
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'HomePage'
}
</script>
