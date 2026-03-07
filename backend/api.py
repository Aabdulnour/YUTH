from fastapi import FastAPI
from pydantic import BaseModel

from assistant_service import create_assistant
from chat_service import create_thread, ask_question

app = FastAPI()

# Temporary in-memory storage. Later we will need to store this in a database.
assistant_store = {}
thread_store = {}


class ChatRequest(BaseModel):
    user_id: str
    message: str


@app.post("/setup")
async def setup(user_id: str):

    # Create a new assistant
    assistant = await create_assistant()

    # Create a thread for the conversation
    thread = await create_thread(assistant.assistant_id)

    # Store them for this user
    assistant_store[user_id] = assistant.assistant_id
    thread_store[user_id] = thread.thread_id

    return {
        "assistant_id": assistant.assistant_id,
        "thread_id": thread.thread_id
    }


@app.post("/chat")
async def chat(request: ChatRequest):

    thread_id = thread_store.get(request.user_id)

    if not thread_id:
        return {"error": "User not initialized. Call /setup first."}

    response = await ask_question(
        thread_id=thread_id,
        user_id=request.user_id,
        message=request.message
    )

    return {"response": response}