import os
from dotenv import load_dotenv
from pathlib import Path
from backboard import BackboardClient

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path)

def create_client():
    api_key = os.getenv("BACKBOARD_API_KEY")
    if not api_key:
        raise ValueError("Missing BACKBOARD_API_KEY in .env")
    return BackboardClient(api_key=api_key)

def get_client():
    return create_client()