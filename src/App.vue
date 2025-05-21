<template>
  <v-app>
    <AppHeader />
    
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
    
    <!-- <v-footer app>
      <span>&copy; {{ new Date().getFullYear() }} - Loud & Clear Voice Isolation System</span>
    </v-footer> -->
  </v-app>
</template>

<script>
import AppHeader from './components/AppHeader.vue'

export default {
  name: 'App',
  components: {
    AppHeader
  }
}
</script>