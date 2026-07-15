import os
import re
from typing import Any, Dict, List, Optional

import chromadb
import google.generativeai as genai
import requests
from sentence_transformers import SentenceTransformer

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = "llama3.2:1b"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-1.5-flash"
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
CONFIDENCE_THRESHOLD = 0.35
SNIPPET_MAX_CHARS = 400
FULL_TEXT_MAX_CHARS = 100000

print("Loading ML models (LaBSE + ChromaDB)…")
_embedder = SentenceTransformer("sentence-transformers/LaBSE")
_chroma = chromadb.PersistentClient(path=os.path.join(os.path.dirname(__file__), "chroma_db"))
_collection = _chroma.get_or_create_collection(name="document_chunks")


def _chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    if not text:
        return []
    cleaned = re.sub(r"\s+", " ", text.strip())
    if len(cleaned) <= chunk_size:
        return [cleaned]
    chunks = []
    start = 0
    while start < len(cleaned):
        end = start + chunk_size
        chunks.append(cleaned[start:end])
        if end >= len(cleaned):
            break
        start = end - overlap
    return chunks


def _ollama_generate(
    prompt: str,
    num_predict: int = 80,
    num_ctx: int = 768,
    temperature: Optional[float] = None,
) -> str:
    options: Dict[str, Any] = {"num_predict": num_predict, "num_ctx": num_ctx}
    if temperature is not None:
        options["temperature"] = temperature
    resp = requests.post(
        OLLAMA_URL,
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": options,
        },
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json().get("response", "").strip()


def _gemini_generate(prompt: str, max_output_tokens: int = 200, temperature: float = 0) -> str:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set. Add it to your .env file or environment variables.")
    model = genai.GenerativeModel(GEMINI_MODEL)
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            max_output_tokens=max_output_tokens,
            temperature=temperature,
        ),
    )
    return (response.text or "").strip()


def index_document(
    document_id: str,
    text: str,
    document_title: str,
    language: str,
) -> None:
    chunks = _chunk_text(text)
    if not chunks:
        return

    existing = _collection.get(where={"documentId": document_id})
    if existing and existing.get("ids"):
        _collection.delete(ids=existing["ids"])

    ids = []
    embeddings = []
    metadatas = []
    documents = []

    for i, chunk in enumerate(chunks):
        chunk_id = f"{document_id}-chunk-{i}"
        ids.append(chunk_id)
        documents.append(chunk)
        metadatas.append(
            {
                "documentId": document_id,
                "documentTitle": document_title,
                "language": language,
                "page": 1,
            }
        )

    embeddings = _embedder.encode(documents, show_progress_bar=False).tolist()
    _collection.add(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)


def semantic_search(
    query_text: str,
    top_k: int = 2,
    document_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    if not query_text.strip():
        return []

    query_embedding = _embedder.encode([query_text], show_progress_bar=False).tolist()
    query_kwargs: Dict[str, Any] = {
        "query_embeddings": query_embedding,
        "n_results": top_k,
    }
    if document_id is not None:
        query_kwargs["where"] = {"documentId": document_id}

    if _collection.count() == 0:
        return []

    results = _collection.query(**query_kwargs)

    matches: List[Dict[str, Any]] = []
    ids = results.get("ids", [[]])[0]
    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    for i, _chunk_id in enumerate(ids):
        distance = distances[i] if i < len(distances) else 1.0
        confidence = max(0.0, 1.0 - distance)
        if confidence < CONFIDENCE_THRESHOLD:
            continue

        meta = metadatas[i] if i < len(metadatas) else {}
        snippet = documents[i] if i < len(documents) else ""
        matches.append(
            {
                "documentId": meta.get("documentId", ""),
                "documentTitle": meta.get("documentTitle", ""),
                "snippet": snippet[:SNIPPET_MAX_CHARS],
                "language": meta.get("language", "en"),
                "confidence": round(confidence, 3),
                "page": int(meta.get("page", 1)),
            }
        )

    return matches


def generate_answer_from_full_text(query: str, document_text: str, document_title: str) -> str:
    truncated = document_text[:FULL_TEXT_MAX_CHARS]
    prompt = (
        "You are a document Q&A assistant. Answer the question using ONLY the document text below.\n"
        "Do not use outside knowledge. Do not guess or invent facts.\n"
        'If the answer is not explicitly stated in the document, respond with exactly:\n'
        '"The document does not contain information to answer this question."\n\n'
        f"Document: {document_title}\n\n"
        f"{truncated}\n\n"
        f"Question: {query}\n\n"
        "Answer:"
    )

    try:
        return _gemini_generate(prompt, max_output_tokens=200, temperature=0)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return f"DEBUG ERROR: {type(e).__name__}: {str(e)}"


def generate_rag_answer(query_text: str, matches: List[Dict[str, Any]]) -> str:
    if not matches:
        return "No relevant information found in the corpus for this query."

    context_parts = []
    for i, m in enumerate(matches, start=1):
        snippet = m.get("snippet", "")[:SNIPPET_MAX_CHARS]
        title = m.get("documentTitle", "Unknown")
        context_parts.append(f"[{i}] ({title}): {snippet}")

    context = "\n\n".join(context_parts)
    prompt = (
        "Do not use any outside knowledge, do not guess, and do not expand abbreviations "
        "using your own training knowledge — only use what is explicitly written in the sources. "
        "If the sources do not contain the answer, respond exactly: "
        "'This is not mentioned in the uploaded document.'\n\n"
        f"Answer the question using ONLY the excerpts below. "
        f"Cite sources as [1], [2], etc.\n\n"
        f"Excerpts:\n{context}\n\n"
        f"Question: {query_text}\n\n"
        f"Answer:"
    )

    try:
        return _gemini_generate(prompt, max_output_tokens=150, temperature=0)
    except Exception:
        return (
            f"Found {len(matches)} relevant passage(s). "
            "Review the cited sources below for exact context."
        )


def generate_summary(text: str, max_points: int = 4) -> str:
    if not text:
        return "No text could be extracted from this document."

    cleaned = re.sub(r"\s+", " ", text.strip())[:2000]
    prompt = (
        f"Summarize the following document in {max_points} concise bullet points. "
        f"One point per line, no numbering prefix.\n\n{cleaned}\n\nSummary:"
    )

    try:
        summary = _gemini_generate(prompt, max_output_tokens=200, temperature=0.3)
        if summary:
            return summary
    except Exception:
        pass

    sentences = re.split(r"(?<=[.!?])\s+", cleaned)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 25]
    if not sentences:
        return cleaned[:400]
    ranked = sorted(sentences, key=len, reverse=True)[:max_points]
    return "\n".join(s[0].upper() + s[1:] if s else s for s in ranked)


print("ML engine ready.")
