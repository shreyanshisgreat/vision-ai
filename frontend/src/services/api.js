/**
 * API service for communicating with the FastAPI backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://vision-ai-velc.onrender.com/api';

/**
 * Upload and analyze an image file.
 * @param {File|Blob} file - The image file to analyze
 * @returns {Promise<Object>} The analysis result containing detected objects & conversation_id
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
      throw new Error('Could not connect to the backend server. Please verify the backend is running at https://vision-ai-velc.onrender.com.');
    }
    throw error;
  }
}

/**
 * Send a question about an uploaded image in an active conversation session.
 * @param {string} conversationId - The active session identifier
 * @param {string} question - The user's natural language question
 * @returns {Promise<Object>} Object containing { success, answer, conversation_id }
 */
export async function sendChatMessage(conversationId, question) {
  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        question: question,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || `Failed to get response (${response.status})`);
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Lost connection to backend server. Please ensure the backend is running.');
    }
    throw error;
  }
}

/**
 * Clear the chat history for an image conversation.
 * @param {string} conversationId - The active session identifier
 * @returns {Promise<Object>}
 */
export async function clearChatHistory(conversationId) {
  try {
    const response = await fetch(`${API_BASE}/chat/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error clearing conversation:', error);
    throw error;
  }
}

/**
 * Request an automatic visual summary ("Explain what you see") from Gemini Vision for an active session.
 * @param {string} conversationId - The active session identifier
 * @returns {Promise<Object>} Object containing { success, summary, source, conversation_id }
 */
export async function getImageSummary(conversationId) {
  try {
    const response = await fetch(`${API_BASE}/vision/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || `Failed to get image summary (${response.status})`);
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Lost connection to backend server.');
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
