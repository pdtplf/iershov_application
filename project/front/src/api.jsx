// src/api.js
import axios from 'axios';

const API_URL = `${window.location.protocol}//${window.location.hostname}:5000`;

const api = axios.create({
  baseURL: `${API_URL}`,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const authAPI = {
  login: (email, password) => api.post('/login', { email, password })
};

export const dashboardAPI = {
  getData: (token) => api.get('/emails', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
};

export async function fetchEmails(token) {
    try {
        const response = await api.get('/emails', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = response.data;
        return {
            emails: data || []
        };
    } catch (error) {
        console.error('Error fetching emails:', error);
        throw error;
    }
}

export async function fetchMain(token) {
  try {
      const response = await api.get('/main', {
          headers: {
              'Authorization': `Bearer ${token}`
          }
      });
      const data = response.data.main;
      return {
          main: data || ''
      };
  } catch (error) {
      console.error('Error fetching main email:', error);
      throw error;
  }
}