import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os
from sklearn.metrics import confusion_matrix, precision_recall_curve
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# --- OWNER'S DIRECTIVES / CONFIGURATION ---
BASE_PATH = '/content/drive/MyDrive/Colab Notebooks/backend'
MODEL_NAME = "microsoft/deberta-v3-base"
DATA_PATH = os.path.join(BASE_PATH, "Data/Generated/Chunk2_D/train.csv")

# 1. Function to load the data (with owner's try-except logic)
def load_data(file_path=DATA_PATH):
    """Loads the dataset from the specified file path."""
    try:
        dataset = pd.read_csv(file_path)
        print(f"Dataset successfully loaded from: {file_path}")
        return dataset
    except Exception as e:
        print(f"Error loading data: {e}")
        return None         

# 2. Function to load the tokenizer
def load_tokenizer(model_name=MODEL_NAME):
    """Initializes the tokenizer for the specified model."""
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        return tokenizer
    except Exception as e:
        print(f"Error loading tokenizer: {e}")
        return None

# 3. Function to load the model
def get_model(model_name=MODEL_NAME, num_labels=2):
    """Initializes the model for sequence classification."""
    try:
        model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=num_labels)
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

# 4. Function to plot data distribution
def plot_distribution(data, column):
    try:
        plt.figure(figsize=(10, 6))
        data[column].value_counts().plot(kind='bar', color='skyblue')
        plt.title(f'Distribution of {column}')
        plt.xlabel(column)
        plt.ylabel('Count')
        plt.show()
    except Exception as e:
        print(f"Error plotting distribution: {e}")

# 5. Function to plot training accuracy
def plot_accuracy(train_acc, val_acc):
    try:
        plt.figure(figsize=(10, 6))
        plt.plot(train_acc, label='Training Accuracy', marker='o')
        plt.plot(val_acc, label='Validation Accuracy', marker='x')
        plt.title('Model Accuracy')
        plt.xlabel('Epoch')
        plt.ylabel('Accuracy')
        plt.legend()
        plt.grid(True)
        plt.show()
    except Exception as e:
        print(f"Error plotting accuracy: {e}")

# 6. Function to plot training loss
def plot_loss(train_loss, val_loss):
    try:
        plt.figure(figsize=(10, 6))
        plt.plot(train_loss, label='Training Loss')
        plt.plot(val_loss, label='Validation Loss')
        plt.title('Model Loss')
        plt.xlabel('Steps/Epoch')
        plt.ylabel('Loss')
        plt.legend()
        plt.grid(True)
        plt.show()
    except Exception as e:
        print(f"Error plotting loss: {e}")

# 7. Function to plot the confusion matrix
def plot_confusion_matrix(y_true, y_pred, classes=[0,1]):
    try:
        cm = confusion_matrix(y_true, y_pred)
        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=classes, yticklabels=classes)
        plt.xlabel('Predicted Label')
        plt.ylabel('True Label')
        plt.title('Confusion Matrix')
        plt.show()
    except Exception as e:
        print(f"Error plotting confusion matrix: {e}")

# 8. Function to plot precision-recall/F1 curve
def plot_precision_recall(y_true, y_scores):
    try:
        precision, recall, _ = precision_recall_curve(y_true, y_scores)
        f1_scores = 2 * (precision * recall) / (precision + recall + 1e-10)
        plt.figure(figsize=(10, 6))
        plt.plot(recall, f1_scores, marker='.', label='F1 Curve')
        plt.xlabel('Recall')
        plt.ylabel('F1 Score')
        plt.title('F1 Score vs Recall')
        plt.legend()
        plt.show()
    except Exception as e:
        print(f"Error plotting precision-recall: {e}")