import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


def get_supabase_client() -> Client:
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url:
        raise ValueError("Missing NEXT_PUBLIC_SUPABASE_URL in .env")

    if not key:
        raise ValueError("Missing SUPABASE_SERVICE_ROLE_KEY in .env")

    return create_client(url, key) 

    