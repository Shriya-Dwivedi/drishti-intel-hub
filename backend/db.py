import os
from typing import Any, Dict, List, Optional

from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------- documents ----------
def _doc_to_row(d: dict) -> dict:
    return {
        "id": d["id"],
        "title": d.get("title"),
        "language": d.get("language"),
        "source_type": d.get("sourceType"),
        "date": d.get("date"),
        "ingested": d.get("ingested"),
        "excerpt": d.get("excerpt"),
        "summary": d.get("summary", ""),
        "excerpt_original": d.get("excerptOriginal"),
        "pages": d.get("pages", 1),
    }

def _row_to_doc(r: dict) -> dict:
    return {
        "id": r["id"],
        "title": r.get("title"),
        "language": r.get("language"),
        "sourceType": r.get("source_type"),
        "date": r.get("date"),
        "ingested": r.get("ingested"),
        "excerpt": r.get("excerpt"),
        "summary": r.get("summary", ""),
        "excerptOriginal": r.get("excerpt_original"),
        "pages": r.get("pages", 1),
    }

def get_all_documents() -> List[dict]:
    res = _client.table("documents").select("*").execute()
    return [_row_to_doc(r) for r in res.data]

def save_document(doc: dict) -> None:
    _client.table("documents").upsert(_doc_to_row(doc)).execute()

def delete_document_row(doc_id: str) -> None:
    _client.table("documents").delete().eq("id", doc_id).execute()

# ---------- ingestion jobs ----------
def _job_to_row(j: dict) -> dict:
    return {
        "id": j["id"],
        "filename": j.get("filename"),
        "language": j.get("language"),
        "stage": j.get("stage"),
        "progress": j.get("progress", 0),
        "extracted_text": j.get("extractedText", ""),
        "text_length": j.get("textLength", 0),
    }

def _row_to_job(r: dict) -> dict:
    return {
        "id": r["id"],
        "filename": r.get("filename"),
        "language": r.get("language"),
        "stage": r.get("stage"),
        "progress": r.get("progress", 0),
        "extractedText": r.get("extracted_text", ""),
        "textLength": r.get("text_length", 0),
    }

def get_all_ingestion_jobs() -> List[dict]:
    res = _client.table("ingestion_jobs").select("*").execute()
    return [_row_to_job(r) for r in res.data]

def save_ingestion_job(job: dict) -> None:
    _client.table("ingestion_jobs").upsert(_job_to_row(job)).execute()

def delete_ingestion_job(job_id: str) -> None:
    _client.table("ingestion_jobs").delete().eq("id", job_id).execute()

# ---------- entities ----------
def get_all_entities() -> List[dict]:
    res = _client.table("entities").select("*").execute()
    return [
        {"id": r["id"], "name": r.get("name"), "type": r.get("type"),
         "mentions": r.get("mentions", 0), "documentId": r.get("document_id")}
        for r in res.data
    ]

def save_entities(entities: List[dict]) -> None:
    if not entities:
        return
    rows = [
        {"id": e["id"], "name": e.get("name"), "type": e.get("type"),
         "mentions": e.get("mentions", 0), "document_id": e.get("documentId")}
        for e in entities
    ]
    _client.table("entities").upsert(rows).execute()

def delete_entities_for_document(doc_id: str) -> None:
    _client.table("entities").delete().eq("document_id", doc_id).execute()

# ---------- edges ----------
def get_all_edges() -> List[dict]:
    res = _client.table("edges").select("*").execute()
    return [
        {"from": r.get("from_id"), "to": r.get("to_id"),
         "weight": r.get("weight", 1), "documentId": r.get("document_id")}
        for r in res.data
    ]

def save_edges(edges: List[dict]) -> None:
    if not edges:
        return
    rows = [
        {"from_id": e.get("from"), "to_id": e.get("to"),
         "weight": e.get("weight", 1), "document_id": e.get("documentId")}
        for e in edges
    ]
    _client.table("edges").insert(rows).execute()

def delete_edges_for_document(doc_id: str) -> None:
    _client.table("edges").delete().eq("document_id", doc_id).execute()

# ---------- cases ----------
def get_all_cases() -> List[dict]:
    res = _client.table("cases").select("*").execute()
    return res.data

def save_case(case: dict) -> None:
    _client.table("cases").upsert(case).execute()

# ---------- users ----------
def get_user(username: str) -> Optional[dict]:
    res = _client.table("users").select("*").eq("username", username).execute()
    return res.data[0] if res.data else None

def create_user(username: str, password: str, role: str = "analyst") -> None:
    _client.table("users").insert({"username": username, "password": password, "role": role}).execute()