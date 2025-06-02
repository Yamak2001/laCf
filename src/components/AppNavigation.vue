<!-- src/components/AppNavigation.vue -->
<template>
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      @click="rail = false"
    >
      <v-list-item
        prepend-avatar="https://randomuser.me/api/portraits/men/85.jpg"
        title="Loud & Clear"
        subtitle="Voice Isolation System"
      >
        <template v-slot:append>
          <v-btn
            variant="text"
            icon="mdi-chevron-left"
            @click.stop="rail = !rail"
          ></v-btn>
        </template>
      </v-list-item>
  
      <v-divider></v-divider>
  
      <v-list density="compact" nav>
        <v-list-item
          v-for="item in navItems"
          :key="item.title"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.to"
          :disabled="item.disabled"
          :active="$route.path === item.to"
        ></v-list-item>
      </v-list>
      
      <template v-slot:append>
        <div class="pa-2">
          <v-btn
            block
            variant="outlined"
            prepend-icon="mdi-github"
            href="https://github.com/yourusername/loud-and-clear"
            target="_blank"
          >
            Source
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>
  </template>
  
  <script>
  export default {
    name: 'AppNavigation',
    props: {
      modelValue: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        rail: false,
        navItems: [
          { title: 'Home', icon: 'mdi-home', to: '/' },
          { title: 'Voice Profiles', icon: 'mdi-account-voice', to: '/profiles' },
          { title: 'Voice Isolation', icon: 'mdi-waveform', to: '/isolation' },
          { title: 'Quick Isolation', icon: 'mdi-lightning-bolt', to: '/streamlined' },
          { title: 'Models', icon: 'mdi-cog-box', to: '/models' }
        ]
      }
    },
    computed: {
      drawer: {
        get() {
          return this.modelValue
        },
        set(val) {
          this.$emit('update:modelValue', val)
        }
      }
    }
  }
  </script>