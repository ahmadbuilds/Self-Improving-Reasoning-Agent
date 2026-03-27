import pandas as pd 
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix
from sklearn.metrics import precision_recall_curve
import seaborn as sns
from transformers import AutoTokenizer

#function to load the data
def load_data(file_path):
    """
    Loads the dataset from the specified file path.

    Args:
        file_path (str): The path to the CSV file containing the dataset.
    Returns:
        pd.DataFrame: The loaded dataset as a pandas DataFrame.
    """
    try:
        dataset = pd.read_csv(file_path)
        return dataset
    except Exception as e:
        print(f"Error loading data: {e}")
        return None
    
#function to plot the distribution of the data
def plot_distribution(data, column):
    """
    Plots the distribution of the specified column in the dataset.

    Args:
        data (pd.DataFrame): The dataset as a pandas DataFrame.
        column (str): The name of the column to plot the distribution for.
    """
    try:
        plt.figure(figsize=(10, 6))
        data[column].value_counts().plot(kind='bar')
        plt.title(f'Distribution of {column}')
        plt.xlabel(column)
        plt.ylabel('Count')
        plt.show()
    except Exception as e:
        print(f"Error plotting distribution: {e}")


#function to plot the accuracy
def plot_accuracy(train_acc, val_acc):
    """
    Plots the accuracy of the specified column in the dataset.

    Args:
        data (pd.DataFrame): The dataset as a pandas DataFrame.
        column (str): The name of the column to plot the accuracy for.
    """
    try:
        plt.figure(figsize=(10, 6))
        plt.plot(train_acc, label='Training Accuracy')
        plt.plot(val_acc, label='Validation Accuracy')
        plt.title('Model Accuracy')
        plt.xlabel('Epoch')
        plt.ylabel('Accuracy')
        plt.legend()
        plt.show()
    except Exception as e:
        print(f"Error plotting accuracy: {e}")

#function to plot the loss
def plot_loss(train_loss, val_loss):
    """
    Plots the loss of the specified column in the dataset.

    Args:
        data (pd.DataFrame): The dataset as a pandas DataFrame.
        column (str): The name of the column to plot the loss for.
    """
    try:
        plt.figure(figsize=(10, 6))
        plt.plot(train_loss, label='Training Loss')
        plt.plot(val_loss, label='Validation Loss')
        plt.title('Model Loss')
        plt.xlabel('Epoch')
        plt.ylabel('Loss')
        plt.legend()
        plt.show()
    except Exception as e:
        print(f"Error plotting loss: {e}")

#function to plot the confusion matrix
def plot_confusion_matrix(y_true, y_pred,classes=[0,1]):
    """
    Plots the confusion matrix for the given true and predicted labels.
    
    Args:
        y_true (array-like): True labels.
        y_pred (array-like): Predicted labels.
        classes (list): List of class labels to display on the axes.    
    """
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=classes, yticklabels=classes)
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.show()


#function to plot the precision-recall curve
def plot_precision_recall(y_true, y_scores):
    """
    Plots the precision-recall curve for the given true labels and predicted scores.
    Args:
        y_true (array-like): True labels.
        y_scores (array-like): Predicted scores or probabilities for the positive class.
    """
    precision, recall, _ = precision_recall_curve(y_true, y_scores)
    f1_scores = 2 * (precision * recall) / (precision + recall)
    plt.plot(recall, f1_scores, marker='.')
    plt.xlabel('Recall')
    plt.ylabel('F1 Score')
    plt.title('F1 Score Curve')
    plt.show()


#function to load the tokenizer
def load_tokenizer(model_name):
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    return tokenizer