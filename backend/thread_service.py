from supabase_client import get_supabase_client

def get_saved_thread(user_id: str):
    supabase = get_supabase_client()

    response = (
        supabase.table("ai_threads")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    if response is None:
        raise ValueError("Supabase returned None when reading ai_threads")

    if not response.data:
        return None

    return response.data[0]


def save_thread(user_id: str, assistant_id: str, thread_id: str):
    supabase = get_supabase_client()

    response = (
        supabase.table("ai_threads")
        .upsert({
            "user_id": str(user_id),
            "assistant_id": str(assistant_id),
            "thread_id": str(thread_id)
        })
        .execute()
    )

    if response is None:
        raise ValueError("Supabase returned None when saving ai_threads")

    return response.data