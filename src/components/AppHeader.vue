<template>
  <v-app-bar color="primary" dark>
    <v-app-bar-title>
      Loud & Clear
    </v-app-bar-title>
    
    <v-spacer></v-spacer>
    
    <v-btn to="/" variant="text">
      <v-icon class="me-2">mdi-home</v-icon>
      Home
    </v-btn>
    
    <v-btn to="/profiles" variant="text">
      <v-icon class="me-2">mdi-account-voice</v-icon>
      Profiles
    </v-btn>
    
    <v-btn to="/isolation" variant="text">
      <v-icon class="me-2">mdi-audio-input-stereo-minijack</v-icon>
      Voice Isolation
    </v-btn>
    
    <v-btn to="/streamlined" variant="text">
      <v-icon class="me-2">mdi-lightning-bolt</v-icon>
      Quick
    </v-btn>
  </v-app-bar>
</template>

<script>
export default {
  name: 'AppHeader'
}
</script>