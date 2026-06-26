###############################################################
# File: train_model.py
# Purpose: Train a CNN to recognize ASL letters A-Z from images
# Usage: python train_model.py
###############################################################
import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

# 1. Define paths
TRAIN_DIR = 'C:/Users/khali/OneDrive/Desktop/khalifa/Projects/Real-Time Sign Language Translator/sign-language-alphabet/dataset_split/train'
VAL_DIR = 'C:/Users/khali/OneDrive/Desktop/khalifa/Projects/Real-Time Sign Language Translator/sign-language-alphabet/dataset_split/val'
TEST_DIR = 'C:/Users/khali/OneDrive/Desktop/khalifa/Projects/Real-Time Sign Language Translator/sign-language-alphabet/dataset_split/test'

# 2. Define image parameters
IMG_SIZE = (128, 128)
BATCH_SIZE = 32
EPOCHS = 20

# 3. Create ImageDataGenerators for train, val, test
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest'
)

val_datagen = ImageDataGenerator(rescale=1./255)
test_datagen = ImageDataGenerator(rescale=1./255)

train_generator = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical'
)

val_generator = val_datagen.flow_from_directory(
    VAL_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical'
)

test_generator = test_datagen.flow_from_directory(
    TEST_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

# Get number of classes
num_classes = len(train_generator.class_indices)
print("Class indices:", train_generator.class_indices)
# Example: {"A":0, "B":1, ..., "Z":25}

########################################################
# 4. Build a CNN model
########################################################
model = Sequential()

model.add(Conv2D(32, (3,3), activation='relu', input_shape=(IMG_SIZE[0], IMG_SIZE[1], 3)))
model.add(MaxPooling2D((2,2)))

model.add(Conv2D(64, (3,3), activation='relu'))
model.add(MaxPooling2D((2,2)))

model.add(Conv2D(128, (3,3), activation='relu'))
model.add(MaxPooling2D((2,2)))

model.add(Flatten())
model.add(Dense(128, activation='relu'))
model.add(Dropout(0.5))
model.add(Dense(num_classes, activation='softmax'))

model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# 5. Define callbacks to save the best model and stop early
early_stop = EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True)
checkpoint = ModelCheckpoint('best_alphabet_model.h5', monitor='val_loss', 
                             save_best_only=True, verbose=1)

# 6. Train the model
history = model.fit(
    train_generator,
    epochs=EPOCHS,
    validation_data=val_generator,
    callbacks=[early_stop, checkpoint]
)

# 7. Evaluate on the test set
test_loss, test_acc = model.evaluate(test_generator, verbose=0)
print(f"Final Test Accuracy: {test_acc:.4f}")

# If you used save_best_only=True in ModelCheckpoint,
# the best model is saved to 'best_alphabet_model.h5'.
# Load it back if you want to confirm:
best_model = load_model('best_alphabet_model.h5')
test_loss_best, test_acc_best = best_model.evaluate(test_generator, verbose=0)
print(f"Best Model Test Accuracy: {test_acc_best:.4f}")

# 8. Save class index -> label map
# Invert the dictionary: e.g., {0:"A",1:"B",...}
label_map = {v: k for k, v in train_generator.class_indices.items()}
with open('label_map.json', 'w') as f:
    json.dump(label_map, f)

print("Training complete! Saved model as best_alphabet_model.h5 and label_map.json.")
