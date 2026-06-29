###############################################################
# File: app.py
# Purpose: Serve a landmark classifier via Flask
# Usage: python app.py
###############################################################
import json
import os
import time

import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

os.environ.setdefault("CUDA_VISIBLE_DEVICES", "-1")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

MODEL_PATH = "landmark_model.h5"
TFLITE_MODEL_PATH = "landmark_model.tflite"
LABEL_MAP_PATH = "label_map.json"
EXPECTED_KEYPOINTS = 63  # 21 landmarks * (x, y, z)
interpreter = None
input_details = None
output_details = None


def get_allowed_origins():
    """
    Configure explicit CORS origins. Set ALLOWED_ORIGINS as comma-separated URLs
    in Render for environment-specific control.
    """
    configured_origins = os.getenv("ALLOWED_ORIGINS", "")
    if configured_origins.strip():
        return [origin.strip() for origin in configured_origins.split(",") if origin.strip()]

    return [
        "https://real-time-sign-language-translator-woad.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": get_allowed_origins()}},
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


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


def get_tflite_interpreter_class():
    try:
        from ai_edge_litert.interpreter import Interpreter

        return Interpreter
    except ImportError:
        pass

    try:
        from tflite_runtime.interpreter import Interpreter

        return Interpreter
    except ImportError:
        pass

    try:
        import tensorflow as tf

        return tf.lite.Interpreter
    except ImportError as error:
        raise RuntimeError(
            "No TFLite runtime is installed. Install ai-edge-litert in production "
            "or tensorflow locally for development."
        ) from error


def load_interpreter_if_present():
    if not os.path.exists(TFLITE_MODEL_PATH):
        return None

    Interpreter = get_tflite_interpreter_class()
    loaded_interpreter = Interpreter(model_path=TFLITE_MODEL_PATH)
    loaded_interpreter.allocate_tensors()
    return loaded_interpreter


def get_interpreter():
    global interpreter, input_details, output_details

    if interpreter is None:
        started_at = time.perf_counter()
        print("Loading TFLite model...", flush=True)
        interpreter = load_interpreter_if_present()
        if interpreter is not None:
            input_details = interpreter.get_input_details()
            output_details = interpreter.get_output_details()
        print(f"TFLite model load finished in {time.perf_counter() - started_at:.2f}s", flush=True)

    return interpreter


def warmup_model_if_ready(loaded_interpreter):
    """
    Run one tiny forward pass so first real request is faster.
    """
    if loaded_interpreter is None:
        return
    dummy_input = np.zeros((1, EXPECTED_KEYPOINTS), dtype=np.float32)
    run_tflite_inference(dummy_input)


def run_tflite_inference(features):
    input_index = input_details[0]["index"]
    output_index = output_details[0]["index"]
    input_dtype = input_details[0]["dtype"]

    interpreter.set_tensor(input_index, features.astype(input_dtype))
    interpreter.invoke()
    return interpreter.get_tensor(output_index)[0]


label_map = load_label_map(LABEL_MAP_PATH) if os.path.exists(LABEL_MAP_PATH) else {}
if os.getenv("ENABLE_MODEL_WARMUP", "false").strip().lower() == "true":
    warmup_model_if_ready(get_interpreter())


@app.route("/predict", methods=["POST"])
def predict():
    """
    Accepts JSON payload:
      { "keypoints": [x1, y1, z1, ..., x21, y21, z21] }
    """
    loaded_interpreter = get_interpreter()

    if loaded_interpreter is None:
        return jsonify(
            {
                "error": (
                    "landmark_model.tflite not found. Convert landmark_model.h5 first "
                    "using convert_to_tflite.py."
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

    started_at = time.perf_counter()
    preds = run_tflite_inference(features)
    pred_idx = int(np.argmax(preds))
    confidence = float(preds[pred_idx])
    prediction = label_map.get(pred_idx, str(pred_idx))
    print(f"/predict inference finished in {time.perf_counter() - started_at:.3f}s", flush=True)

    return jsonify({"prediction": prediction, "confidence": confidence})


@app.route("/", methods=["GET"])
def home():
    return "Sign language landmark prediction API is running."


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
