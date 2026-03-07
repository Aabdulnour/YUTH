import os
from dotenv import load_dotenv
from pathlib import Path
from supabase import create_client, Client

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path)

def get_supabase_client() -> Client:
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        raise ValueError("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")

    return create_client(url, key)