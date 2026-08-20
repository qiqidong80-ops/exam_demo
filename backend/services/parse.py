import pdfplumber
from docx import Document


def parse_file(file_path: str) -> str:
    """解析 PDF 或 Word 文件，返回纯文本"""
    if file_path.endswith('.pdf'):
        text_parts = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text_parts.append(t)
        return '\n'.join(text_parts)
    elif file_path.endswith(('.docx', '.doc')):
        doc = Document(file_path)
        return '\n'.join(p.text for p in doc.paragraphs if p.text.strip())
    else:
        raise ValueError(f"不支持的文件格式: {file_path}")
