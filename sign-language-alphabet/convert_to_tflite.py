###############################################################
# File: convert_to_tflite.py
# Purpose: Convert the trained Keras landmark model to TFLite
# Usage: python convert_to_tflite.py
###############################################################
import os

import tensorflow as tf

H5_MODEL_PATH = "landmark_model.h5"
TFLITE_MODEL_PATH = "landmark_model.tflite"


def convert_model():
    if not os.path.exists(H5_MODEL_PATH):
        raise FileNotFoundError(
            f"{H5_MODEL_PATH} not found. Train the model before converting it."
        )

    model = tf.keras.models.load_model(H5_MODEL_PATH, compile=False)
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]

    tflite_model = converter.convert()

    with open(TFLITE_MODEL_PATH, "wb") as file:
        file.write(tflite_model)

    print(f"Converted {H5_MODEL_PATH} -> {TFLITE_MODEL_PATH}")
    print(f"TFLite model size: {len(tflite_model) / 1024:.1f} KB")


if __name__ == "__main__":
    convert_model()
