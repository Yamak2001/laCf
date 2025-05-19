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
  audioUrl: null,
  mimeType: 'audio/webm' // Default MIME type
   }
   },
  mounted() {
    // Try to determine the best supported MIME type
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      this.mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      this.mimeType = 'audio/webm';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      this.mimeType = 'audio/mp4';
    } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
      this.mimeType = 'audio/ogg;codecs=opus';
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
  
  // Request access to the microphone
  navigator.mediaDevices.getUserMedia({ audio: true })
   .then(stream => {
     try {
       // Create the MediaRecorder with the determined MIME type
       this.mediaRecorder = new MediaRecorder(stream, { mimeType: this.mimeType });
       
       this.mediaRecorder.addEventListener('dataavailable', event => {
         if (event.data.size > 0) {
           this.audioChunks.push(event.data);
         }
       });
       
       this.mediaRecorder.addEventListener('stop', () => {
         // Use the actual MIME type from the recorder
         const blobType = this.mediaRecorder.mimeType || this.mimeType;
         this.audioBlob = new Blob(this.audioChunks, { type: blobType });
         this.audioUrl = URL.createObjectURL(this.audioBlob);
         this.$emit('recording-complete', this.audioBlob);
       });
       
       // Start recording with a timeslice to get data more frequently
       this.mediaRecorder.start(100);
       this.isRecording = true;
     } catch (error) {
       console.error('Error creating MediaRecorder:', error);
       alert('Could not create MediaRecorder. Your browser might not support the format.');
       // Release the microphone
       stream.getTracks().forEach(track => track.stop());
     }
   })
   .catch(error => {
     console.error('Error accessing microphone:', error);
     alert('Could not access microphone. Please check permissions.');
   });
   },
  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.isRecording = false;
      // Stop all tracks on the stream
      if (this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    }
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