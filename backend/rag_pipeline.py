from document_parser import extract_text
from text_chunker import chunk_text
from embedding_service import embed_text, embed_chunks
from vector_store import (
    create_document_record,
    insert_document_chunks,
    update_document_status,
    match_document_chunks,
)

import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

llm_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def ingest_document(
    user_id: str,
    file_path: str,
    file_name: str,
    original_name: str,
    file_type: str,
    file_size: int,
    folder_name: str | None = None,
) -> dict:
    """
    Full ingestion pipeline:
    file -> text -> chunks -> embeddings -> vector DB
    """

    document = create_document_record(
        user_id=user_id,
        file_name=file_name,
        original_name=original_name,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        folder_name=folder_name,
        status="processing",
    )

    document_id = document["id"]

    try:
        text = extract_text(file_path=file_path, file_type=file_type)

        if not text.strip():
            raise ValueError("No text could be extracted from this file.")

        chunks = chunk_text(text, chunk_size=800, overlap=150)

        if not chunks:
            raise ValueError("No chunks were created from this file.")

        embeddings = embed_chunks(chunks)

        insert_document_chunks(
            document_id=document_id,
            user_id=user_id,
            chunks=chunks,
            embeddings=embeddings,
            source_name=file_name,
        )

        update_document_status(document_id, "ready")

        return {
            "document_id": document_id,
            "status": "ready",
            "chunks_created": len(chunks),
        }

    except Exception as e:
        update_document_status(document_id, "failed")
        raise e


def retrieve_relevant_chunks(
    user_id: str,
    question: str,
    match_count: int = 5,
) -> list[dict]:
    """
    Query pipeline:
    question -> embedding -> similarity search
    """

    query_embedding = embed_text(question)

    matches = match_document_chunks(
        query_embedding=query_embedding,
        user_id=user_id,
        match_count=match_count,
    )

    return matches


def answer_question_with_documents(
    user_id: str,
    question: str,
    match_count: int = 5,
) -> dict:
    """
    Full RAG answer pipeline:
    question -> embed -> retrieve chunks -> LLM answer
    """

    matches = retrieve_relevant_chunks(
        user_id=user_id,
        question=question,
        match_count=match_count,
    )

    if not matches:
        return {
            "answer": "No relevant information was found in the uploaded documents.",
            "sources": [],
        }

    context_blocks = []

    for match in matches:
        source_name = match.get("metadata", {}).get("source_name", "Unknown document")
        chunk_text = match.get("chunk_text", "")
        context_blocks.append(f"Source: {source_name}\n{chunk_text}")

    context = "\n\n---\n\n".join(context_blocks)

    prompt = f"""
You are Yuth, a helpful financial AI assistant.

Answer the user's question using ONLY the document context below.
If the answer is not clearly supported by the context, say you cannot confirm it from the uploaded documents.

DOCUMENT CONTEXT:
{context}

QUESTION:
{question}
"""

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You answer questions using retrieved user document excerpts only.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )

    answer = response.choices[0].message.content

    return {
        "answer": answer,
        "sources": matches,
    }