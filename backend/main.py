import asyncio
from assistant_service import create_assistant
from chat_service import create_thread, ask_question

async def main():

    assistant = await create_assistant()
    print("Assistant created:", assistant.assistant_id)

    thread = await create_thread(assistant.assistant_id)
    print("Thread created:", thread.thread_id)

    response = await ask_question(
        thread.thread_id,
        user_id="user123",
        message="Can I afford to buy a $120 jacket?"
    )

    print("Assistant:", response)

asyncio.run(main())