<template>
  <div class="overview-page">
    <h2>Plant Overview - Gemini Planty</h2>

    <div v-if="overviewData.length === 0" class="no-data-message card">
      <p>No plant data available. Add some records in the Tracker tab to see the overview!</p>
    </div>
    <div v-else class="card">
      <table class="overview-table">
        <thead>
          <tr>
            <th>Plant Name</th>
            <th>Min Moisture Level</th>
            <th>MA Watering Interval (days)</th>
            <th>Days Since Last Watering</th>
            <th>Status</th>
            <th>Latest Recorded Date</th>
            <th>Moisture on Latest Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="plant in overviewData" :key="plant.plantName">
            <td>{{ plant.plantName }}</td>
            <td>{{ plant.minimumMoistureLevel !== null ? plant.minimumMoistureLevel : 'N/A' }}</td>
            <td>{{ plant.maWateringInterval !== null ? plant.maWateringInterval : 'N/A' }}</td>
            <td>{{ plant.daysSinceLastWatering !== null ? plant.daysSinceLastWatering : 'N/A' }}</td>
            <td :class="getStatusColorClass(plant.statusColor)">
              {{ plant.daysSinceLastWatering !== null ? plant.daysSinceLastWatering : 'N/A' }}
            </td>
            <td>{{ plant.latestRecordedDate ? formatDate(plant.latestRecordedDate) : '' }}</td>
            <td>{{ plant.latestRecordedMoisture !== null ? plant.latestRecordedMoisture : '' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import axios from '../api'; // Import axios for making HTTP requests

export default {
  name: 'OverviewPage',
  data() {
    return {
      overviewData: [] // Stores the aggregated data for all plants
    };
  },
  methods: {
    // Fetches all overview data from the backend
    async fetchOverviewData() {
      try {
        const response = await axios.get('/api/overview');
        this.overviewData = response.data;
      } catch (error) {
        console.error('Error fetching overview data:', error);
        alert('Failed to load overview data. Please check the backend server.');
      }
    },
    // Returns the CSS class for the status cell based on color
    getStatusColorClass(statusColor) {
      return {
        'status-green': statusColor === 'green',
        'status-yellow': statusColor === 'yellow',
        'status-red': statusColor === 'red',
        'status-gray': statusColor === 'gray' // For plants with insufficient watering data
      };
    },
    // Helper to format dates for display
    formatDate(dateString) {
  // Use the globally defined Shamsi date formatter
  return this.$formatShamsiDate(dateString);
}
  },
  // Lifecycle hook: runs when the component is created/loaded
  created() {
    this.fetchOverviewData(); // Load overview data when the page loads
  }
};
</script>

<style scoped>
/* Scoped styles apply only to this component */
.overview-page {
  padding: 20px;
  max-width: 1100px; /* Adjust width for wider table */
  margin: 20px auto;
}

h2 {
  color: #333;
  margin-bottom: 25px;
  font-size: 2em;
}

.card {
    background-color: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    padding: 30px;
    margin-bottom: 30px;
    text-align: left;
    overflow-x: auto; /* Enable horizontal scrolling for table if needed */
}

.no-data-message {
    text-align: center;
    color: #777;
    font-style: italic;
}

.overview-table {
  width: 100%;
  border-collapse: collapse; /* Removes space between table cells */
  margin-top: 20px;
}

.overview-table th,
.overview-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
  font-size: 0.95em;
}

.overview-table th {
  background-color: #f2f2f2;
  font-weight: bold;
  color: #333;
  position: sticky; /* Keeps headers visible during horizontal scroll */
  top: 0;
  z-index: 1;
}

.overview-table tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

.overview-table tbody tr:hover {
  background-color: #f1f1f1;
}

/* Status Color Classes */
.status-green {
  background-color: #d4edda; /* Light green */
  color: #155724; /* Dark green text */
  font-weight: bold;
}

.status-yellow {
  background-color: #fff3cd; /* Light yellow */
  color: #856404; /* Dark yellow text */
  font-weight: bold;
}

.status-red {
  background-color: #f8d7da; /* Light red */
  color: #721c24; /* Dark red text */
  font-weight: bold;
}

.status-gray {
    background-color: #e2e3e5; /* Light gray */
    color: #495057; /* Dark gray text */
    font-weight: normal;
}
</style>