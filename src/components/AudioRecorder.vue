<!-- src/components/AudioRecorder.vue -->
<template>
  <div class="audio-recorder">
    <v-btn 
      :color="isRecording ? 'error' : 'primary'" 
      @click="toggleRecording"
      :loading="isProcessing"
      :disabled="isProcessing"
    >
      <v-icon left>{{ isRecording ? 'mdi-stop' : 'mdi-microphone' }}</v-icon>
      {{ isRecording ? 'Stop Recording' : 'Start Recording' }}
    </v-btn>
    
    <div v-if="isRecording" class="mt-2">
      <v-progress-linear
        indeterminate
        color="red"
      ></v-progress-linear>
      <p class="text-subtitle-2 text-center">Recording...</p>
    </div>
    
    <div v-if="audioUrl" class="mt-4">
      <p class="text-subtitle-1">Audio Preview:</p>
      <audio controls :src="audioUrl" class="w-100"></audio>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AudioRecorder',
  props: {
    isProcessing: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isRecording: false,
      mediaRecorder: null,
      audioChunks: [],
      audioBlob: null,
      audioUrl: null
    }
  },
  methods: {
    toggleRecording() {
      if (this.isRecording) {
        this.stopRecording()
      } else {
        this.startRecording()
      }
    },
    
    startRecording() {
      this.audioChunks = []
      this.audioBlob = null
      this.audioUrl = null
      
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          this.mediaRecorder = new MediaRecorder(stream)
          
          this.mediaRecorder.addEventListener('dataavailable', event => {
            this.audioChunks.push(event.data)
          })
          
          this.mediaRecorder.addEventListener('stop', () => {
            this.audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' })
            this.audioUrl = URL.createObjectURL(this.audioBlob)
            this.$emit('recording-complete', this.audioBlob)
          })
          
          this.mediaRecorder.start()
          this.isRecording = true
        })
        .catch(error => {
          console.error('Error accessing microphone:', error)
          alert('Could not access microphone. Please check permissions.')
        })
    },
    
    stopRecording() {
      this.mediaRecorder.stop()
      this.isRecording = false
      
      // Stop all tracks on the stream
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop())
    },
    
    resetRecording() {
      this.audioChunks = []
      this.audioBlob = null
      if (this.audioUrl) {
        URL.revokeObjectURL(this.audioUrl)
        this.audioUrl = null
      }
    }
  }
}
</script>
