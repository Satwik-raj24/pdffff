"""
Smart Notes AI - Gemini AI Service Integration
Uses the official Google Gen AI SDK (google-genai) to generate factual, grounded,
page-referenced answers from uploaded PDF content.
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
from dotenv import load_dotenv

# Explicitly load .env from the backend directory, then fallback to current working directory
backend_env = Path(__file__).resolve().parent / ".env"
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
load_dotenv()

logger = logging.getLogger("smart_notes_ai.gemini")

SYSTEM_INSTRUCTION = """You are Smart Notes AI, an academic study assistant.

Your primary responsibility is to answer student questions using the supplied PDF excerpts.
Treat the supplied excerpts as the source of truth.
Answer questions clearly, accurately, and in student-friendly language.
Do not invent information that is not supported by the supplied document.
If the answer cannot be found in the supplied excerpts, clearly tell the student that the uploaded document does not provide sufficient information.
When possible, explain difficult concepts in simple language.
Use structured formatting when appropriate (bullet points, clear paragraphs, code blocks if technical).
Always include the relevant original PDF page references (e.g., "[Page X]").
Never fabricate page numbers, quotations, or citations.
If a student asks something unrelated to the document, explain that you are designed primarily to help with the uploaded study material."""

# Reliable candidate models in order of priority
FALLBACK_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash"
]


class GeminiServiceError(Exception):
    """Custom exception for Gemini API related failures."""
    def __init__(self, message: str, status_code: int = 500, error_type: str = "api_error"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_type = error_type


class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()
        self.client = None

        if self.is_key_configured():
            try:
                from google import genai
                from google.genai import types
                # Set client with 25-second timeout
                http_options = types.HttpOptions(timeout=25000)
                self.client = genai.Client(api_key=self.api_key, http_options=http_options)
            except Exception as e:
                logger.error(f"Failed to initialize Google GenAI client: {e}")

    def is_key_configured(self) -> bool:
        """Returns True if a real-looking API key is configured."""
        return bool(self.api_key and not self.api_key.startswith("your_gemini_api_key"))

    def _ensure_client(self):
        """Validates that Gemini API key is configured before issuing requests."""
        if not self.is_key_configured():
            raise GeminiServiceError(
                message=(
                    "Gemini API key is not configured. Please add your GEMINI_API_KEY to "
                    "backend/.env file (e.g. GEMINI_API_KEY=AIzaSy...). Get a free key at https://aistudio.google.com"
                ),
                status_code=401,
                error_type="missing_api_key"
            )

        if not self.client:
            from google import genai
            from google.genai import types
            try:
                http_options = types.HttpOptions(timeout=25000)
                self.client = genai.Client(api_key=self.api_key, http_options=http_options)
            except Exception as e:
                raise GeminiServiceError(
                    message=f"Could not connect to Gemini API: {str(e)}",
                    status_code=500,
                    error_type="client_init_error"
                )

    def _format_context(self, chunks: List[Dict[str, Any]]) -> str:
        """Formats retrieved chunks into clean, cited context for the model."""
        if not chunks:
            return "No specific document excerpts available."

        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            page_num = chunk.get("page_number", "Unknown")
            score = chunk.get("similarity_score", 0.0)
            text = chunk.get("text", "").strip()
            context_parts.append(f"--- [EXCERPT {i} | Page {page_num} | Relevance: {score}] ---\n{text}")

        return "\n\n".join(context_parts)

    def _generate_with_fallback(self, prompt: str, config) -> str:
        """
        Executes generate_content with automatic fallback to secondary models
        if the primary model is busy (503) or not found (404).
        """
        self._ensure_client()

        models_to_try = [self.model_name]
        for m in FALLBACK_MODELS:
            if m not in models_to_try:
                models_to_try.append(m)

        last_error = None
        for model in models_to_try:
            try:
                logger.info(f"Generating content with Gemini model: {model}")
                response = self.client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config
                )
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                err_msg = str(e)
                last_error = e
                logger.warning(f"Model {model} failed: {err_msg[:120]}. Trying next fallback...")
                # If invalid key, no point in trying other models
                if "INVALID_ARGUMENT" in err_msg or "API_KEY_INVALID" in err_msg or "401" in err_msg:
                    raise GeminiServiceError(
                        message="The provided Gemini API key is invalid. Please verify your GEMINI_API_KEY in backend/.env.",
                        status_code=401,
                        error_type="invalid_api_key"
                    )
                continue

        # If all candidate models failed
        err_msg = str(last_error) if last_error else "Unknown error"
        if "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg or "quota" in err_msg.lower():
            raise GeminiServiceError(
                message="Gemini API rate limit or quota exceeded. Please wait a moment and try again.",
                status_code=429,
                error_type="quota_exceeded"
            )
        elif "DEADLINE_EXCEEDED" in err_msg or "timeout" in err_msg.lower():
            raise GeminiServiceError(
                message="Gemini API request timed out after 25 seconds. Please try asking again.",
                status_code=504,
                error_type="timeout"
            )
        else:
            raise GeminiServiceError(
                message=f"Gemini API request failed: {err_msg}",
                status_code=500,
                error_type="api_error"
            )

    def answer_question(
        self,
        question: str,
        context_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Answers a user question based strictly on retrieved PDF chunks.
        """
        self._ensure_client()
        from google.genai import types

        context_str = self._format_context(context_chunks)

        # Build clean, grounded prompt
        user_prompt = f"""DOCUMENT EXCERPTS FROM UPLOADED NOTES:
=======================================
{context_str}
=======================================

STUDENT'S QUESTION:
{question}

Provide a well-structured, easy-to-understand answer based on the excerpts above.
Always cite the relevant page numbers (e.g. [Page X]) in your response where specific facts are used."""

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.2,
            max_output_tokens=1500
        )

        return self._generate_with_fallback(user_prompt, config)

    def summarize_document(self, chunks: List[Dict[str, Any]], filename: str) -> str:
        """Generates an academic summary of the document."""
        self._ensure_client()
        from google.genai import types

        context_str = self._format_context(chunks)
        prompt = f"""Please provide a comprehensive yet concise academic study summary for the document '{filename}'.

Based on these representative excerpts from the document:
{context_str}

Format the summary with the following clear markdown sections:
### 1. Document Overview
A 2-3 sentence overview of the core subject matter.

### 2. Key Academic Themes
Bullet points summarizing the major themes and theories presented, with page references where mentioned.

### 3. Core Terminology & Concepts
Definitions of the most critical terms found in the notes.

### 4. Key Takeaways for Revision
Quick bullet points of essential exam facts or conclusions."""

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.2,
            max_output_tokens=1800
        )
        return self._generate_with_fallback(prompt, config)

    def explain_concept(self, concept: str, chunks: List[Dict[str, Any]]) -> str:
        """Explains a specific concept in student-friendly language using document excerpts."""
        self._ensure_client()
        from google.genai import types

        context_str = self._format_context(chunks)
        prompt = f"""The student requested a clear explanation of the concept: **"{concept}"** based on their notes.

RELEVANT EXCERPTS FROM NOTES:
{context_str}

Please explain "{concept}" using:
1. **Simple Definition**: Clear, intuitive definition in plain language.
2. **Everyday Analogy**: A relatable analogy that makes the concept easy to visualize and memorize for exams.
3. **Key Points from Notes**: Specific facts, formulas, or details directly mentioned in the document (with page citations).
4. **Common Exam Traps / Pitfalls**: What students frequently misunderstand about this concept."""

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.3,
            max_output_tokens=1500
        )
        return self._generate_with_fallback(prompt, config)

    def generate_important_questions(self, chunks: List[Dict[str, Any]], count: int = 5) -> str:
        """Generates exam-oriented revision questions with hints."""
        self._ensure_client()
        from google.genai import types

        context_str = self._format_context(chunks)
        prompt = f"""Generate {count} high-yield, exam-oriented study questions based on these document excerpts:
{context_str}

For each question:
- State the Question clearly.
- Specify the Question Type (e.g., Conceptual, Analytical, Definition).
- Provide a concise Study Hint / Key Points to Answer, citing the document page number."""

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.3,
            max_output_tokens=1500
        )
        return self._generate_with_fallback(prompt, config)

    def generate_mcqs(self, chunks: List[Dict[str, Any]], count: int = 4) -> List[Dict[str, Any]]:
        """Generates multiple-choice quiz questions formatted as JSON."""
        self._ensure_client()
        from google.genai import types

        context_str = self._format_context(chunks)
        prompt = f"""Generate {count} multiple-choice study questions (MCQs) based strictly on these document excerpts:
{context_str}

You must return a valid JSON array of objects without markdown formatting or code fences.
Each object must have the following exact keys:
- "id": integer (1 to {count})
- "question": string
- "options": array of exactly 4 strings (e.g. ["A) ...", "B) ...", "C) ...", "D) ..."])
- "correct_answer": string (e.g. "A" or "B" or "C" or "D")
- "explanation": string explaining why the answer is correct with page citation
- "page_number": integer representing the primary reference page

Return JSON only."""

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.2,
            max_output_tokens=1800,
            response_mime_type="application/json"
        )

        raw_text = self._generate_with_fallback(prompt, config)
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()

        parsed = json.loads(raw_text)
        if isinstance(parsed, list):
            return parsed
        elif isinstance(parsed, dict) and "questions" in parsed:
            return parsed["questions"]
        return []
