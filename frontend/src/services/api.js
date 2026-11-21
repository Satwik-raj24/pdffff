/**
 * Smart Notes AI - Frontend API Service
 * Handles all HTTP communication with the FastAPI backend with explicit timeout handling.
 */

const API_BASE_URL = '/api';

/**
 * Custom API Error with status and detail message
 */
export class ApiError extends Error {
  constructor(message, status = 500, detail = null) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

async function request(endpoint, options = {}, timeoutMs = 30000) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = options.headers || {};

  // Create AbortController for timeout protection
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = 'An unexpected server error occurred.';
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
      } catch (e) {
        errorDetail = await response.text();
      }
      throw new ApiError(errorDetail, response.status, errorDetail);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      throw new ApiError(
        'The request timed out after 30 seconds. The model or server took too long to respond. Please try again.',
        504
      );
    }
    if (err instanceof ApiError) {
      throw err;
    }
    // Network or server unreachable
    throw new ApiError(
      `Could not connect to backend server. Ensure FastAPI is running on port 8000. (${err.message})`,
      0
    );
  }
}

export const api = {
  /**
   * Health check to test backend and Gemini configuration
   */
  async checkHealth() {
    return request('/health', {}, 10000);
  },

  /**
   * Load the pre-packaged sample academic study notes
   */
  async loadSampleNotes() {
    return request('/load-sample', {
      method: 'POST',
    }, 20000);
  },

  /**
   * Upload a PDF file (with 60-second timeout for large files)
   * @param {File} file
   */
  async uploadPdf(file) {
    const formData = new FormData();
    formData.append('file', file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const url = `${API_BASE_URL}/upload`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetail = 'Upload failed.';
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (e) {
          errorDetail = await response.text();
        }
        throw new ApiError(errorDetail, response.status, errorDetail);
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new ApiError('PDF upload timed out. Please check file size and try again.', 504);
      }
      if (err instanceof ApiError) throw err;
      throw new ApiError(`Upload error: ${err.message}`, 0);
    }
  },

  /**
   * Send question to backend for TF-IDF retrieval + Gemini reasoning
   */
  async askQuestion(documentId, question, conversationHistory = []) {
    return request('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_id: documentId,
        question: question.trim(),
        conversation_history: conversationHistory,
      }),
    }, 30000);
  },

  /**
   * Generate document study summary
   */
  async summarizeDocument(documentId) {
    return request('/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: documentId }),
    }, 30000);
  },

  /**
   * Explain a specific concept from the notes
   */
  async explainConcept(documentId, concept) {
    return request('/explain-concept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_id: documentId,
        concept: concept.trim(),
      }),
    }, 30000);
  },

  /**
   * Generate exam study questions
   */
  async generateQuestions(documentId, count = 5) {
    return request('/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_id: documentId,
        count: count,
      }),
    }, 30000);
  },

  /**
   * Generate interactive MCQs
   */
  async generateMCQs(documentId, count = 4) {
    return request('/generate-mcqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_id: documentId,
        count: count,
      }),
    }, 30000);
  },

  /**
   * Get active documents in session
   */
  async getDocuments() {
    return request('/documents', {}, 10000);
  },

  /**
   * Get detailed page breakdown for document
   */
  async getDocumentDetails(documentId) {
    return request(`/document/${documentId}`, {}, 10000);
  },

  /**
   * Delete document from session
   */
  async deleteDocument(documentId) {
    return request(`/document/${documentId}`, {
      method: 'DELETE',
    }, 10000);
  },
};
