from pathlib import Path
from backboard_client import get_client

def load_system_prompt():
    prompt_path = Path(__file__).parent / "prompts" / "system_prompt.txt"
    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read()

async def create_assistant():
    client = get_client()
    prompt = load_system_prompt()

    assistant = await client.create_assistant(
        name="Yuth Assistant",
        system_prompt=prompt, 
        model="gpt-5-mini"
    )
    return assistant 