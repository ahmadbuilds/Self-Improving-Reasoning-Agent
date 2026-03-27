import os 
from dotenv import load_dotenv

load_dotenv(".env.local")


groq=os.getenv("GROQ_API_KEY")