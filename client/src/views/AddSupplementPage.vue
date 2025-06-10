<template>
  <div class="add-form-page">
    <h2>Add New Supplement - Gemini Planty</h2>

    <div class="form-section card">
      <div class="form-group">
        <label for="supplementName">Supplement Name:</label>
        <input type="text" id="supplementName" v-model="supplementName" placeholder="e.g., Iron Chelate, Neem Oil" required />
      </div>

      <div class="form-actions">
        <button @click="saveSupplement" :disabled="!supplementName">Save Supplement</button>
        <button @click="cancel">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from '../api';

export default {
  name: 'AddSupplementPage',
  data() {
    return {
      supplementName: ''
    };
  },
  methods: {
    async saveSupplement() {
      if (!this.supplementName) {
        alert('Please enter a supplement name.');
        return;
      }

      const supplementData = {
        supplementName: this.supplementName
      };

      try {
        await axios.post('/api/supplements', supplementData);
        alert('Supplement added successfully!');
        this.resetForm();
        // Optionally navigate back to Tracker page
        this.$router.push('/');
      } catch (error) {
        console.error('Error adding supplement:', error);
        if (error.response && error.response.status === 409) {
          alert(`Error: ${error.response.data.error}`); // Supplement name already exists.
        } else {
          alert(`Failed to add supplement. Error: ${error.response ? error.response.data.error : error.message}`);
        }
      }
    },
    cancel() {
      if (confirm('Are you sure you want to clear the form?')) {
        this.resetForm();
        this.$router.push('/'); // Navigate back to Tracker
      }
    },
    resetForm() {
      this.supplementName = '';
    }
  }
};
</script>

<style scoped>
/* Reuse styles from AddPlantPage for consistency */
.add-form-page {
  padding: 20px;
  max-width: 600px;
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
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 8px;
  color: #555;
  font-size: 0.95em;
}

input[type="text"],
input[type="number"] {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
  background-color: #fcfcfc;
  transition: border-color 0.2s ease-in-out;
}

input[type="text"]:focus,
input[type="number"]:focus {
  border-color: #42b983;
  outline: none;
}

.form-actions {
  margin-top: 30px;
  text-align: center;
}

.form-actions button {
  padding: 12px 25px;
  margin: 0 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.1s ease;
  min-width: 120px;
}

.form-actions button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.form-actions button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  color: #666;
}

button:nth-child(1) { /* Save Supplement */
  background-color: #28a745; /* Green */
  color: white;
}

button:nth-child(2) { /* Cancel */
  background-color: #dc3545; /* Red */
  color: white;
}
</style>