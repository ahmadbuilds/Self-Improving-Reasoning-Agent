try:
    from backend.Notebooks.utils import *
    from backend.config import *
except ModuleNotFoundError:
    from Notebooks.utils import *
    from config import *

from fastapi import FastAPI,status,HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import tensorflow as tf
import numpy as np

app = FastAPI()

CORSMiddleware(
    app=app,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the Groq client with the API key from the environment variable
groq_client = Groq(api_key=groq)


#load the model
model=load_model()

#load the tokenizer
tokenizer=load_tokenizer('microsoft/deberta-v3-base')

class InputData(BaseModel):
    question:str

@app.post("/predict", status_code=status.HTTP_202_ACCEPTED)
async def predict(input_data: InputData):
    """
    Endpoint to receive a question and return a response.
    Args:
        input_data (InputData): The input data containing the question.
    """
    if not input_data.question:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question is required.")
    TOTAL_RETRIES = 3    
    COMBINED_TEXT = ""
    try:
        for attempt in range(TOTAL_RETRIES):
            # Generate reasoning for the input question using the Groq client
            response = generate_reasoning(input_data.question, groq_client)

            if response:
                # Extract reasoning and answer from the response
                reasoning, answer = extract_reasoning_and_answer(response)

                if not answer:
                    print(f"Attempt {attempt + 1}: Failed to extract answer from response. Retrying...")
                    continue

                COMBINED_TEXT = f"INSTRUCTION: {input_data.question}\n reasoning: {reasoning}\nRESPONSE: {answer}"
                break

        if not COMBINED_TEXT:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate a valid response after multiple attempts.")
        
        #tokenize the combined text
        tokenized_input=tokenizer(COMBINED_TEXT,
            padding='max_length',
            truncation=True,
            max_length=512,
            return_tensors='np'
        )

        finalized_input={
            'token_ids':tf.constant(tokenized_input['input_ids'],dtype=tf.int32),
            'padding_mask':tf.constant(tokenized_input['attention_mask'],dtype=tf.int32),
        }


        #get the model's prediction
        prediction=model.predict(finalized_input,verbose=0)

        prediction_class=int(np.argmax(prediction,axis=-1)[0])


        return{
            "question": input_data.question,
            "response": answer,
            "reasoning": reasoning,
            "predicted_class": "Correct" if prediction_class == 1 else "Wrong",
            "critic_confidence_scores": prediction.tolist()
        }
    except Exception as e:
        print(f"Error during prediction: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred during prediction.")