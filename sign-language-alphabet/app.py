###############################################################
# File: app.py
# Purpose: Serve a landmark classifier via Flask
# Usage: python app.py
###############################################################
import json
import os

import numpy as np
import tensorflow as tf
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MODEL_PATH = "landmark_model.h5"
LABEL_MAP_PATH = "label_map.json"
EXPECTED_KEYPOINTS = 63  # 21 landmarks * (x, y, z)


def load_label_map(path):
    with open(path, "r", encoding="utf-8") as file:
        data = json.load(file)
    # Preserve previous format { "0": "A" } while accepting int keys too.
    return {int(key): value for key, value in data.items()}


def normalize_landmarks(landmarks):
    """
    Normalize landmarks by wrist position and hand scale.
    """
    points = np.asarray(landmarks, dtype=np.float32).reshape(21, 3)
    wrist = points[0].copy()
    centered = points - wrist
    scale = np.max(np.linalg.norm(centered[:, :2], axis=1))
    if scale < 1e-6:
        scale = 1.0
    normalized = centered / scale
    return normalized.reshape(1, EXPECTED_KEYPOINTS)


def load_model_if_present():
    if not os.path.exists(MODEL_PATH):
        return None
    return tf.keras.models.load_model(MODEL_PATH, compile=False)


def warmup_model_if_ready(loaded_model):
    """
    Run one tiny forward pass so first real request is faster.
    """
    if loaded_model is None:
        return
    dummy_input = np.zeros((1, EXPECTED_KEYPOINTS), dtype=np.float32)
    loaded_model(dummy_input, training=False)


model = load_model_if_present()
label_map = load_label_map(LABEL_MAP_PATH) if os.path.exists(LABEL_MAP_PATH) else {}
warmup_model_if_ready(model)


@app.route("/predict", methods=["POST"])
def predict():
    """
    Accepts JSON payload:
      { "keypoints": [x1, y1, z1, ..., x21, y21, z21] }
    """
    if model is None:
        return jsonify(
            {
                "error": (
                    "landmark_model.h5 not found. Train the landmark model first "
                    "using train_landmark_model.py."
                )
            }
        ), 503

    payload = request.get_json(silent=True) or {}
    keypoints = payload.get("keypoints")

    if not isinstance(keypoints, list):
        return jsonify({"error": "Expected JSON body with a keypoints list."}), 400

    if len(keypoints) != EXPECTED_KEYPOINTS:
        return jsonify(
            {
                "error": (
                    f"Expected {EXPECTED_KEYPOINTS} keypoint values "
                    "(21 landmarks * x,y,z)."
                )
            }
        ), 400

    try:
        features = normalize_landmarks(keypoints)
    except (ValueError, TypeError):
        return jsonify({"error": "Keypoints must be numeric values."}), 400

    preds = model(features, training=False).numpy()[0]
    pred_idx = int(np.argmax(preds))
    confidence = float(preds[pred_idx])
    prediction = label_map.get(pred_idx, str(pred_idx))

    return jsonify({"prediction": prediction, "confidence": confidence})


@app.route("/", methods=["GET"])
def home():
    return "Sign language landmark prediction API is running."


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
