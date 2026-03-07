from backboard import BackboardClient
from dotenv import load_dotenv
import os

load_dotenv()

def get_client():
    api_key = os.getenv("BACKBOARD_API_KEY")
    return BackboardClient(api_key=api_key)