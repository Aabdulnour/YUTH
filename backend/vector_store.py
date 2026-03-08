from typing import Any

from supabase_client import get_supabase_client

supabase = get_supabase_client()


def create_document_record(
    user_id: str,
    file_name: str,
    original_name: str,
    file_path: str,
    file_type: str,
    file_size: int,
    folder_name: str | None = None,
    status: str = "processing",
) -> dict[str, Any]:
    payload = {
        "user_id": user_id,
        "file_name": file_name,
        "original_name": original_name,
        "file_path": file_path,
        "folder_name": folder_name,
        "file_type": file_type,
        "file_size": file_size,
        "status": status,
    }

    response = supabase.table("documents").insert(payload).execute()
    return response.data[0]


def update_document_status(document_id: str, status: str) -> dict[str, Any]:
    response = (
        supabase.table("documents")
        .update({"status": status})
        .eq("id", document_id)
        .execute()
    )
    return response.data[0]


def insert_document_chunks(
    document_id: str,
    user_id: str,
    chunks: list[str],
    embeddings: list[list[float]],
    source_name: str,
) -> list[dict[str, Any]]:
    if len(chunks) != len(embeddings):
        raise ValueError("chunks and embeddings must have the same length")

    rows = []

    for index, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
        rows.append(
            {
                "document_id": document_id,
                "user_id": user_id,
                "chunk_index": index,
                "chunk_text": chunk_text,
                "embedding": embedding,
                "metadata": {
                    "source_name": source_name,
                    "chunk_index": index,
                },
            }
        )

    response = supabase.table("document_chunks").insert(rows).execute()
    return response.data


def match_document_chunks(
    query_embedding: list[float],
    user_id: str,
    match_count: int = 5,
) -> list[dict[str, Any]]:
    response = supabase.rpc(
        "match_document_chunks",
        {
            "query_embedding": query_embedding,
            "match_user_id": user_id,
            "match_count": match_count,
        },
    ).execute()

    return response.data


def delete_document(document_id: str, user_id: str) -> None:
    (
        supabase.table("documents")
        .delete()
        .eq("id", document_id)
        .eq("user_id", user_id)
        .execute()
    )


def list_documents(user_id: str) -> list[dict[str, Any]]:
    response = (
        supabase.table("documents")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data