from backboard_client import get_client

async def upload_document(file_path, user_id):
    client = get_client()

    with open(file_path, "rb") as f:
        await client.documents.upload(
            user_id=user_id,
            file=f
        )