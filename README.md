# Real-Time Sign Language Translator

An AI-powered web application that translates ASL hand signs into text in real time using MediaPipe hand landmarks and a TensorFlow classifier.

## Highlights

- Real-time webcam inference with MediaPipe hand landmark tracking
- Landmark-based TensorFlow model (`63` features per frame: `21` points × `x,y,z`)
- React frontend with live camera visualization and translation console
- Flask backend API serving predictions and confidence scores

## Tech Stack

- **Frontend:** React, Axios, MediaPipe Hands
- **Backend:** Flask, TensorFlow, NumPy
- **ML/Data:** MediaPipe Hand Landmarker, scikit-learn

## Architecture

```mermaid
flowchart LR
    A[Webcam Feed] --> B[MediaPipe Hands]
    B --> C[21 Landmarks x,y,z]
    C --> D[React API Client]
    D --> E[Flask /predict]
    E --> F[TensorFlow Landmark Model]
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
│  ├─ extract_landmarks.py
│  ├─ train_landmark_model.py
│  ├─ requirements.txt
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

## Model Training

Training scripts are included in `sign-language-alphabet/extract_landmarks.py` and
`sign-language-alphabet/train_landmark_model.py`.

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

## Author

- Khalifeh Basiri  
- Website: [https://kbasiri.com](https://kbasiri.com)
