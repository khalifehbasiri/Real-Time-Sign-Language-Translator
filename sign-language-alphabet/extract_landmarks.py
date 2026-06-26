"""
Extract hand landmarks from an image dataset (A-Z folders) for model training.

Example:
python extract_landmarks.py \
  --dataset_dir "C:/path/to/asl_alphabet_dataset" \
  --output_npz "landmark_dataset.npz"
"""

from __future__ import annotations

import argparse
import json
import os
import urllib.request
from collections import defaultdict

import mediapipe as mp
import numpy as np
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from sklearn.model_selection import train_test_split

HAND_LANDMARKER_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/1/hand_landmarker.task"
)
EXPECTED_KEYPOINTS = 63


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dataset_dir",
        required=True,
        help="Directory containing class folders (A, B, ..., Z).",
    )
    parser.add_argument(
        "--output_npz",
        default="landmark_dataset.npz",
        help="Output .npz file for train/val/test splits.",
    )
    parser.add_argument(
        "--label_map_path",
        default="label_map.json",
        help="Path to save class index -> label mapping.",
    )
    parser.add_argument(
        "--model_asset_path",
        default="hand_landmarker.task",
        help="Local HandLandmarker model file path.",
    )
    parser.add_argument(
        "--min_hand_detection_confidence",
        type=float,
        default=0.35,
        help="Lower values detect more samples but may be noisier.",
    )
    parser.add_argument(
        "--test_size",
        type=float,
        default=0.15,
        help="Fraction reserved for test split.",
    )
    parser.add_argument(
        "--val_size",
        type=float,
        default=0.15,
        help="Fraction reserved for validation split.",
    )
    parser.add_argument(
        "--random_state",
        type=int,
        default=42,
        help="Random seed for reproducible splits.",
    )
    parser.add_argument(
        "--max_per_class",
        type=int,
        default=0,
        help="Optional cap per class for quick experiments (0 means use all).",
    )
    return parser.parse_args()


def ensure_model_asset(path):
    if os.path.exists(path):
        return
    print(f"Downloading HandLandmarker model -> {path}")
    urllib.request.urlretrieve(HAND_LANDMARKER_URL, path)


def normalize_landmarks(flat_landmarks):
    points = np.asarray(flat_landmarks, dtype=np.float32).reshape(21, 3)
    wrist = points[0].copy()
    centered = points - wrist
    scale = np.max(np.linalg.norm(centered[:, :2], axis=1))
    if scale < 1e-6:
        scale = 1.0
    normalized = centered / scale
    return normalized.reshape(EXPECTED_KEYPOINTS).astype(np.float32)


def extract_landmarks(detector, image_path):
    image = mp.Image.create_from_file(image_path)
    result = detector.detect(image)
    if not result.hand_landmarks:
        return None

    first_hand = result.hand_landmarks[0]
    flat = []
    for lm in first_hand:
        flat.extend([lm.x, lm.y, lm.z])

    if len(flat) != EXPECTED_KEYPOINTS:
        return None
    return normalize_landmarks(flat)


def list_classes(dataset_dir):
    classes = [
        name
        for name in sorted(os.listdir(dataset_dir))
        if os.path.isdir(os.path.join(dataset_dir, name))
    ]
    if not classes:
        raise ValueError("No class folders found in dataset_dir.")
    return classes


def can_stratify(y):
    _, counts = np.unique(y, return_counts=True)
    return counts.min() >= 2


def main():
    args = parse_args()

    ensure_model_asset(args.model_asset_path)
    classes = list_classes(args.dataset_dir)
    class_to_idx = {name: idx for idx, name in enumerate(classes)}

    base_options = python.BaseOptions(model_asset_path=args.model_asset_path)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=1,
        min_hand_detection_confidence=args.min_hand_detection_confidence,
    )
    detector = vision.HandLandmarker.create_from_options(options)

    features = []
    labels = []
    class_stats = defaultdict(lambda: {"total": 0, "kept": 0})

    for class_name in classes:
        class_dir = os.path.join(args.dataset_dir, class_name)
        image_files = [
            file_name
            for file_name in sorted(os.listdir(class_dir))
            if file_name.lower().endswith((".jpg", ".jpeg", ".png"))
        ]
        if args.max_per_class > 0:
            image_files = image_files[: args.max_per_class]
        for file_name in image_files:
            image_path = os.path.join(class_dir, file_name)
            class_stats[class_name]["total"] += 1
            landmarks = extract_landmarks(detector, image_path)
            if landmarks is None:
                continue
            features.append(landmarks)
            labels.append(class_to_idx[class_name])
            class_stats[class_name]["kept"] += 1

        kept = class_stats[class_name]["kept"]
        total = class_stats[class_name]["total"]
        pct = (100.0 * kept / total) if total else 0.0
        print(f"[{class_name}] kept {kept}/{total} ({pct:.1f}%)")

    if not features:
        raise RuntimeError("No landmarks extracted. Check dataset path/model settings.")

    X = np.asarray(features, dtype=np.float32)
    y = np.asarray(labels, dtype=np.int32)
    label_names = np.asarray(classes)

    holdout_size = args.test_size + args.val_size
    X_train, X_holdout, y_train, y_holdout = train_test_split(
        X,
        y,
        test_size=holdout_size,
        stratify=y if can_stratify(y) else None,
        random_state=args.random_state,
    )

    relative_test_size = args.test_size / holdout_size
    X_val, X_test, y_val, y_test = train_test_split(
        X_holdout,
        y_holdout,
        test_size=relative_test_size,
        stratify=y_holdout if can_stratify(y_holdout) else None,
        random_state=args.random_state,
    )

    np.savez_compressed(
        args.output_npz,
        X_train=X_train,
        y_train=y_train,
        X_val=X_val,
        y_val=y_val,
        X_test=X_test,
        y_test=y_test,
        labels=label_names,
    )

    with open(args.label_map_path, "w", encoding="utf-8") as file:
        json.dump({idx: label for idx, label in enumerate(classes)}, file, indent=2)

    print("\nExtraction complete.")
    print(f"Saved dataset: {args.output_npz}")
    print(f"Saved label map: {args.label_map_path}")
    print(
        "Split sizes:",
        f"train={len(X_train)}",
        f"val={len(X_val)}",
        f"test={len(X_test)}",
    )


if __name__ == "__main__":
    main()
