/**
 * API service for communicating with the FastAPI backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

/**
 * Upload and analyze an image file.
 * @param {File|Blob} file - The image file to analyze
 * @returns {Promise<Object>} The analysis result containing detected objects
 */
export async function analyzeImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE}/analyze-image`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || `Server responded with status ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Could not connect to the backend server. Please verify the backend is running at http://127.0.0.1:8000.');
    }
    throw error;
  }
}

/**
 * Check backend health status.
 * @returns {Promise<Object>}
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) return { status: 'offline' };
    return await response.json();
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}
