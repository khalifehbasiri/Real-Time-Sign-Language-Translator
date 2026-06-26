import axios from 'axios';

const PRODUCTION_API_FALLBACK = "https://real-time-sign-language-translator-coc0.onrender.com";
const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://127.0.0.1:5000"
    : PRODUCTION_API_FALLBACK);

const REQUEST_TIMEOUT_MS = 15000;

// Function to send landmarks to the backend
export const sendLandmarks = async (landmarks) => {
  try {
    const response = await axios.post(
      `${API_URL}/predict`,
      { keypoints: landmarks },
      { timeout: REQUEST_TIMEOUT_MS }
    );
    return {
      prediction: response.data.prediction,
      confidence: response.data.confidence ?? null,
      error: null,
    };
  } catch (error) {
    const statusCode = error?.response?.status ?? null;
    const serverErrorMessage = error?.response?.data?.error;
    const timeoutMessage = error.code === "ECONNABORTED" ? "Request timed out." : null;
    const fallbackMessage = error.message || "Failed to reach prediction API.";
    const errorMessage = serverErrorMessage || timeoutMessage || fallbackMessage;

    console.error("Error communicating with the backend:", {
      apiUrl: API_URL,
      statusCode,
      errorMessage,
    });

    return {
      prediction: null,
      confidence: null,
      error: errorMessage,
      statusCode,
    };
  }
};
