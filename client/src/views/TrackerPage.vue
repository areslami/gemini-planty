<template>
  <div class="tracker-page-container">
    <h2 class="page-title">Plant Tracker <span class="app-name">- Gemini Planty</span></h2>

    <section class="form-section card">
      <h3 class="section-title">Record New Data</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="plantSelect" class="input-label">Select Plant:</label>
          <div class="select-wrapper">
            <select id="plantSelect" v-model="selectedPlantName" @change="fetchPlantDetails" class="form-select">
              <option value="" disabled>-- Please select a plant --</option>
              <option v-for="plant in plants" :key="plant.plant_name" :value="plant.plant_name">
                {{ plant.plant_name }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="input-label">Minimum Moisture Level:</label>
          <input type="text" :value="minMoistureLevel !== null ? minMoistureLevel : 'N/A'" readonly class="form-input readonly-input" />
        </div>

        <div class="form-group full-width">
          <label class="input-label">Supplements (Choose any):</label>
          <div class="checkbox-group">
            <label v-for="supplement in supplements" :key="supplement.supplement_name" class="checkbox-label">
              <input type="checkbox" :value="supplement.supplement_name" v-model="selectedSupplements" />
              <span>{{ supplement.supplement_name }}</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label for="recordDate" class="input-label">Date of Record (Gregorian):</label>
          <input type="date" id="recordDate" v-model="recordDate" class="form-input" />
        </div>
        <div class="form-group">
          <label class="input-label">Selected Date (Shamsi):</label>
          <input type="text" :value="shamsiRecordDate" readonly class="form-input readonly-input" />
        </div>

        <div class="form-group">
          <label for="moistureLevel" class="input-label">Moisture Level (Optional):</label>
          <input type="number" id="moistureLevel" v-model.number="moistureLevel" placeholder="e.g., 45, 60" class="form-input" />
        </div>
      </div>

      <div class="form-actions">
        <button @click="waterAndSave" :disabled="!selectedPlantName || !recordDate" class="btn btn-primary">Water and Save</button>
        <button @click="save" :disabled="!selectedPlantName || !recordDate" class="btn btn-success">Save</button>
        <button @click="cancel" class="btn btn-danger">Cancel</button>
      </div>
    </section>

    <hr class="divider" />

    <section class="reports-section card" v-if="selectedPlantName">
      <h3 class="section-title">Insights for {{ selectedPlantName }}</h3>
      <div class="report-fields-grid">
        <div class="report-group">
          <label class="input-label">Days since last watering:</label>
          <input type="text" :value="daysSinceLastWatering !== null ? daysSinceLastWatering + ' days' : 'N/A'" readonly class="form-input readonly-input" />
        </div>
        <div class="report-group">
          <label class="input-label">MA Watering Interval:</label>
          <input type="text" :value="maWateringInterval !== null ? maWateringInterval + ' days' : 'N/A'" readonly class="form-input readonly-input" />
        </div>
      </div>

      <h4 class="section-subtitle">Last 10 Records:</h4>
      <div class="records-box">
        <div v-if="latestRecords.length === 0" class="no-records-message">No records found for this plant.</div>
        <ul v-else class="records-list">
          <li v-for="record in latestRecords" :key="record.record_id" :class="{ 'watered-row': record.watered }">
            <span class="record-item record-date">{{ formatDate(record.record_date) }}</span>
            <span class="record-item">M: <span class="record-value">{{ record.moisture_level || 'N/A' }}</span></span>
            <span class="record-item">S: <span class="record-value">{{ record.supplements || 'None' }}</span></span>
            <span class="record-item">W: <span class="record-value">{{ record.watered ? 'Y' : 'N' }}</span></span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'TrackerPage',
  data() {
    return {
      plants: [],
      supplements: [],
      selectedPlantName: '',
      minMoistureLevel: null,
      // relativeMoistureLevel: null, // REMOVED THIS FIELD
      selectedSupplements: [],
      recordDate: new Date().toISOString().slice(0, 10),
      moistureLevel: null,
      daysSinceLastWatering: null,
      maWateringInterval: null,
      latestRecords: []
    };
  },
  computed: { // <<< ADD THIS COMPUTED BLOCK
    shamsiRecordDate() {
      if (!this.recordDate) return 'N/A';
      return this.$formatShamsiDate(this.recordDate);
    }
  },
  methods: {
    async fetchPlants() {
      console.log('fetchPlants method started.'); // <<< ADD THIS LOG
      console.log('API Base URL being used:', api.defaults.baseURL); // <<< ADD THIS LOG

      try {
        console.log('Attempting to fetch plants from:', api.defaults.baseURL + '/api/plants'); // <<< ADD THIS LOG
        const response = await api.get('/api/plants');
        console.log('API response received:', response.data); // <<< ADD THIS LOG
        this.plants = response.data;
      } catch (error) {
        console.error('Error fetching plants (from catch block):', error); // <<< MODIFY THIS LOG
        alert('Failed to load plants. Please check the backend server.');
      }
    },
  async fetchSupplements() {
  try {
    const response = await api.get('/api/supplements'); // Use relative path
    this.supplements = response.data;
  } catch (error) {
    console.error('Error fetching supplements:', error);
    alert('Failed to load supplements. Please check the backend server.');
  }
    },
    async fetchPlantDetails() {
      if (!this.selectedPlantName) {
        this.minMoistureLevel = null;
        // this.relativeMoistureLevel = null; // REMOVED THIS LINE
        this.daysSinceLastWatering = null;
        this.maWateringInterval = null;
        this.latestRecords = [];
        return;
      }

      const selectedPlant = this.plants.find(p => p.plant_name === this.selectedPlantName);
      if (selectedPlant) {
        this.minMoistureLevel = selectedPlant.minimum_moisture_level;
      }

      this.fetchWateringStats();
      this.fetchLatestRecords();
    },
    async fetchWateringStats() {
      try {
        const response = await api.get(`/api/plants/${this.selectedPlantName}/watering-stats`);
        this.daysSinceLastWatering = response.data.daysSinceLastWatering;
        this.maWateringInterval = response.data.maWateringInterval;
      } catch (error) {
        console.error('Error fetching watering stats:', error);
        this.daysSinceLastWatering = null;
        this.maWateringInterval = null;
      }
    },
    async fetchLatestRecords() {
      try {
        const response = await api.get(`/api/records/${this.selectedPlantName}/latest`);
        this.latestRecords = response.data;
      } catch (error) {
        console.error('Error fetching latest records:', error);
        this.latestRecords = [];
      }
    },
    async submitRecord(wateredStatus) {
      if (!this.selectedPlantName || !this.recordDate) {
        alert('Please select a plant and a date before saving.');
        return;
      }

      const recordData = {
        plantName: this.selectedPlantName,
        supplements: this.selectedSupplements.join(','),
        recordDate: this.recordDate,
        moistureLevel: this.moistureLevel === '' ? null : this.moistureLevel,
        watered: wateredStatus
      };

      try {
        await axios.post('/api/records', recordData);
        alert('Record saved successfully!');
        this.resetForm();
        this.fetchPlantDetails();
      } catch (error) {
        console.error('Error saving record:', error);
        alert(`Failed to save record. Error: ${error.response ? error.response.data.error : error.message}`);
      }
    },
    waterAndSave() {
      this.submitRecord(true);
    },
    save() {
      this.submitRecord(false);
    },
    cancel() {
      if (confirm('Are you sure you want to clear the form?')) {
        this.resetForm();
      }
    },
    resetForm() {
      this.selectedPlantName = '';
      this.minMoistureLevel = null;
      // this.relativeMoistureLevel = null; // REMOVED THIS LINE
      this.selectedSupplements = [];
      this.recordDate = new Date().toISOString().slice(0, 10);
      this.moistureLevel = null;
      this.daysSinceLastWatering = null;
      this.maWateringInterval = null;
      this.latestRecords = [];
    },

    formatDate(dateString) {
  // Use the globally defined Shamsi date formatter
  return this.$formatShamsiDate(dateString);
  }
  },
  created() {
    this.fetchPlants();
    this.fetchSupplements();
  }
};



</script>

<style scoped>
/* General styles for the page container */
.tracker-page-container {
  padding: 30px;
  max-width: 1000px; /* Increased max-width for more space */
  margin: 20px auto;
  background-color: #f5f7fa; /* Light background for the page */
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); /* More pronounced shadow for the whole page */
}

/* Page Title */
.page-title {
  color: #333;
  margin-bottom: 35px;
  font-size: 2.5em;
  font-weight: 700;
  text-align: center;
  letter-spacing: -0.5px;
}

.app-name {
  font-size: 0.7em;
  color: #666;
  font-weight: 400;
  display: block;
  margin-top: 5px;
}

/* Card Styling */
.card {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 10px; /* Slightly more rounded corners */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07); /* Softer, deeper shadow */
  padding: 35px;
  margin-bottom: 35px;
  text-align: left;
}

/* Section Titles */
.section-title {
  color: #444;
  margin-bottom: 25px;
  font-size: 1.8em;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef; /* Subtle line under title */
  padding-bottom: 12px;
  text-align: center;
}

.section-subtitle {
  color: #555;
  margin-top: 30px;
  margin-bottom: 20px;
  font-size: 1.4em;
  font-weight: 600;
  text-align: center;
}

/* Form Grid Layout (for inputs and reports) */
.form-grid, .report-fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* Auto-fit columns */
  gap: 25px; /* Increased gap */
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 0; /* Managed by grid gap */
}

.form-group.full-width {
  grid-column: 1 / -1; /* Spans full width of the grid */
}

/* Input Labels */
.input-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #555;
  font-size: 0.98em;
}

/* Form Inputs, Selects */
.form-input, .form-select {
  width: 100%;
  padding: 12px 15px; /* More padding */
  border: 1px solid #d1d9e6; /* Softer border color */
  border-radius: 8px; /* More rounded */
  font-size: 1rem;
  box-sizing: border-box;
  background-color: #fdfdfd;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  -webkit-appearance: none; /* Remove default select arrow */
  -moz-appearance: none;
  appearance: none;
}

.form-input:focus, .form-select:focus {
  border-color: #60a5fa; /* Lighter blue focus */
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.25); /* Subtle focus glow */
  outline: none;
}

.readonly-input {
  background-color: #eef2f6; /* Lighter background for readonly */
  color: #777;
  cursor: default;
}

/* Custom select arrow */
.select-wrapper {
  position: relative;
}
.select-wrapper::after {
  content: '▼'; /* Custom arrow */
  position: absolute;
  top: 50%;
  right: 15px;
  transform: translateY(-50%);
  pointer-events: none;
  color: #888;
  font-size: 0.8em;
}

/* Checkbox Group */
.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 15px 30px;
  padding: 5px 0;
  border: 1px solid #e0e0e0; /* Add a border to the checkbox group */
  border-radius: 8px;
  padding: 15px 20px;
  background-color: #fcfcfc;
}

.checkbox-label {
  font-weight: normal;
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: 0;
  color: #444;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 10px;
  width: 20px; /* Make checkbox visually clearer */
  height: 20px;
  transform: none; /* Remove previous scaling */
  -webkit-appearance: none;
  appearance: none;
  border: 2px solid #b0bec5;
  border-radius: 4px;
  outline: none;
  transition: background-color 0.2s, border-color 0.2s;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"]:checked {
  background-color: #42b983; /* Green when checked */
  border-color: #42b983;
}

.checkbox-label input[type="checkbox"]:checked::before {
  content: '✔'; /* Checkmark */
  display: block;
  color: white;
  font-size: 14px;
  line-height: 1;
  text-align: center;
}

/* Form Actions (Buttons) */
.form-actions {
  margin-top: 40px;
  text-align: center;
  display: flex; /* Use flexbox for buttons */
  justify-content: center;
  gap: 15px; /* Space between buttons */
}

.btn {
  padding: 14px 30px;
  border: none;
  border-radius: 8px; /* More rounded */
  cursor: pointer;
  font-size: 1.05rem;
  font-weight: 700;
  transition: background-color 0.3s ease, transform 0.1s ease, box-shadow 0.2s ease;
  min-width: 150px; /* Consistent button width */
  letter-spacing: 0.5px;
}

.btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15); /* Lifted shadow */
}

.btn:disabled {
  background-color: #d8e0e7; /* Lighter disabled state */
  cursor: not-allowed;
  color: #99aab5;
  box-shadow: none;
  transform: none;
}

/* Specific Button Colors (Swapped) */
.btn-primary { /* Water and Save (BLUE) */
  background-color: #007bff;
  color: white;
}
.btn-primary:hover:not(:disabled) {
    background-color: #0056b3;
}

.btn-success { /* Save (GREEN) */
  background-color: #28a745;
  color: white;
}
.btn-success:hover:not(:disabled) {
    background-color: #1e7e34;
}

.btn-danger { /* Cancel (RED) */
  background-color: #dc3545;
  color: white;
}
.btn-danger:hover:not(:disabled) {
    background-color: #bd2130;
}

/* Divider */
.divider {
  border: 0;
  height: 2px;
  background-image: linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0));
  margin: 50px 0; /* More vertical space */
}

/* Records Box */
.records-box {
  border: 1px solid #e0e0e0;
  padding: 20px;
  max-height: 350px; /* Taller scrollable area */
  overflow-y: auto;
  background-color: #fcfcfc;
  border-radius: 8px;
}

.records-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.records-list li {
  display: flex; /* Use flexbox for list items */
  justify-content: space-between; /* Space out items */
  align-items: center;
  padding: 12px 15px; /* More padding */
  border-bottom: 1px solid #f0f0f0; /* Lighter separator */
  font-size: 0.98em;
  color: #333;
  transition: background-color 0.2s ease;
  border-radius: 6px; /* Slight rounding for list items */
  margin-bottom: 5px; /* Small gap between list items */
}

.records-list li:last-child {
  border-bottom: none;
}

.record-item {
  padding: 0 5px; /* Small internal padding */
}

.record-date {
    font-weight: 600;
    color: #1e88e5; /* Distinct color for date */
    min-width: 120px; /* Ensure date takes enough space */
}

.record-value {
    font-weight: 500;
    color: #444;
}

.watered-row {
  background-color: #e3f2fd; /* Light blue background for watered rows */
  border-left: 5px solid #2196f3; /* Blue border for emphasis */
  padding-left: 10px; /* Adjust padding due to border */
}

.no-records-message {
    text-align: center;
    color: #777;
    padding: 20px;
    font-style: italic;
    font-size: 1.1em;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .tracker-page-container {
    padding: 20px;
    margin: 10px auto;
  }
  .form-grid, .report-fields-grid {
    grid-template-columns: 1fr; /* Stack columns on smaller screens */
    gap: 20px;
  }
  .form-actions {
    flex-direction: column; /* Stack buttons vertically */
    gap: 10px;
  }
  .btn {
    width: 100%; /* Full width buttons */
    min-width: unset;
  }
  .section-title, .section-subtitle, .page-title {
    font-size: 1.5em; /* Smaller titles */
  }
  .records-list li {
    flex-direction: column; /* Stack record items vertically */
    align-items: flex-start;
    padding: 10px;
  }
  .record-item {
    width: 100%; /* Full width for stacked items */
    padding: 2px 0;
  }
}
</style>