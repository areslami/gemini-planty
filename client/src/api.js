import axios from 'axios';

// Base URL for your backend API
// In development, it's localhost:3000
// In production, it will be your deployed Render backend service URL
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;