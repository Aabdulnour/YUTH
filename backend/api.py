from pathlib import Path
import mimetypes
import os
import shutil

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from openai import OpenAI
from pydantic import BaseModel

from assistant_service import create_assistant
from chat_service import create_thread, ask_question
from rag_pipeline import ingest_document, answer_question_with_documents
from thread_service import get_saved_thread, save_thread
from vector_store import delete_document, get_document, list_documents

load_dotenv()
llm_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_ROOT = Path(__file__).resolve().parent / "data" / "uploads"
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)


class SetupRequest(BaseModel):
    user_id: str


class ChatRequest(BaseModel):
    user_id: str
    message: str


class AskAIRequest(BaseModel):
    user_id: str
    question: str
    match_count: int = 5


class HybridAskRequest(BaseModel):
    user_id: str
    question: str
    match_count: int = 5


class DeleteDocumentRequest(BaseModel):
    user_id: str
    document_id: str


@app.get("/")
async def root():
    return {"message": "Yuth backend is running"}


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


@app.post("/documents/upload")
async def upload_document(
    user_id: str = Form(...),
    folder_name: str = Form(None),
    display_name: str = Form(None),
    file: UploadFile = File(...),
):
    try:
        original_name = file.filename or "uploaded_file"
        extension = Path(original_name).suffix.lower().lstrip(".")

        allowed_types = {"pdf", "docx", "txt"}
        if extension not in allowed_types:
            return {"error": f"Unsupported file type: .{extension}"}

        safe_base_name = (display_name or Path(original_name).stem).strip()
        if not safe_base_name:
            safe_base_name = Path(original_name).stem

        final_file_name = f"{safe_base_name}.{extension}"

        user_upload_dir = UPLOAD_ROOT / user_id
        user_upload_dir.mkdir(parents=True, exist_ok=True)

        save_path = user_upload_dir / final_file_name

        with save_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = save_path.stat().st_size

        result = ingest_document(
            user_id=user_id,
            file_path=str(save_path),
            file_name=final_file_name,
            original_name=original_name,
            file_type=extension,
            file_size=file_size,
            folder_name=folder_name,
        )

        return {
            "message": "Document uploaded and processed successfully",
            "document_id": result["document_id"],
            "status": result["status"],
            "chunks_created": result["chunks_created"],
            "file_name": final_file_name,
            "original_name": original_name,
            "file_size": file_size,
            "folder_name": folder_name,
        }

    except Exception as e:
        return {"error": str(e)}


@app.get("/documents")
async def get_documents_endpoint(user_id: str):
    try:
        if not user_id.strip():
            return {"error": "user_id is required"}

        documents = list_documents(user_id.strip())
        return {"documents": documents}

    except Exception as e:
        return {"error": str(e)}


@app.get("/documents/file")
async def get_document_file(user_id: str, document_id: str):
    try:
        document = get_document(document_id=document_id, user_id=user_id)
        if not document:
            return {"error": "Document not found"}

        file_path = document.get("file_path")
        if not file_path or not Path(file_path).exists():
            return {"error": "Stored file not found on disk"}

        media_type, _ = mimetypes.guess_type(file_path)
        return FileResponse(
            path=file_path,
            media_type=media_type or "application/octet-stream",
            filename=document.get("original_name") or document.get("file_name") or "document"
        )

    except Exception as e:
        return {"error": str(e)}


@app.post("/documents/delete")
async def remove_document(request: DeleteDocumentRequest):
    try:
        user_id = request.user_id.strip()
        document_id = request.document_id.strip()

        if not user_id:
            return {"error": "user_id is required"}

        if not document_id:
            return {"error": "document_id is required"}

        document = get_document(document_id=document_id, user_id=user_id)
        if not document:
            return {"error": "Document not found"}

        file_path = document.get("file_path")
        if file_path and Path(file_path).exists():
            Path(file_path).unlink(missing_ok=True)

        delete_document(document_id=document_id, user_id=user_id)

        return {"message": "Document deleted successfully"}

    except Exception as e:
        return {"error": str(e)}


@app.post("/ask-ai")
async def ask_ai(request: AskAIRequest):
    try:
        user_id = request.user_id.strip()
        question = request.question.strip()

        if not user_id:
            return {"error": "user_id is required"}

        if not question:
            return {"error": "question is required"}

        result = answer_question_with_documents(
            user_id=user_id,
            question=question,
            match_count=request.match_count,
        )

        return result

    except Exception as e:
        return {"error": str(e)}


@app.post("/ask-ai-hybrid")
async def ask_ai_hybrid(request: HybridAskRequest):
    try:
        user_id = request.user_id.strip()
        question = request.question.strip()

        if not user_id:
            return {"error": "user_id is required"}

        if not question:
            return {"error": "question is required"}

        existing = get_saved_thread(user_id)
        if not existing:
            assistant = await create_assistant()
            thread = await create_thread(assistant.assistant_id)

            save_thread(
                user_id=str(user_id),
                assistant_id=str(assistant.assistant_id),
                thread_id=str(thread.thread_id)
            )

            thread_id = str(thread.thread_id)
        else:
            thread_id = str(existing["thread_id"])

        doc_result = answer_question_with_documents(
            user_id=user_id,
            question=question,
            match_count=request.match_count,
        )

        memory_answer = await ask_question(
            thread_id=thread_id,
            user_id=user_id,
            message=question
        )

        doc_answer = doc_result.get("answer", "No document answer available.")
        sources = doc_result.get("sources", [])

        source_lines = []
        for source in sources:
            source_name = source.get("metadata", {}).get("source_name", "Unknown document")
            chunk_text = source.get("chunk_text", "")
            source_lines.append(f"Source: {source_name}\n{chunk_text}")

        source_context = "\n\n---\n\n".join(source_lines) if source_lines else "No document excerpts found."

        fusion_prompt = f"""
You are Yuth, a helpful Canadian financial AI assistant.

Create one final answer by combining:
1. the user's saved profile and memory-based assistant answer
2. the uploaded document evidence

Rules:
- Prefer uploaded documents when making claims about specific user documents
- Use profile and memory context for personalization
- If document evidence is missing or unclear, say so clearly
- Be practical, direct, and concise

USER QUESTION:
{question}

MEMORY / PROFILE-BASED ANSWER:
{memory_answer}

DOCUMENT-BASED ANSWER:
{doc_answer}

DOCUMENT EXCERPTS:
{source_context}
"""

        fusion_response = llm_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You combine profile context, memory context, and uploaded document evidence into one final answer.",
                },
                {
                    "role": "user",
                    "content": fusion_prompt,
                },
            ],
        )

        final_answer = fusion_response.choices[0].message.content

        return {
            "answer": final_answer,
            "sources": sources,
            "meta_label": "Based on your uploaded documents, saved profile, and conversation",
        }

    except Exception as e:
        return {"error": str(e)}