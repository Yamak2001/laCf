<!-- frontend/src/pages/Monitoring.vue -->
<template>
    <v-container>
      <v-card class="mb-6">
        <v-card-title class="headline">
          API Monitoring Dashboard
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="refreshData">
            <v-icon left>mdi-refresh</v-icon>
            Refresh
          </v-btn>
          <v-btn color="error" class="ml-2" @click="clearLogs">
            <v-icon left>mdi-delete</v-icon>
            Clear Logs
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <v-col cols="12" md="3">
              <v-card outlined class="text-center pa-4">
                <div class="text-h5 font-weight-bold">{{ stats.total_requests || 0 }}</div>
                <div class="text-subtitle-1">Total Requests</div>
              </v-card>
            </v-col>
            <v-col cols="12" md="3">
              <v-card outlined class="text-center pa-4">
                <div class="text-h5 font-weight-bold">{{ stats.avg_response_time_ms || 0 }}ms</div>
                <div class="text-subtitle-1">Avg Response Time</div>
              </v-card>
            </v-col>
            <v-col cols="12" md="3">
              <v-card outlined class="text-center pa-4" :class="stats.error_count ? 'red lighten-4' : ''">
                <div class="text-h5 font-weight-bold">{{ stats.error_count || 0 }}</div>
                <div class="text-subtitle-1">Errors</div>
              </v-card>
            </v-col>
            <v-col cols="12" md="3">
              <v-card outlined class="text-center pa-4">
                <div class="text-h5 font-weight-bold">{{ Object.keys(stats.paths || {}).length }}</div>
                <div class="text-subtitle-1">Unique Endpoints</div>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
      
      <v-card>
        <v-card-title>
          Request Log
          <v-spacer></v-spacer>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
            dense
          ></v-text-field>
        </v-card-title>
        
        <v-data-table
          :headers="headers"
          :items="requests"
          :search="search"
          :loading="loading"
          class="elevation-1"
          :items-per-page="10"
          :footer-props="{ 'items-per-page-options': [10, 25, 50, 100] }"
        >
        <template v-slot:["item.method"]="{ item }">
            <v-chip
              :color="getMethodColor(item.method)"
              dark
              small
            >
              {{ item.method }}
            </v-chip>
          </template>
          
          <template v-slot:item.status_code="{ item }">
            <v-chip
              :color="getStatusColor(item.status_code)"
              dark
              small
              v-if="item.status_code"
            >
              {{ item.status_code }}
            </v-chip>
            <v-chip
              color="red"
              dark
              small
              v-else-if="item.error"
            >
              ERROR
            </v-chip>
          </template>
          
          <template v-slot:item.timestamp="{ item }">
            {{ formatDate(item.timestamp) }}
          </template>
          
          <template v-slot:item.response_time_ms="{ item }">
            {{ item.response_time_ms }}ms
          </template>
          
          <template v-slot:item.actions="{ item }">
            <v-btn
              x-small
              icon
              @click="selectedRequest = item"
            >
              <v-icon>mdi-information-outline</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card>
      
      <!-- Request Details Dialog -->
      <v-dialog v-model="dialog" max-width="800">
        <v-card v-if="selectedRequest">
          <v-card-title>
            Request Details
            <v-spacer></v-spacer>
            <v-btn icon @click="dialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-tabs>
              <v-tab>Overview</v-tab>
              <v-tab>Headers</v-tab>
              <v-tab>Request</v-tab>
              <v-tab>Response</v-tab>
              
              <v-tab-item>
                <v-list dense>
                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-subtitle>ID</v-list-item-subtitle>
                      <v-list-item-title class="text-body-2">{{ selectedRequest.id }}</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                  
                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-subtitle>Path</v-list-item-subtitle>
                      <v-list-item-title class="text-body-2">{{ selectedRequest.path }}</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                  
                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-subtitle>Method</v-list-item-subtitle>
                      <v-list-item-title class="text-body-2">{{ selectedRequest.method }}</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                  
                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-subtitle>Status</v-list-item-subtitle>
                      <v-list-item-title class="text-body-2">{{ selectedRequest.status_code || 'Error' }}</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                  
                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-subtitle>Time</v-list-item-subtitle>
                      <v-list-item-title class="text-body-2">{{ selectedRequest.response_time_ms }}ms</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                  
                  <v-list-item v-if="selectedRequest.error">
                    <v-list-item-content>
                      <v-list-item-subtitle>Error</v-list-item-subtitle>
                      <v-list-item-title class="text-body-2 red--text">{{ selectedRequest.error }}</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
              </v-tab-item>
              
              <v-tab-item>
                <v-simple-table dense>
                  <template v-slot:default>
                    <thead>
                      <tr>
                        <th>Header</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(value, name) in selectedRequest.headers" :key="name">
                        <td>{{ name }}</td>
                        <td>{{ value }}</td>
                      </tr>
                    </tbody>
                  </template>
                </v-simple-table>
              </v-tab-item>
              
              <v-tab-item>
                <div class="pa-4">
                  <h3>Query Parameters</h3>
                  <pre v-if="Object.keys(selectedRequest.query_params || {}).length">{{ JSON.stringify(selectedRequest.query_params, null, 2) }}</pre>
                  <p v-else class="text-body-2 grey--text">No query parameters</p>
                  
                  <h3 class="mt-4">Body</h3>
                  <pre v-if="selectedRequest.body">{{ formatJson(selectedRequest.body) }}</pre>
                  <p v-else-if="selectedRequest.body_error" class="text-body-2 red--text">Error parsing body: {{ selectedRequest.body_error }}</p>
                  <p v-else class="text-body-2 grey--text">No body or unable to capture</p>
                </div>
              </v-tab-item>
              
              <v-tab-item>
                <div class="pa-4">
                  <h3>Response Body</h3>
                  <pre v-if="selectedRequest.response_body">{{ JSON.stringify(selectedRequest.response_body, null, 2) }}</pre>
                  <p v-else-if="selectedRequest.response_size" class="text-body-2 grey--text">Binary response ({{ selectedRequest.response_size }} bytes)</p>
                  <p v-else class="text-body-2 grey--text">No response body or unable to capture</p>
                </div>
              </v-tab-item>
            </v-tabs>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-container>
  </template>
  
  <script>
  import api from '../resources/api';
  
  export default {
    data() {
      return {
        apiKey: 'your-secret-monitoring-key', // In production, use environment variables
        requests: [],
        stats: {},
        loading: false,
        search: '',
        dialog: false,
        selectedRequest: null,
        headers: [
          { text: 'Method', value: 'method', width: '100px' },
          { text: 'Path', value: 'path' },
          { text: 'Status', value: 'status_code', width: '100px' },
          { text: 'Time', value: 'response_time_ms', width: '100px' },
          { text: 'Timestamp', value: 'timestamp', width: '200px' },
          { text: 'Actions', value: 'actions', sortable: false, width: '80px' }
        ]
      };
    },
    
    mounted() {
      this.fetchData();
    },
    
    watch: {
      selectedRequest(val) {
        this.dialog = !!val;
      }
    },
    
    methods: {
      async fetchData() {
        this.loading = true;
        try {
          // Fetch requests
          const requestsResponse = await api.makeRequest('GET', '/api/monitoring/requests', null, {
            headers: { 'X-API-Key': this.apiKey }
          });
          this.requests = requestsResponse.data.requests;
          
          // Fetch stats
          const statsResponse = await api.makeRequest('GET', '/api/monitoring/stats', null, {
            headers: { 'X-API-Key': this.apiKey }
          });
          this.stats = statsResponse.data;
        } catch (error) {
          console.error('Error fetching monitoring data', error);
          this.$toast.error('Error fetching monitoring data');
        } finally {
          this.loading = false;
        }
      },
      
      refreshData() {
        this.fetchData();
      },
      
      async clearLogs() {
        if (!confirm('Are you sure you want to clear all logs?')) return;
        
        this.loading = true;
        try {
          await api.makeRequest('DELETE', '/api/monitoring/clear', null, {
            headers: { 'X-API-Key': this.apiKey }
          });
          this.requests = [];
          this.stats = {};
          this.$toast.success('Logs cleared successfully');
        } catch (error) {
          console.error('Error clearing logs', error);
          this.$toast.error('Error clearing logs');
        } finally {
          this.loading = false;
        }
      },
      
      getMethodColor(method) {
        const colors = {
          GET: 'blue',
          POST: 'green',
          PUT: 'orange',
          PATCH: 'teal',
          DELETE: 'red'
        };
        return colors[method] || 'grey';
      },
      
      getStatusColor(status) {
        if (!status) return 'grey';
        if (status < 300) return 'green';
        if (status < 400) return 'blue';
        if (status < 500) return 'orange';
        return 'red';
      },
      
      formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString();
      },
      
      formatJson(jsonString) {
        try {
          return JSON.stringify(JSON.parse(jsonString), null, 2);
        } catch (e) {
          return jsonString;
        }
      }
    }
  };
  </script>