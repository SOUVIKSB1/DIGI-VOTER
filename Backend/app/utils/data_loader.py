"""
Data Loader for Election Records
Loads constituencies, candidates, and party structures with caching.
"""
import json
import os
from pathlib import Path

BASE_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"

class DataLoader:
    _constituencies = None
    _candidates = None
    _parties = None

    @classmethod
    def get_constituencies(cls):
        if cls._constituencies is None:
            path = BASE_DATA_DIR / "constituencies.json"
            if not path.exists():
                raise FileNotFoundError(f"Missing data file: {path}")
            with open(path, "r", encoding="utf-8") as f:
                cls._constituencies = json.load(f)
        return cls._constituencies

    @classmethod
    def get_candidates(cls):
        if cls._candidates is None:
            path = BASE_DATA_DIR / "candidates.json"
            if not path.exists():
                raise FileNotFoundError(f"Missing data file: {path}")
            with open(path, "r", encoding="utf-8") as f:
                cls._candidates = json.load(f)
        return cls._candidates

    @classmethod
    def get_parties(cls):
        if cls._parties is None:
            path = BASE_DATA_DIR / "parties.json"
            if not path.exists():
                raise FileNotFoundError(f"Missing data file: {path}")
            with open(path, "r", encoding="utf-8") as f:
                cls._parties = json.load(f)
        return cls._parties
