## Voicera AI Teacher Assistant — Developer TODO

### Phase 0: Setup & Specs
- [x] Finalize requirements.txt
- [ ] Set up virtual environment and install dependencies
- [ ] Initialize FastAPI app and SQLAlchemy models for core entities

### Phase 1: Core Models & REST API
- [ ] Implement SQLAlchemy models: Institution, Program, Course, Teacher, Student, Enrollment, RepositoryItem
- [ ] FastAPI REST endpoints for CRUD operations
- [ ] Authentication & role-based access (FastAPI Users or JWT)

### Phase 2: Repository Ingestion
- [ ] File upload endpoint (PDF, audio, slides, etc.) via FastAPI
- [ ] Text extraction (OCR, STT) using Tesseract/Whisper
- [ ] Chunking and embedding pipeline (e.g., with SentenceTransformers)
- [ ] Store embeddings in a simple vector DB (e.g., FAISS)

### Phase 3: Voice Chatbot UI
- [ ] Web chat UI (voice in/out) using React or Streamlit
- [ ] Integrate STT (Whisper/Deepgram) and TTS (ElevenLabs/Polly)
- [ ] Connect to AI backend for RAG answering (FastAPI endpoint)

### Phase 4: Web Scraping Engine
- [ ] Scraper job (Playwright/Scrapy)
- [ ] Store scraped content as RepositoryItem
- [ ] Auto-tagging/classification (simple ML or rule-based)

### Phase 5: Agent Orchestration
- [ ] Implement agent workflow (LangChain or custom Python scripts)
- [ ] Tools: REST API, retriever, scraper, scheduler, message sender
- [ ] Teacher review queue

### Phase 6: Consent & Audit Logging
- [ ] Consent flow for audio/data (FastAPI endpoints)
- [ ] Audit trail for all AI outputs (simple DB logging)

### Phase 7: Monitoring & Analytics
- [ ] Simple monitoring (Prometheus/Grafana or FastAPI middleware)
- [ ] Model usage dashboards (basic charts with Plotly/Streamlit)

---
