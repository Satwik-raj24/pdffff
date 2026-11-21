# Smart Notes AI — Academic PDF Study Assistant

Smart Notes AI is a full-stack, AI-powered academic study assistant designed for students and researchers. It allows students to upload lengthy course notes, textbooks, and research slides in PDF format, index their contents using statistical information retrieval (**TF-IDF and Cosine Similarity**), and interact with **Google's Gemini AI** to receive factual, strictly grounded answers with **exact original PDF page citations**.

---

## 🌟 Key Features

1. **Intelligent PDF Processing & Page Tracking**
   - High-performance, page-by-page text extraction via **PyMuPDF**.
   - Automatic normalization of whitespace and repair of hyphenated words split across line breaks.
   - Sliding-window chunking (~700 characters with 150 character overlap) that strictly preserves the original PDF page number for every excerpt.
   - Graceful detection and rejection of empty, corrupted, or scanned image-only PDFs.

2. **Grounded TF-IDF Information Retrieval**
   - Statistical vector retrieval built using **Scikit-learn** (`TfidfVectorizer` + `cosine_similarity`).
   - Query normalization, stop-word removal, and sublinear term frequency scaling (`1 + log(tf)`).
   - Ranks and extracts the **Top 3 most relevant passages** to prevent context dilution and minimize API token cost.

3. **Gemini AI Integration with Academic Guardrails**
   - Official **Google Gen AI SDK (`google-genai`)** integration.
   - Configurable model (defaults to the cost-efficient, ultra-fast `gemini-2.5-flash`).
   - Custom academic system prompt enforcing that answers are derived strictly from supplied excerpts without fabricating facts or citations.
   - Secure backend-only architecture: API keys are **never** exposed to the frontend or browser.

4. **Expandable Source Citations**
   - Every AI answer displays an interactive **Sources** section showing original PDF page numbers, match relevance scores, and verbatim extracted text excerpts.

5. **Integrated Study Tools**
   - **Document Summary**: Generates structured overviews with Key Themes, Core Concepts, and Revision Takeaways.
   - **Concept Explainer**: Explains challenging concepts with intuitive analogies, document facts, and common exam traps.
   - **Exam Questions**: Generates 5 high-yield revision questions with study hints and page citations.
   - **Interactive MCQ Quiz**: Generates 4 multiple-choice questions with live option clicking, instant scoring, answer reveals, and page-cited explanations.

6. **Pre-packaged Academic Demo Notes**
   - Comes with built-in `sample_study_notes.pdf` (covering Neural Networks, Backpropagation, and Regularization) so the project can be demonstrated in 1 click during vivas without manual file searching.

---

## 🏗️ Architecture & Technology Stack

```
┌────────────────────────────────┐
│   React + Vite Frontend        │ (Port 5173 or served via FastAPI on Port 8000)
│   - Tailwind CSS               │
│   - Lucide React Icons         │
│   - React-Markdown + GFM       │
└──────────────┬─────────────────┘
               │ HTTP REST (JSON / Multipart Form)
               ▼
┌────────────────────────────────┐
│   FastAPI Python Backend       │ (Port 8000)
│   - PyMuPDF (Text Extraction)  │
│   - Scikit-learn (TF-IDF Index)│
│   - In-memory Session Store    │
└──────────────┬─────────────────┘
               │ Secure SSL (Server-Side Only)
               ▼
┌────────────────────────────────┐
│   Google Gemini API            │ (Model: gemini-2.5-flash)
└────────────────────────────────┘
```

---

## 📁 Project Structure

```
smart-notes-ai/
│
├── backend/
│   ├── main.py                 # FastAPI application, endpoints, and static file serving
│   ├── pdf_processor.py        # PyMuPDF extraction, cleaning, and sliding chunking
│   ├── retrieval.py            # Scikit-learn TF-IDF vectorizer and cosine similarity ranking
│   ├── gemini_service.py       # Google GenAI SDK client, system prompts, study tools
│   ├── test_backend.py         # Comprehensive verification test suite
│   ├── create_sample_pdf.py    # Generates sample academic notes
│   ├── requirements.txt        # Python package dependencies
│   ├── .env.example            # Template for environment variables
│   └── .env                    # Local environment config (contains your GEMINI_API_KEY)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx             # Collapsible left navigation & document manager
│   │   │   ├── ChatArea.jsx            # Main workspace, welcome hero, and message stream
│   │   │   ├── MessageItem.jsx         # Markdown rendering, avatars, and copy button
│   │   │   ├── MessageComposer.jsx     # Auto-expanding input, keyboard shortcuts
│   │   │   ├── SourceReference.jsx     # Grounded source citation chips and excerpts
│   │   │   ├── StudyToolsModal.jsx     # Interactive MCQ quiz runner and concept explainer
│   │   │   ├── DocumentInfoModal.jsx   # Document statistics and indexing breakdown
│   │   │   ├── SettingsModal.jsx       # Health diagnostics and API key setup helper
│   │   │   ├── UploadModal.jsx         # Drag-and-drop PDF upload modal
│   │   │   └── Toast.jsx               # Floating toast notifications
│   │   ├── services/
│   │   │   └── api.js                  # Frontend HTTP client
│   │   ├── App.jsx                     # Root application state coordinator
│   │   ├── main.jsx                    # React entrypoint
│   │   └── index.css                   # Custom theme and typography styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── sample_study_notes.pdf      # Pre-generated academic notes for viva demonstrations
├── .gitignore
└── README.md
```

---

## 🚀 Setup & Execution Guide (Windows)

### Prerequisites
- **Python 3.10+** (Tested on Python 3.14)
- **Node.js 18+** (Tested on Node.js v24)
- A free **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)

---

### Step 1: Configure Backend Environment Variables

1. Navigate to the `backend/` directory.
2. If `.env` does not already exist, copy `.env.example`:
   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```
3. Open `backend/.env` in any text editor and paste your key:
   ```env
   GEMINI_API_KEY=AIzaSyYourActualKeyHere
   GEMINI_MODEL=gemini-2.5-flash
   HOST=127.0.0.1
   PORT=8000
   ```

---

### Step 2: Install Python Dependencies

Open a PowerShell terminal and run:

```powershell
# Using your Python installation:
python -m pip install -r backend/requirements.txt
```

*(Note: Dependencies include `fastapi`, `uvicorn`, `python-multipart`, `pymupdf`, `scikit-learn`, `google-genai`, `python-dotenv`, and `pydantic`)*

---

### Step 3: Install Frontend Dependencies & Build

```powershell
cd frontend
npm install
npm run build
cd ..
```

---

### Step 4: Run the Application

You have two convenient execution options:

#### Option A: Unified Full-Stack Server (Recommended for Presentations)
Because the frontend has been compiled into `frontend/dist/`, FastAPI automatically serves both the backend API and the interactive React UI from a single unified server:

```powershell
python backend/main.py
```
Then open your browser to:
👉 **`http://localhost:8000`**

#### Option B: Independent Development Servers (Hot Reloading)
**Terminal 1 (Backend):**
```powershell
cd backend
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```
Then open your browser to:
👉 **`http://localhost:5173`**

---

## 🧪 Testing & Verification

Smart Notes AI includes an automated test suite verifying all core algorithms:

```powershell
python backend/test_backend.py
```

### Verified Test Cases:
1. `GET /api/health` — Checks server status and configuration.
2. **PyMuPDF Extraction** — Verifies page-by-page text retrieval and page numbers.
3. **Text Chunking** — Verifies overlapping window segments and page metadata retention.
4. **TF-IDF Retrieval** — Probes specific queries (e.g., "Raft consensus", "CAP theorem") and asserts mathematical rank retrieval on the correct page.
5. `POST /api/upload` — Tests PDF upload and document indexing.
6. `POST /api/load-sample` — Tests instant sample document loading for demonstrations.
7. **Error Handling** — Rejects empty files (400), non-PDFs (400), and corrupted files (422).
8. `DELETE /api/document/{id}` — Cleans up memory and validates 404 on subsequent access.

---

## 🎓 Academic Viva & Presentation Explanations

When explaining this project in your academic viva or presentation, use the following clear talking points:

### 1. Why use TF-IDF instead of heavy Vector Databases (Pinecone/Chroma/Faiss)?
- **Explainability**: TF-IDF (Term Frequency-Inverse Document Frequency) is a deterministic statistical algorithm. Its term weights and cosine angle metrics can be easily calculated, debugged, and explained mathematically to an examiner.
- **Resource Efficiency**: Academic lecture notes typically range from 5 to 100 pages. TF-IDF computes in milliseconds entirely in memory without requiring gigabytes of embedding model weights or external cloud vector infrastructure.
- **Precision**: For domain-specific academic terminology (e.g., "FLP Impossibility Theorem", "ReLU", "Backpropagation"), TF-IDF sublinear scaling indexes exact vocabulary without embedding compression noise.

### 2. How does the Chunking with Page Tracking work?
- Rather than extracting the whole PDF as an unstructured string, PyMuPDF loops through each page individually (`page.get_text("text")`).
- Words split by hyphenation at line breaks (e.g., `con-\\ncurrency`) are normalized into single tokens.
- A sliding window of 700 characters with 150-character overlap moves across the text, ensuring that questions matching text near chunk boundaries still have sufficient surrounding context.
- Each chunk preserves its original 1-based page number: `{ chunk_id: 0, page_number: 1, text: "..." }`.

### 3. How are Hallucinations and Fake Citations Prevented?
- The backend retrieves the Top 3 relevant chunks based on cosine similarity.
- These chunks are formatted with strict headers: `--- [EXCERPT 1 | Page X] ---`.
- The Gemini system instruction explicitly commands:
  *"Treat the supplied excerpts as the source of truth. Do not invent information that is not supported by the document. Always include original PDF page references."*
- Citations displayed on the UI originate directly from the metadata of retrieved chunks, making fake page citations mathematically impossible.

### 4. How is API Cost and Rate Limiting Controlled?
- Context is strictly constrained: only the Top 3 passages are sent to Gemini rather than the entire PDF.
- Max output tokens are capped at 1,500 for chats and 1,800 for summaries/quizzes.
- The default model is `gemini-2.5-flash`, which offers industry-leading price-performance and generous free quotas.

---

## 🛡️ License
Built for academic presentation and demonstration. Open for educational use.

