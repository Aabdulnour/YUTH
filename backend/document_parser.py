from pypdf import PdfReader
import docx

def parse_pdf(file_path: str) -> str:
    text_parts = []

    reader = PdfReader(file_path)

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)

    return "\n".join(text_parts).strip()


def parse_docx(file_path: str) -> str:
    doc = docx.Document(file_path)
    text_parts = [paragraph.text for paragraph in doc.paragraphs if paragraph.text.strip()]
    return "\n".join(text_parts).strip()


def parse_txt(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read().strip()


def extract_text(file_path: str, file_type: str) -> str:
    file_type = file_type.lower().strip().lstrip(".")

    if file_type == "pdf":
        return parse_pdf(file_path)

    if file_type == "docx":
        return parse_docx(file_path)

    if file_type == "txt":
        return parse_txt(file_path)

    raise ValueError(f"Unsupported file type: {file_type}")