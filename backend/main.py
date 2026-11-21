"""
Smart Notes AI - FastAPI Application
Main entry point for PDF processing, TF-IDF retrieval, and Gemini-powered study assistance.
"""

import os
import uuid
import time
import logging
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Explicitly load .env from backend folder
backend_env = Path(__file__).resolve().parent / ".env"
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from pdf_processor import extract_pdf_pages, chunk_document, PDFProcessingError
from retrieval import TfidfRetriever
from gemini_service import GeminiService, GeminiServiceError

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("smart_notes_ai")

# Initialize FastAPI application
app = FastAPI(
    title="Smart Notes AI API",
    description="Academic PDF question-answering and study assistant powered by TF-IDF and Google Gemini",
    version="1.0.0"
)

# CORS configuration - Allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory document storage for the current application session
documents_db: Dict[str, Dict[str, Any]] = {}

# Initialize Gemini AI Service
gemini_service = GeminiService()


# ==========================================
# Pydantic Schemas for Request & Response
# ==========================================

class ChatRequest(BaseModel):
    document_id: str = Field(..., description="The ID of the uploaded document to query")
    question: str = Field(..., min_length=2, max_length=1000, description="The student's study question")
    conversation_history: Optional[List[Dict[str, str]]] = Field(
        default=None,
        description="Optional prior chat messages for context"
    )

class SourceItem(BaseModel):
    chunk_id: int
    page_number: int
    similarity_score: float
    text: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceItem]
    document_id: str
    document_name: str
    model: str
    processing_time_ms: float

class SummarizeRequest(BaseModel):
    document_id: str = Field(..., description="The ID of the uploaded document to summarize")

class ExplainConceptRequest(BaseModel):
    document_id: str = Field(..., description="The ID of the uploaded document")
    concept: str = Field(..., min_length=2, max_length=200, description="Concept or term to explain")

class GenerateQuestionsRequest(BaseModel):
    document_id: str = Field(..., description="The ID of the uploaded document")
    count: int = Field(default=5, ge=1, le=10, description="Number of questions to generate")

class GenerateMCQsRequest(BaseModel):
    document_id: str = Field(..., description="The ID of the uploaded document")
    count: int = Field(default=4, ge=2, le=8, description="Number of MCQs to generate")

class DocumentMetadata(BaseModel):
    document_id: str
    filename: str
    file_size_bytes: int
    file_size_formatted: str
    total_pages: int
    total_chunks: int
    uploaded_at: str


# ==========================================
# Helper Utilities
# ==========================================

def format_file_size(size_bytes: int) -> str:
    """Formats bytes into human-readable KB/MB."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"


def get_document_or_404(document_id: str) -> Dict[str, Any]:
    """Retrieves document from in-memory session or raises 404."""
    if document_id not in documents_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' was not found in the current session. Please upload your PDF again."
        )
    return documents_db[document_id]


# ==========================================
# API Endpoints
# ==========================================

@app.get("/api/health")
async def health_check():
    """
    Health check endpoint returning system status, Gemini configuration, and active documents.
    """
    return {
        "status": "healthy",
        "app_name": "Smart Notes AI",
        "version": "1.0.0",
        "gemini_configured": gemini_service.is_key_configured(),
        "gemini_model": gemini_service.model_name,
        "active_documents_count": len(documents_db),
        "server_time": datetime.utcnow().isoformat()
    }


@app.post("/api/load-sample", response_model=DocumentMetadata)
async def load_sample_notes():
    """
    Demonstration and viva convenience endpoint:
    Loads the pre-packaged 'AI_Deep_Learning_Notes.pdf' without requiring manual file picker.
    """
    sample_path = os.path.join(os.path.dirname(__file__), "..", "sample_study_notes.pdf")
    if not os.path.exists(sample_path):
        from create_sample_pdf import generate_sample_pdf
        generate_sample_pdf(sample_path)

    with open(sample_path, "rb") as f:
        content = f.read()

    filename = "AI_Deep_Learning_Notes.pdf"
    file_size = len(content)
    pages_data = extract_pdf_pages(content, filename=filename)
    chunks = chunk_document(pages_data, chunk_size=700, chunk_overlap=150)

    retriever = TfidfRetriever()
    retriever.fit(chunks)

    doc_id = str(uuid.uuid4())
    uploaded_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    documents_db[doc_id] = {
        "document_id": doc_id,
        "filename": filename,
        "file_size_bytes": file_size,
        "file_size_formatted": format_file_size(file_size),
        "total_pages": len(pages_data),
        "total_chunks": len(chunks),
        "uploaded_at": uploaded_at,
        "pages_data": pages_data,
        "chunks": chunks,
        "retriever": retriever
    }

    logger.info(f"Loaded sample demo document '{filename}' (ID: {doc_id})")

    return DocumentMetadata(
        document_id=doc_id,
        filename=filename,
        file_size_bytes=file_size,
        file_size_formatted=format_file_size(file_size),
        total_pages=len(pages_data),
        total_chunks=len(chunks),
        uploaded_at=uploaded_at
    )


@app.post("/api/upload", response_model=DocumentMetadata)
async def upload_pdf(file: UploadFile = File(...)):
    """
    Accepts PDF upload, validates format and size, extracts text page-by-page with PyMuPDF,
    chunks text, builds TF-IDF index, and registers document into active session.
    """
    filename = file.filename or "uploaded_document.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Smart Notes AI only accepts PDF documents (.pdf)."
        )

    MAX_FILE_SIZE = 50 * 1024 * 1024
    content = await file.read()
    file_size = len(content)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded PDF file is empty (0 bytes). Please select a valid document."
        )

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of 50 MB (uploaded file: {format_file_size(file_size)})."
        )

    try:
        pages_data = extract_pdf_pages(content, filename=filename)
    except PDFProcessingError as e:
        logger.warning(f"PDF processing failed for '{filename}': {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error extracting '{filename}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while extracting PDF contents: {str(e)}"
        )

    try:
        chunks = chunk_document(pages_data, chunk_size=700, chunk_overlap=150)
        if not chunks:
            raise PDFProcessingError("Failed to generate text chunks from the document.")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not chunk document text: {str(e)}"
        )

    try:
        retriever = TfidfRetriever()
        retriever.fit(chunks)
    except Exception as e:
        logger.error(f"TF-IDF fitting error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to build search index for document: {str(e)}"
        )

    doc_id = str(uuid.uuid4())
    uploaded_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    documents_db[doc_id] = {
        "document_id": doc_id,
        "filename": filename,
        "file_size_bytes": file_size,
        "file_size_formatted": format_file_size(file_size),
        "total_pages": len(pages_data),
        "total_chunks": len(chunks),
        "uploaded_at": uploaded_at,
        "pages_data": pages_data,
        "chunks": chunks,
        "retriever": retriever
    }

    logger.info(
        f"Successfully processed '{filename}' (ID: {doc_id}): "
        f"{len(pages_data)} pages, {len(chunks)} chunks, size {format_file_size(file_size)}"
    )

    return DocumentMetadata(
        document_id=doc_id,
        filename=filename,
        file_size_bytes=file_size,
        file_size_formatted=format_file_size(file_size),
        total_pages=len(pages_data),
        total_chunks=len(chunks),
        uploaded_at=uploaded_at
    )


@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_document(req: ChatRequest):
    """
    Core Question-Answering Endpoint with Non-blocking Thread Execution & 25s Timeout:
    1. Fast O(K) TF-IDF retrieval for relevant chunks.
    2. Packages retrieved excerpts as grounded context.
    3. Calls Gemini API in a separate worker thread to prevent event-loop freezing.
    4. Enforces strict timeouts and returns answer with source citations.
    """
    start_time = time.time()
    doc = get_document_or_404(req.document_id)
    retriever: TfidfRetriever = doc["retriever"]

    # 1. Retrieve relevant chunks
    try:
        relevant_chunks = retriever.retrieve(req.question, top_k=3, threshold=0.03)
    except Exception as e:
        logger.error(f"Retrieval error: {e}")
        relevant_chunks = retriever.get_summary_chunks(max_chunks=3)

    if not relevant_chunks:
        relevant_chunks = retriever.get_summary_chunks(max_chunks=3)

    # 2. Call Gemini in a background thread to prevent blocking FastAPI's event loop
    try:
        answer = await asyncio.wait_for(
            asyncio.to_thread(
                gemini_service.answer_question,
                question=req.question,
                context_chunks=relevant_chunks,
                conversation_history=req.conversation_history
            ),
            timeout=25.0
        )
    except asyncio.TimeoutError:
        logger.error("Gemini API call timed out after 25 seconds.")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Gemini request timed out after 25 seconds. Please try asking again."
        )
    except GeminiServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate answer: {str(e)}"
        )

    # 3. Format sources
    sources = [
        SourceItem(
            chunk_id=c.get("chunk_id", 0),
            page_number=c.get("page_number", 1),
            similarity_score=float(c.get("similarity_score", 0.50)),
            text=c.get("text", "")
        )
        for c in relevant_chunks
    ]

    duration_ms = round((time.time() - start_time) * 1000, 2)

    return ChatResponse(
        answer=answer,
        sources=sources,
        document_id=doc["document_id"],
        document_name=doc["filename"],
        model=gemini_service.model_name,
        processing_time_ms=duration_ms
    )


@app.post("/api/summarize")
async def summarize_document(req: SummarizeRequest):
    """
    Generates a structured academic summary of the uploaded document with 25s timeout.
    """
    doc = get_document_or_404(req.document_id)
    retriever: TfidfRetriever = doc["retriever"]

    summary_chunks = retriever.get_summary_chunks(max_chunks=5)

    try:
        summary_text = await asyncio.wait_for(
            asyncio.to_thread(
                gemini_service.summarize_document,
                chunks=summary_chunks,
                filename=doc["filename"]
            ),
            timeout=25.0
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Summary request timed out after 25 seconds.")
    except GeminiServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    sources = [
        {
            "chunk_id": c.get("chunk_id", 0),
            "page_number": c.get("page_number", 1),
            "text": c.get("text", "")[:200] + "..."
        }
        for c in summary_chunks
    ]

    return {
        "summary": summary_text,
        "document_id": doc["document_id"],
        "document_name": doc["filename"],
        "sources": sources
    }


@app.post("/api/explain-concept")
async def explain_concept(req: ExplainConceptRequest):
    """
    Explains a specific concept or term from the document with analogies and page citations.
    """
    doc = get_document_or_404(req.document_id)
    retriever: TfidfRetriever = doc["retriever"]

    concept_chunks = retriever.retrieve(req.concept, top_k=3, threshold=0.02)
    if not concept_chunks:
        concept_chunks = retriever.get_summary_chunks(max_chunks=3)

    try:
        explanation = await asyncio.wait_for(
            asyncio.to_thread(
                gemini_service.explain_concept,
                concept=req.concept,
                chunks=concept_chunks
            ),
            timeout=25.0
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Explanation request timed out after 25 seconds.")
    except GeminiServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    sources = [
        {
            "chunk_id": c.get("chunk_id", 0),
            "page_number": c.get("page_number", 1),
            "similarity_score": float(c.get("similarity_score", 0.50)),
            "text": c.get("text", "")
        }
        for c in concept_chunks
    ]

    return {
        "explanation": explanation,
        "concept": req.concept,
        "document_id": doc["document_id"],
        "sources": sources
    }


@app.post("/api/generate-questions")
async def generate_questions(req: GenerateQuestionsRequest):
    """
    Generates high-yield exam study questions based on the document.
    """
    doc = get_document_or_404(req.document_id)
    retriever: TfidfRetriever = doc["retriever"]

    sample_chunks = retriever.get_summary_chunks(max_chunks=5)

    try:
        questions_content = await asyncio.wait_for(
            asyncio.to_thread(
                gemini_service.generate_important_questions,
                chunks=sample_chunks,
                count=req.count
            ),
            timeout=25.0
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Questions request timed out after 25 seconds.")
    except GeminiServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "questions": questions_content,
        "document_id": doc["document_id"],
        "document_name": doc["filename"],
        "count": req.count
    }


@app.post("/api/generate-mcqs")
async def generate_mcqs(req: GenerateMCQsRequest):
    """
    Generates multiple-choice quiz questions with options, correct answer, and explanation.
    """
    doc = get_document_or_404(req.document_id)
    retriever: TfidfRetriever = doc["retriever"]

    sample_chunks = retriever.get_summary_chunks(max_chunks=5)

    try:
        mcqs = await asyncio.wait_for(
            asyncio.to_thread(
                gemini_service.generate_mcqs,
                chunks=sample_chunks,
                count=req.count
            ),
            timeout=25.0
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="MCQs request timed out after 25 seconds.")
    except GeminiServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "mcqs": mcqs,
        "document_id": doc["document_id"],
        "document_name": doc["filename"],
        "count": len(mcqs)
    }


@app.get("/api/documents")
async def list_documents():
    """
    Returns list of all active documents in current session.
    """
    doc_list = []
    for d in documents_db.values():
        doc_list.append({
            "document_id": d["document_id"],
            "filename": d["filename"],
            "file_size_formatted": d["file_size_formatted"],
            "total_pages": d["total_pages"],
            "total_chunks": d["total_chunks"],
            "uploaded_at": d["uploaded_at"]
        })
    return {"documents": doc_list}


@app.get("/api/document/{document_id}")
async def get_document_details(document_id: str):
    """
    Returns metadata and page breakdown for a specific document.
    """
    doc = get_document_or_404(document_id)
    return {
        "document_id": doc["document_id"],
        "filename": doc["filename"],
        "file_size_formatted": doc["file_size_formatted"],
        "total_pages": doc["total_pages"],
        "total_chunks": doc["total_chunks"],
        "uploaded_at": doc["uploaded_at"],
        "pages": [
            {
                "page_number": p["page_number"],
                "char_count": p["char_count"],
                "word_count": p["word_count"]
            }
            for p in doc["pages_data"]
        ]
    }


@app.delete("/api/document/{document_id}")
async def delete_document(document_id: str):
    """
    Removes document and its search index from memory.
    """
    doc = get_document_or_404(document_id)
    filename = doc["filename"]
    del documents_db[document_id]
    logger.info(f"Removed document '{filename}' ({document_id}) from session.")
    return {"message": f"Document '{filename}' was removed from session.", "document_id": document_id}


# Mount built React frontend if available (allows single-command full-stack execution)
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def serve_index():
        index_path = os.path.join(frontend_dist, "index.html")
        return FileResponse(index_path)


if __name__ == "__main__":
    import uvicorn
    # On Render/Cloud containers, bind to 0.0.0.0 and use Render's PORT
    is_cloud = bool(os.getenv("RENDER") or os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("PORT"))
    default_host = "0.0.0.0" if is_cloud else "127.0.0.1"
    default_port = 10000 if os.getenv("RENDER") else 8000

    host = os.getenv("HOST", default_host)
    port = int(os.getenv("PORT", str(default_port)))
    logger.info(f"Starting Smart Notes AI server at http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=False)
