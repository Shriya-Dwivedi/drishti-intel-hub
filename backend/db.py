import json
import os
from pathlib import Path
from typing import Any, List

DATA_DIR = Path(__file__).parent / "data"
STORE_FILE = DATA_DIR / "store.json"

DEFAULT_STORE = {
    "documents": [],
    "entities": [],
    "edges": [],
    "ingestion_jobs": [],
    "cases": [],
}


def _ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def load_store() -> dict:
    _ensure_data_dir()
    if not STORE_FILE.exists():
        return {k: list(v) for k, v in DEFAULT_STORE.items()}
    try:
        with open(STORE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        for key in DEFAULT_STORE:
            data.setdefault(key, [])
        return data
    except (json.JSONDecodeError, OSError):
        return {k: list(v) for k, v in DEFAULT_STORE.items()}


def save_store(store: dict) -> None:
    _ensure_data_dir()
    with open(STORE_FILE, "w", encoding="utf-8") as f:
        json.dump(store, f, indent=2, ensure_ascii=False)


def save_item(collection: str, items: List[Any]) -> None:
    store = load_store()
    store[collection] = items
    save_store(store)
