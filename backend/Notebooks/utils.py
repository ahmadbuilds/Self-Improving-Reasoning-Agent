import os
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, precision_recall_curve
import seaborn as sns
from transformers import AutoTokenizer
import tensorflow as tf
try:
    from backend.prompts.reasoning_prompt import reasoning_prompt
except ModuleNotFoundError:
    from prompts.reasoning_prompt import reasoning_prompt
from groq import Groq
import re 


#function to load the dataset
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
        print(f"Dataset successfully loaded from: {file_path}")
        return dataset
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

#function to load the tokenizer
def load_tokenizer(model_name):
    """Load a HuggingFace tokenizer by model name."""
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    return tokenizer


#function to plot the distribution of a column in the dataset
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



#function to plot the lengths of the instruction, reasoning, and response columns in the dataset
def plot_text_lengths(df, save_path=None):
    """
    Plot histograms of instruction, reasoning, and response text lengths.

    Args:
        df (pd.DataFrame): DataFrame with 'INSTRUCTION', 'reasoning', 'RESPONSE' columns.
        save_path (str, optional): If provided, save the figure to this path.
    """
    df = df.copy()
    df['instruction_len'] = df['INSTRUCTION'].astype(str).apply(len)
    df['reasoning_len']   = df['reasoning'].astype(str).apply(len)
    df['response_len']    = df['RESPONSE'].astype(str).apply(len)

    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    for ax, col, color, title in zip(
        axes,
        ['instruction_len', 'reasoning_len', 'response_len'],
        ['#3498db', '#9b59b6', '#e67e22'],
        ['Instruction Length', 'Reasoning Length', 'Response Length'],
    ):
        ax.hist(df[col], bins=50, color=color, edgecolor='white', alpha=0.85)
        ax.axvline(df[col].median(), color='black', linestyle='--',
                   label=f'Median={df[col].median():.0f}')
        ax.set_title(title, fontsize=12, fontweight='bold')
        ax.set_xlabel('Characters')
        ax.set_ylabel('Count')
        ax.legend()

    plt.tight_layout()
    if save_path:
        fig.savefig(save_path, dpi=150, bbox_inches='tight')
        print(f'Saved → {save_path}')
    plt.show()



#function to plot training and validation accuracy and loss over epochs
def plot_accuracy(train_acc, val_acc):
    """
    Plots training and validation accuracy over epochs.

    Args:
        train_acc (list): Training accuracy per epoch.
        val_acc (list): Validation accuracy per epoch.
    """
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


#function to plot training and validation loss over epochs
def plot_loss(train_loss, val_loss):
    """
    Plots training and validation loss over epochs.

    Args:
        train_loss (list): Training loss per epoch.
        val_loss (list): Validation loss per epoch.
    """
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


#function to plot the confusion matrix for the given true and predicted labels
def plot_confusion_matrix(y_true, y_pred, classes=[0, 1]):
    """
    Plots the confusion matrix for the given true and predicted labels.

    Args:
        y_true (array-like): True labels.
        y_pred (array-like): Predicted labels.
        classes (list): List of class labels to display on the axes.
    """
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=classes, yticklabels=classes)
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.show()


#function to plot the F1-score curve derived from precision-recall values
def plot_precision_recall(y_true, y_scores):
    """
    Plots the F1-score curve derived from precision-recall values.

    Args:
        y_true (array-like): True labels.
        y_scores (array-like): Predicted scores / probabilities for the positive class.
    """
    precision, recall, _ = precision_recall_curve(y_true, y_scores)
    f1_scores = 2 * (precision * recall) / (precision + recall)
    plt.plot(recall, f1_scores, marker='.')
    plt.xlabel('Recall')
    plt.ylabel('F1 Score')
    plt.title('F1 Score Curve')
    plt.show()

#function to load the model with trained weights from a specified path
def load_model(checkpoint_path=None):
    """
    Loads the model with trained weights from a specified path.

    Args:
        checkpoint_path (str): The path to the checkpoint file containing the trained weights.
    """
    if checkpoint_path is None:
        checkpoint_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "Trained_Weights", "deberta_reasoning_best.keras")
    try:
        model=tf.keras.models.load_model(checkpoint_path)
        print(f"Model successfully loaded from: {checkpoint_path}")
        return model
    except Exception as e:
        print(f"Error loading model: {e}")



def extract_reasoning_and_answer(content: str):
    if not content or not content.strip():
        return None, None

    # Pattern 1: Split on labeled answer
    parts = re.split(r'(?i)\*{0,2}\s*(?:final\s+)?answer\s*\*{0,2}\s*:\s*\*{0,2}', content)
    if len(parts) > 1:
        answer_part = parts[-1].strip()
        reasoning_part = "Answer:".join(parts[:-1]).strip()
        reasoning_part = re.sub(r'(?i)^\*{0,2}\s*reasoning\s*\*{0,2}\s*:\s*\*{0,2}\s*', '', reasoning_part)
        if reasoning_part and answer_part:
            return reasoning_part, answer_part

    # Pattern 2: "The answer is X" at the end
    m = re.search(r'(?i)the\s+answer\s+is\s*[:\s]*(.+)$', content)
    if m:
        answer_part = m.group(1).strip().rstrip('.')
        reasoning_part = content[:m.start()].strip()
        reasoning_part = re.sub(r'(?i)^\*{0,2}\s*reasoning\s*\*{0,2}\s*:\s*\*{0,2}\s*', '', reasoning_part)
        if reasoning_part and answer_part:
            return reasoning_part, answer_part

    # Pattern 3: Last line is the answer
    lines = [l.strip() for l in content.strip().split('\n') if l.strip()]
    if len(lines) >= 2:
        last_line = lines[-1]
        last_line_clean = re.sub(
            r'(?i)^\*{0,2}\s*(?:answer|result|final answer)\s*\*{0,2}\s*:?\s*',
            '', last_line
        ).strip()
        if last_line_clean and len(last_line_clean) < 50:
            reasoning_part = '\n'.join(lines[:-1]) # Fixed the \n here!
            reasoning_part = re.sub(r'(?i)^\*{0,2}\s*reasoning\s*\*{0,2}\s*:\s*\*{0,2}\s*', '', reasoning_part)
            return reasoning_part, last_line_clean

    return content.strip(), None



def generate_reasoning(problem:str,client:Groq):
    """
    Generates step-by-step reasoning for a given math problem using the Groq API.
    Args:
        problem (str): The math problem to solve.
        client (Groq): An instance of the Groq client initialized with the API key.
    """
    chat_completion=client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role":"system",
                "content":reasoning_prompt
            },
            {
                "role":"user",
                "content":f"Problem: {problem}"
            }
        ],
        temperature=0.2
    )

    return chat_completion.choices[0].message.content