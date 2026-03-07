from fastapi import FastAPI
from pydantic import BaseModel

from assistant_service import create_assistant
from chat_service import create_thread, ask_question
from thread_service import get_saved_thread, save_thread

app = FastAPI()


class SetupRequest(BaseModel):
    user_id: str


class ChatRequest(BaseModel):
    user_id: str
    message: str


@app.get("/")
async def root():
    return {"message": "MapleMind backend is running"}


@app.post("/setup")
async def setup(request: SetupRequest):
    try:
        user_id = request.user_id

        existing = get_saved_thread(user_id)
        if existing:
            return {
                "message": "User already initialized",
                "assistant_id": str(existing["assistant_id"]),
                "thread_id": str(existing["thread_id"])
            }

        assistant = await create_assistant()
        thread = await create_thread(assistant.assistant_id)

        save_thread(
            user_id=str(user_id),
            assistant_id=str(assistant.assistant_id),
            thread_id=str(thread.thread_id)
        )

        return {
            "message": "User setup complete",
            "assistant_id": str(assistant.assistant_id),
            "thread_id": str(thread.thread_id)
        }

    except Exception as e:
        return {"error": str(e)}


@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        user_id = request.user_id
        message = request.message

        existing = get_saved_thread(user_id)
        if not existing:
            return {"error": "User not initialized. Call /setup first."}

        response = await ask_question(
            thread_id=str(existing["thread_id"]),
            user_id=str(user_id),
            message=message
        )

        return {"response": str(response)}

    except Exception as e:
        return {"error": str(e)}