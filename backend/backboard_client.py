from backboard import BackboardClient
from dotenv import load_dotenv
from pathlib import Path
import os

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path)

def get_client():
    api_key = os.getenv("BACKBOARD_API_KEY")
    if not api_key:
        raise ValueError("Missing BACKBOARD_API_KEY in .env")
    return BackboardClient(api_key=api_key)