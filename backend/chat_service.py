from backboard_client import get_client
from user_profile_service import load_user_profile, generate_user_context

async def create_thread(assistant_id):
    client = get_client()
    thread = await client.create_thread(assistant_id)
    return thread


async def ask_question(thread_id, user_id, message):

    client = get_client()

    profile = load_user_profile(user_id)
    context = generate_user_context(profile)

    prompt = f"""
{context}

User question:
{message}
"""

    response = await client.add_message(
        thread_id=thread_id,
        content=prompt,
        memory="Auto",
        stream=False
    )

    return response.content 