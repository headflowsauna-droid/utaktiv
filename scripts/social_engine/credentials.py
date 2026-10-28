"""
Utaktiv Social Media Engine - Credential Manager
Sikker lagring og henting av API-nøkler for X, LinkedIn og TikTok.
Følger OPSEC-retningslinjer: Nøkler lagres aldri i git-sporede mapper.
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional

CREDS_FILE = Path.home() / ".utaktiv" / "social_creds.json"


def get_credentials(platform: str) -> Dict[str, str]:
    """Henter credentials for en gitt plattform fra env eller ~/.utaktiv/social_creds.json."""
    creds: Dict[str, str] = {}

    # 1. Prøv miljøvariabler
    prefix = platform.upper()
    for key, val in os.environ.items():
        if key.startswith(f"{prefix}_"):
            subkey = key[len(prefix) + 1:].lower()
            creds[subkey] = val

    # 2. Prøv lokal sikker fil hvis ikke alt finnes i env
    if CREDS_FILE.exists():
        try:
            with open(CREDS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                file_creds = data.get(platform.lower(), {})
                for k, v in file_creds.items():
                    if k not in creds:
                        creds[k] = v
        except Exception:
            pass

    return creds


def save_credentials(platform: str, new_creds: Dict[str, str]) -> None:
    """Lagrer credentials i ~/.utaktiv/social_creds.json med chmod 600."""
    CREDS_FILE.parent.mkdir(parents=True, exist_ok=True)
    current: Dict[str, Any] = {}
    if CREDS_FILE.exists():
        try:
            with open(CREDS_FILE, "r", encoding="utf-8") as f:
                current = json.load(f)
        except Exception:
            current = {}

    current[platform.lower()] = new_creds

    with open(CREDS_FILE, "w", encoding="utf-8") as f:
        json.dump(current, f, indent=2)

    try:
        CREDS_FILE.chmod(0o600)
    except Exception:
        pass
