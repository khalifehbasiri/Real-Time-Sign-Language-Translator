import axios from 'axios';

const PRODUCTION_API_FALLBACK = "https://real-time-sign-language-translator-coc0.onrender.com";
const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://127.0.0.1:5000"
    : PRODUCTION_API_FALLBACK);

// Function to send landmarks to the backend
export const sendLandmarks = async (landmarks) => {
  try {
    const response = await axios.post(`${API_URL}/predict`, { keypoints: landmarks });
    return {
      prediction: response.data.prediction,
      confidence: response.data.confidence ?? null,
    };
  } catch (error) {
    console.error("Error communicating with the backend:", error);
    return null;
  }
};