import React, { useEffect, useRef } from "react";
import { Hands } from "@mediapipe/hands";
import * as drawingUtils from "@mediapipe/drawing_utils"; // optional for drawing
import { sendLandmarks } from '../services/api'; // Import API function

function HandTracking({ onTranslationUpdate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const frameRequestRef = useRef(null);
  const lastPredictionTimeRef = useRef(0);
  const predictionInFlightRef = useRef(false);
  const PREDICTION_INTERVAL_MS = 800;
  // The model was trained on a single hand orientation (the dataset images are
  // right-handed). A left and right hand are horizontal mirror images, so we
  // normalize every detected hand to this orientation before predicting.
  // If predictions are reversed (right hand works, left doesn't), switch to "Left".
  const MODEL_HANDEDNESS = "Left";

  useEffect(() => {
    let cancelled = false;

    // Initialize MediaPipe Hands
    const hands = new Hands({
      locateFile: (file) => {
        // Tells MediaPipe where to get its WASM and other files
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    // Set some configuration options
    hands.setOptions({
      selfieMode: true,              // flips the image for a selfie view
      maxNumHands: 1,               // track only one hand (or more if needed)
      modelComplexity: 1,           // model complexity (0,1,2)
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    // Define a callback that runs each time a hand is detected
    hands.onResults(onResults);

    const startCamera = async () => {
      try {
        // Request permission once so labels are available during device selection.
        const permissionStream = await navigator.mediaDevices.getUserMedia({ video: true });
        permissionStream.getTracks().forEach((track) => track.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((device) => device.kind === "videoinput");

        // Prefer physical webcam over virtual Camo camera when both are present.
        const preferredDevice =
          videoInputs.find((device) => !device.label.toLowerCase().includes("camo")) ||
          videoInputs[0];

        const constraints = preferredDevice
          ? {
              video: {
                deviceId: { exact: preferredDevice.deviceId },
                width: { ideal: 640 },
                height: { ideal: 480 },
              },
            }
          : {
              video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
              },
            };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled || !videoRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const processFrame = async () => {
          if (cancelled || !videoRef.current) {
            return;
          }
          await hands.send({ image: videoRef.current });
          frameRequestRef.current = window.requestAnimationFrame(processFrame);
        };

        processFrame();
      } catch (error) {
        console.error("Unable to start webcam:", error);
      }
    };

    startCamera();

    // Cleanup function
    return () => {
      cancelled = true;

      if (frameRequestRef.current) {
        window.cancelAnimationFrame(frameRequestRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      hands.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * onResults callback
   * This function is triggered each time MediaPipe processes a new frame.
   */
  const onResults = (results) => {
    // Optional: Draw the results on a canvas
    drawResults(results);

    // If a hand is detected, get the 21 landmarks
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0]; // Only first hand

      // Mirror the landmarks horizontally when the detected hand is the opposite
      // orientation from what the model was trained on. MediaPipe x is in [0, 1],
      // so a horizontal flip is simply (1 - x). This makes the left and right hand
      // produce identical geometry for the classifier.
      const handedness = results.multiHandedness?.[0]?.label;
      const shouldMirror = Boolean(handedness) && handedness !== MODEL_HANDEDNESS;

      // Convert the landmarks (each has x, y, z) into a flat array [x1, y1, z1, x2, y2, z2, ...]
      const flatLandmarks = [];
      landmarks.forEach((lm) => {
        const x = shouldMirror ? 1 - lm.x : lm.x;
        flatLandmarks.push(x, lm.y, lm.z);
      });

      // Send landmarks to the backend for sign recognition
      const now = Date.now();
      if (now - lastPredictionTimeRef.current >= PREDICTION_INTERVAL_MS) {
        lastPredictionTimeRef.current = now;
        getPrediction(flatLandmarks);
      }
    }
  };


  const getPrediction = async (landmarksArray) => {
    if (predictionInFlightRef.current) {
      return;
    }

    predictionInFlightRef.current = true;
    try {
      const result = await sendLandmarks(landmarksArray); // Use the API service
      if (result?.prediction) {
        onTranslationUpdate(result); // Update the parent component with prediction + confidence
      } else if (result?.error) {
        onTranslationUpdate(result);
      }
    } catch (error) {
      console.error("Error during prediction:", error);
      onTranslationUpdate({
        prediction: null,
        confidence: null,
        error: "Prediction request failed.",
      });
    } finally {
      predictionInFlightRef.current = false;
    }
  };
  

  /**
   * Draw results on a canvas (hand annotations)
   */
  const drawResults = (results) => {
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Draw the camera image
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    // Draw the landmarks on top of the image
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        drawingUtils.drawConnectors(
          canvasCtx,
          landmarks,
          Hands.CONNECTORS,
          { color: "#00FF00", lineWidth: 2 }
        );
        drawingUtils.drawLandmarks(canvasCtx, landmarks, {
          color: "#FF0000",
          lineWidth: 1,
        });
      }
    }
    canvasCtx.restore();
  };

  return (
    <div className="camera-stage">
      {/* Hidden video stream */}
      <video
        ref={videoRef}
        style={{ display: "none" }}
        width={640}
        height={480}
        autoPlay
      />
      {/* Canvas for showing the camera + landmarks */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="camera-canvas"
      />
    </div>
  );
}

export default HandTracking;
