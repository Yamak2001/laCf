<!-- src/components/ModelInfoCard.vue -->
<template>
    <v-card class="mb-4">
      <v-card-title>
        <v-icon :color="iconColor" class="mr-2">{{ icon }}</v-icon>
        {{ title }}
      </v-card-title>
      <v-card-text>
        <div class="d-flex flex-wrap">
          <div v-for="(item, index) in infoItems" :key="index" class="mb-2 mr-4" style="min-width: 150px;">
            <div class="text-caption text-grey mb-1">{{ item.label }}</div>
            <div class="d-flex align-center">
              <v-chip
                v-if="item.showAsChip"
                :color="item.color || 'primary'"
                size="small"
                class="mr-2"
              >
                {{ item.value }}
              </v-chip>
              <span v-else class="text-body-2">{{ item.value }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="description" class="mt-4">
          <div class="text-body-2">{{ description }}</div>
        </div>
        
        <div v-if="showChildren" class="mt-4">
          <slot></slot>
        </div>
        
        <div v-if="actions" class="mt-4 d-flex justify-end">
          <v-btn
            v-for="(action, index) in actions"
            :key="index"
            :color="action.color || 'primary'"
            :variant="action.variant || 'text'"
            size="small"
            class="ml-2"
            @click="$emit('action', action.name)"
          >
            <v-icon v-if="action.icon" start>{{ action.icon }}</v-icon>
            {{ action.label }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </template>
  
  <script>
  export default {
    name: 'ModelInfoCard',
    props: {
      title: {
        type: String,
        required: true
      },
      icon: {
        type: String,
        default: 'mdi-information'
      },
      iconColor: {
        type: String,
        default: 'primary'
      },
      infoItems: {
        type: Array,
        default: () => []
      },
      description: {
        type: String,
        default: ''
      },
      showChildren: {
        type: Boolean,
        default: false
      },
      actions: {
        type: Array,
        default: () => []
      }
    },
    emits: ['action']
  }
  </script>