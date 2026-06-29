# Real-Time Sign Language Translator

An AI-powered web application that translates ASL hand signs into text in real time using MediaPipe hand landmarks and a TensorFlow Lite classifier.

## Highlights

- Real-time webcam inference with MediaPipe hand landmark tracking
- Landmark-based TensorFlow/TFLite model (`63` features per frame: `21` points × `x,y,z`)
- React frontend with live camera visualization and translation console
- Flask backend API serving predictions and confidence scores

## Tech Stack

- **Frontend:** React, Axios, MediaPipe Hands
- **Backend:** Flask, TensorFlow Lite/LiteRT, NumPy
- **ML/Data:** MediaPipe Hand Landmarker, scikit-learn

## Architecture

```mermaid
flowchart LR
    A[Webcam Feed] --> B[MediaPipe Hands]
    B --> C[21 Landmarks x,y,z]
    C --> D[React API Client]
    D --> E[Flask /predict]
    E --> F[TFLite Landmark Model]
    F --> G[Prediction + Confidence]
    G --> H[Translation Console UI]
```

## Repository Structure

```text
.
├─ frontend/
│  ├─ src/
│  │  ├─ components/HandTracking.js
│  │  ├─ services/api.js
│  │  ├─ App.js
│  │  └─ App.css
│  └─ package.json
├─ sign-language-alphabet/
│  ├─ app.py
│  ├─ convert_to_tflite.py
│  ├─ extract_landmarks.py
│  ├─ train_landmark_model.py
│  ├─ requirements.txt
│  ├─ requirements-prod.txt
│  └─ Dockerfile
└─ README.md
```

## Local Setup

### 1) Backend

```bash
cd sign-language-alphabet
python -m venv env
env\Scripts\activate
pip install -r requirements.txt
python app.py
```

Backend runs on `http://127.0.0.1:5000`.

### 2) Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`.

## Render Deployment (Backend)

To reduce cold-start overhead on Render free instances, use the slim runtime dependency file:

- **Root Directory:** `sign-language-alphabet`
- **Build Command:** `pip install -r requirements-prod.txt`
- **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120 --workers 1 --threads 1`
- **Health Check Path:** `/`

Use `requirements.txt` for local training/conversion and `requirements-prod.txt` for Render runtime.
Render serves `landmark_model.tflite`; convert it locally from `landmark_model.h5` before deploying.

## Model Training

Training scripts are included in `sign-language-alphabet/extract_landmarks.py` and
`sign-language-alphabet/train_landmark_model.py`.

## Model Conversion

The trained Keras model (`landmark_model.h5`) is converted once into a smaller
TensorFlow Lite model for production inference:

```bash
cd sign-language-alphabet
python convert_to_tflite.py
```

Commit or deploy the generated `landmark_model.tflite` with the backend.

## API

### `POST /predict`

Request body:

```json
{
  "keypoints": [0.12, 0.34, -0.02, "... total 63 values ..."]
}
```

Response:

```json
{
  "prediction": "A",
  "confidence": 0.98
}
```

## Known Limitations & Roadmap

This project is an actively evolving demo. Current known limitations:

- **Static alphabet dataset:** The classifier is trained on a static ASL alphabet image dataset, so accuracy varies for visually similar letters (e.g., `M`/`N`/`S`/`T`) and for hand positions, distances, or lighting that differ from the training data.
- **No motion-based letters:** Signs that require movement (`J`, `Z`) are not supported, since classification uses single-frame landmarks rather than a temporal sequence.
- **Single-hand, single-frame inference:** One hand is tracked per frame with no temporal smoothing, so predictions can flicker between similar classes.
- **Confidence gating:** The frontend withholds predictions below a confidence threshold (default `0.70`) to avoid surfacing weak guesses; very ambiguous signs may therefore show `-`.

Planned improvements:

- Mirror-augmented training (negate the x-axis of each normalized sample) so the model is fully hand-agnostic without relying on client-side mirroring.
- A temporal model (LSTM/GRU or sliding-window) to support dynamic, motion-based signs.
- Larger and more diverse training data (lighting, skin tone, camera angle) to improve real-world robustness.
- Per-class confidence thresholds and temporal smoothing to stabilize live predictions.

## Author

- Khalifeh Basiri  
- Website: [https://kbasiri.com](https://kbasiri.com)
