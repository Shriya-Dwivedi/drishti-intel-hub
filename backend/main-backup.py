from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
import pytesseract
import os
import re
import uuid
import pdfplumber
from PIL import Image
from langdetect import detect
import spacy
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

import db as database
import ml_engine

nlp = spacy.load("en_core_web_sm")
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# ---- app setup (must come first) ----
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- storage ----
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---- models ----
class DocumentRecord(BaseModel):
    id: str
    title: str
    language: str
    sourceType: str
    date: str
    ingested: str
    excerpt: str
    summary: str = ""
    excerptOriginal: Optional[str] = None
    pages: int

class QuerySources(BaseModel):
    documentId: str
    documentTitle: str
    snippet: str
    language: str
    confidence: float = 0.75
    page: int = 1

class QueryResult(BaseModel):
    id: str
    query: str
    detectedLanguage: str
    answer: str
    sources: List[QuerySources]
    generatedAt: str

class LoginRequest(BaseModel):
    username: str
    password: str

USERS_DB = {
    "admin": "admin123",
    "analyst": "analyst123",
}

class CaseRecord(BaseModel):
    id: str
    title: str
    status: str
    owner: str
    updated: str
    summary: str
    queries: List[str] = []
    findings: List[str] = []

class QueryRequest(BaseModel):
    query: str
    document_id: Optional[str] = None

_store = database.load_store()
documents_db: List[DocumentRecord] = [DocumentRecord(**d) for d in _store.get("documents", [])]
entities_db = _store.get("entities", [])
edges_db = _store.get("edges", [])
ingestion_jobs = _store.get("ingestion_jobs", [])
cases_db: List[CaseRecord] = [CaseRecord(**c) for c in _store.get("cases", [])]

FULL_TEXT_ROUTE_THRESHOLD = 8000

# ---- helpers ----
def extract_text_from_pdf(path: str) -> str:
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()

def extract_text_from_image(path: str) -> str:
    img = Image.open(path)
    return pytesseract.image_to_string(img).strip()

def extract_entities(text: str):
    if not text:
        return []
    doc = nlp(text[:100000])
    entity_map = {}
    for ent in doc.ents:
        if ent.label_ not in ["PERSON", "ORG", "GPE", "LOC"]:  # DATE dropped — too noisy
            continue
        name = ent.text.strip()
        if len(name) < 3 or re.match(r'^[\d\W]+$', name):
            continue
        type_map = {"PERSON": "person", "ORG": "org", "GPE": "location", "LOC": "location"}
        etype = type_map[ent.label_]
        key = (name.lower(), etype)
        if key not in entity_map:
            entity_map[key] = {"id": f"E-{uuid.uuid4().hex[:6]}", "name": name, "type": etype, "mentions": 0}
        entity_map[key]["mentions"] += 1
    result = list(entity_map.values())
    result.sort(key=lambda e: -e["mentions"])
    return result[:15]

def compute_edges(entities: list):
    edges = []
    for i in range(len(entities)):
        for j in range(i + 1, len(entities)):
            edges.append({
                "from": entities[i]["id"],
                "to": entities[j]["id"],
                "weight": 1,
            })
    return edges

def get_document_full_text(document_id: str) -> Optional[dict]:
    text = None
    for job in ingestion_jobs:
        if job.get("id") == document_id:
            text = job.get("extractedText")
            break
    if not text:
        return None

    title = None
    for doc in documents_db:
        if doc.id == document_id:
            title = doc.title
            break
    if title is None:
        return None

    return {"text": text, "title": title}

def process_document(job_id: str, filename: str, text: str, lang: str) -> dict:
    job = {
        "id": job_id,
        "filename": filename,
        "language": lang,
        "stage": "indexed" if text else "failed",
        "progress": 100 if text else 0,
        "extractedText": text,
        "textLength": len(text),
    }
    ingestion_jobs.append(job)

    doc = DocumentRecord(
        id=job_id,
        title=filename,
        language=lang,
        sourceType="report",
        date="2026-07-01",
        ingested=datetime.utcnow().isoformat() + "Z",
        excerpt=text[:300] if text else "(no text extracted)",
        summary=ml_engine.generate_summary(text),
        pages=1,
    )
    documents_db.append(doc)

    new_entities = extract_entities(text)
    for ent in new_entities:
        ent["documentId"] = job_id
    entities_db.extend(new_entities)

    new_edges = compute_edges(new_entities)
    for edge in new_edges:
        edge["documentId"] = job_id
    edges_db.extend(new_edges)

    if text:
        ml_engine.index_document(job_id, text, filename, lang)

    database.save_item("documents", [d.model_dump() for d in documents_db])
    database.save_item("entities", entities_db)
    database.save_item("edges", edges_db)
    database.save_item("ingestion_jobs", ingestion_jobs)

    return job

# ---- routes ----
@app.get("/")
def root():
    return {"status": "backend is alive"}

@app.get("/api/health")
def get_system_health():
    total_bytes = sum(
        os.path.getsize(os.path.join(UPLOAD_DIR, f))
        for f in os.listdir(UPLOAD_DIR)
        if os.path.isfile(os.path.join(UPLOAD_DIR, f))
    )
    index_size_gb = round(total_bytes / (1024 ** 3), 4)
    return {
        "offline": True,
        "externalCalls": 0,
        "uptimeHours": 999,
        "indexSizeGB": index_size_gb,
        "lastIngestion": "2025-02-22T09:30:00Z",
        "services": [
            {"name": "Index", "status": "ok"},
            {"name": "OCR", "status": "ok"},
            {"name": "Embedding", "status": "ok"},
            {"name": "Translator", "status": "degraded"},
        ],
    }

@app.get("/api/corpus-stats")
def get_corpus_stats():
    return {
        "documents": len(documents_db),
        "languagesPresent": len(set(d.language for d in documents_db)) if documents_db else 0,
        "lastIngestion": documents_db[-1].ingested if documents_db else None,
        "newToday": len(ingestion_jobs),
    }

@app.get("/api/documents", response_model=List[DocumentRecord])
def get_documents():
    return documents_db

@app.get("/api/documents/{doc_id}", response_model=Optional[DocumentRecord])
def get_document(doc_id: str):
    for doc in documents_db:
        if doc.id == doc_id:
            return doc
    return None

@app.post("/api/ingest")
async def ingest_document(file: UploadFile = File(...)):
    job_id = "J-" + uuid.uuid4().hex[:8]
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    ext = file.filename.lower().split(".")[-1]

    if ext == "pdf":
        text = extract_text_from_pdf(file_path)
    elif ext in ["png", "jpg", "jpeg", "tiff", "bmp"]:
        text = extract_text_from_image(file_path)
    else:
        text = ""

    try:
        lang = detect(text) if text else "unknown"
    except Exception:
        lang = "unknown"

    return process_document(job_id, file.filename, text, lang)

@app.get("/api/ingestion-jobs")
def get_ingestion_jobs():
    return ingestion_jobs

@app.get("/api/entities")
def get_entities(document_id: Optional[str] = None):
    if document_id:
        filtered_entities = [e for e in entities_db if e.get("documentId") == document_id]
        entity_ids = {e["id"] for e in filtered_entities}
        filtered_edges = [
            e for e in edges_db
            if e.get("documentId") == document_id
            and e.get("from") in entity_ids
            and e.get("to") in entity_ids
        ]
        return {"entities": filtered_entities, "edges": filtered_edges}
    return {"entities": entities_db, "edges": edges_db}

@app.get("/api/cases", response_model=List[CaseRecord])
def get_cases():
    return cases_db

@app.get("/api/cases/{case_id}", response_model=Optional[CaseRecord])
def get_case(case_id: str):
    for c in cases_db:
        if c.id == case_id:
            return c
    return None

@app.post("/api/cases", response_model=CaseRecord)
def create_case(case: CaseRecord):
    cases_db.append(case)
    database.save_item("cases", [c.model_dump() for c in cases_db])
    return case

@app.post("/api/login")
def login(payload: LoginRequest):
    if USERS_DB.get(payload.username) == payload.password:
        return {"success": True, "username": payload.username, "role": "admin" if payload.username == "admin" else "analyst"}
    return {"success": False, "message": "Invalid username or password"}

@app.post("/api/query", response_model=QueryResult)
def run_query(payload: QueryRequest):
    query_text = payload.query

    try:
        detected_lang = detect(query_text) if query_text else "en"
    except Exception:
        detected_lang = "en"

    if payload.document_id:
        doc_data = get_document_full_text(payload.document_id)
        if doc_data and len(doc_data["text"]) < FULL_TEXT_ROUTE_THRESHOLD:
            doc_record = next((d for d in documents_db if d.id == payload.document_id), None)
            answer = ml_engine.generate_answer_from_full_text(
                query_text,
                doc_data["text"],
                doc_data["title"],
            )
            matches = [
                QuerySources(
                    documentId=payload.document_id,
                    documentTitle=doc_data["title"],
                    snippet=doc_data["text"][:400],
                    language=doc_record.language if doc_record else detected_lang,
                    confidence=1.0,
                    page=1,
                )
            ]
            return QueryResult(
                id="Q-" + uuid.uuid4().hex[:6],
                query=query_text,
                detectedLanguage=detected_lang,
                answer=answer,
                sources=matches,
                generatedAt=datetime.utcnow().isoformat() + "Z",
            )

    raw_matches = ml_engine.semantic_search(
        query_text,
        top_k=2,
        document_id=payload.document_id,
    )
    matches = [
        QuerySources(
            documentId=m["documentId"],
            documentTitle=m["documentTitle"],
            snippet=m["snippet"],
            language=m["language"],
            confidence=m["confidence"],
            page=m.get("page", 1),
        )
        for m in raw_matches
    ]

    answer = ml_engine.generate_rag_answer(query_text, raw_matches)

    return QueryResult(
        id="Q-" + uuid.uuid4().hex[:6],
        query=query_text,
        detectedLanguage=detected_lang,
        answer=answer,
        sources=matches,
        generatedAt=datetime.utcnow().isoformat() + "Z",
    )