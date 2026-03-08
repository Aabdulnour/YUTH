import os
from dotenv import load_dotenv
from supabase import create_client, Client

# This loads the .env in the SAME folder where you run Python
load_dotenv()

def get_supabase_client() -> Client:
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    print("DEBUG URL:", url)
    print("DEBUG KEY EXISTS:", bool(key))

    if not url:
        raise ValueError("Missing NEXT_PUBLIC_SUPABASE_URL")

    if not key:
        raise ValueError("Missing SUPABASE_SERVICE_ROLE_KEY")

    return create_client(url, key)