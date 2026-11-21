"""
Smart Notes AI - PDF Text Processing Module
Handles document loading, page-by-page text extraction, normalization, and chunking with PyMuPDF.
"""

import re
import io
from typing import List, Dict, Any, Tuple
import pymupdf


class PDFProcessingError(Exception):
    """Custom exception raised when PDF extraction or processing fails."""
    pass


def clean_and_normalize_text(text: str) -> str:
    """
    Cleans raw PDF extracted text:
    - Recombines words split across line breaks with hyphens (e.g., 'archi-\\ntecture' -> 'architecture').
    - Normalizes non-standard whitespace and multiple line breaks.
    - Preserves logical sentence flow.
    """
    if not text:
        return ""

    # Recombine hyphenated words split at the end of a line
    # Matches a word character followed by a hyphen, newline, optional whitespace, and next word character
    text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)

    # Replace multiple newlines or tabs with a single space if it's within a paragraph,
    # but keep paragraph boundaries intact where double newlines exist
    paragraphs = text.split('\n\n')
    cleaned_paragraphs = []
    for p in paragraphs:
        # Replace internal single linebreaks with space
        cleaned_p = re.sub(r'\s*\n\s*', ' ', p)
        # Normalize repeated horizontal spaces
        cleaned_p = re.sub(r'[ \t]+', ' ', cleaned_p).strip()
        if cleaned_p:
            cleaned_paragraphs.append(cleaned_p)

    return "\n\n".join(cleaned_paragraphs)


def extract_pdf_pages(file_bytes: bytes, filename: str = "document.pdf") -> List[Dict[str, Any]]:
    """
    Extracts text page by page from raw PDF bytes.
    Validates PDF integrity, checks for password protection, and verifies text availability.

    Returns:
        List of dicts: [{'page_number': 1, 'text': '...', 'char_count': 123}]
    Raises:
        PDFProcessingError with user-friendly diagnosis on failure.
    """
    if not file_bytes or len(file_bytes) == 0:
        raise PDFProcessingError("The uploaded PDF file is empty (0 bytes). Please upload a valid document.")

    try:
        doc = pymupdf.open(stream=file_bytes, filetype="pdf")
    except Exception as e:
        raise PDFProcessingError(f"Failed to read '{filename}'. The file may be corrupted or not a valid PDF format.")

    if doc.is_encrypted:
        doc.close()
        raise PDFProcessingError(f"'{filename}' is password-protected or encrypted. Please remove the password before uploading.")

    total_pages = len(doc)
    if total_pages == 0:
        doc.close()
        raise PDFProcessingError(f"'{filename}' contains no pages.")

    pages_data = []
    total_extracted_chars = 0

    for page_idx in range(total_pages):
        page_num = page_idx + 1  # 1-based indexing for academic students
        page = doc[page_idx]
        raw_text = page.get_text("text")
        cleaned_text = clean_and_normalize_text(raw_text)

        total_extracted_chars += len(cleaned_text)
        pages_data.append({
            "page_number": page_num,
            "text": cleaned_text,
            "char_count": len(cleaned_text),
            "word_count": len(cleaned_text.split()) if cleaned_text else 0
        })

    doc.close()

    # Verify if the PDF has actual extractable text
    # If the document has pages but virtually zero text, it is likely a scanned image PDF
    if total_extracted_chars < 30:
        raise PDFProcessingError(
            f"No extractable text was found in '{filename}'. This PDF appears to be a scanned image or photograph. "
            "Smart Notes AI requires selectable, text-based PDFs to analyze notes and find answers."
        )

    return pages_data


def chunk_document(
    pages_data: List[Dict[str, Any]],
    chunk_size: int = 700,
    chunk_overlap: int = 150
) -> List[Dict[str, Any]]:
    """
    Splits extracted pages into overlapping text chunks suitable for TF-IDF indexing
    and Gemini context feeding.

    Each chunk retains its original PDF page reference. If a chunk spans content,
    it records the primary page number and range.

    Args:
        pages_data: List of page objects from extract_pdf_pages
        chunk_size: Target characters per chunk (~100-140 words)
        chunk_overlap: Overlap in characters to preserve context across boundaries

    Returns:
        List of dicts:
        [{
            'chunk_id': 0,
            'page_number': 1,
            'text': '...',
            'word_count': 95,
            'start_char': 0,
            'end_char': 650
        }]
    """
    chunks: List[Dict[str, Any]] = []
    chunk_counter = 0

    for page_info in pages_data:
        page_num = page_info["page_number"]
        page_text = page_info["text"]

        if not page_text or len(page_text.strip()) == 0:
            continue

        # If the page text is shorter than or equal to chunk_size, keep as a single chunk
        if len(page_text) <= chunk_size:
            chunks.append({
                "chunk_id": chunk_counter,
                "page_number": page_num,
                "text": page_text,
                "word_count": len(page_text.split()),
                "char_count": len(page_text)
            })
            chunk_counter += 1
            continue

        # Otherwise, split by sliding window with overlap, respecting sentence boundaries where possible
        start = 0
        text_len = len(page_text)

        while start < text_len:
            end = start + chunk_size

            # If not at the very end of text, attempt to break at a sentence ending or whitespace
            if end < text_len:
                # Look for sentence boundary (.!?) within the last 80 chars of the window
                sentence_break = -1
                for punct in ['. ', '.\n', '? ', '! ', '\n\n', '; ']:
                    idx = page_text.rfind(punct, start + int(chunk_size * 0.6), end)
                    if idx != -1:
                        sentence_break = max(sentence_break, idx + len(punct))

                if sentence_break > start:
                    end = sentence_break
                else:
                    # Fallback to the last whitespace to avoid breaking mid-word
                    space_idx = page_text.rfind(' ', start + int(chunk_size * 0.6), end)
                    if space_idx != -1:
                        end = space_idx

            chunk_content = page_text[start:end].strip()
            if len(chunk_content) > 30:  # Skip tiny fragments
                chunks.append({
                    "chunk_id": chunk_counter,
                    "page_number": page_num,
                    "text": chunk_content,
                    "word_count": len(chunk_content.split()),
                    "char_count": len(chunk_content)
                })
                chunk_counter += 1

            if end >= text_len:
                break

            # Slide start forward by (chunk length - overlap)
            step = max(end - start - chunk_overlap, 100)
            start = start + step

    return chunks

