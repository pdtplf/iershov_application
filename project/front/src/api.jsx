// src/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;

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
        // backend returns { emails: [...] }
        return {
          emails: data?.emails || []
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

export async function deactivateEmail(token, emailLocal) {
  try {
    // emailLocal may be a string (local part) or a full data array/object.
    const body = Array.isArray(emailLocal) || typeof emailLocal === 'object' ? { data: emailLocal } : { email: emailLocal };
    const response = await api.post('/deactivate', body, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deactivating email:', error);
    throw error;
  }
}

export async function fetchDeactivated(token) {
  try {
    const response = await api.get('/deactivated', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching deactivated emails:', error);
    throw error;
  }
}

export async function activateEmail(token, payload) {
  // payload must be the full email data array/object; send under key 'data'
  const body = { data: payload };
  try {
    const response = await api.post('/activate', body, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error activating email:', error);
    throw error;
  }
}