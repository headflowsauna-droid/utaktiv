"""
Utaktiv Partner Outreach Engine - Datalagring (JSON Store)
Holder oversikt over alle prospekterte bedrifter, kontaktstatuser og historikk.
"""

import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from .models import PartnerLead, LeadStatus


DEFAULT_STORE_PATH = Path(__file__).resolve().parent.parent.parent / "docs" / "data" / "partner_leads.json"


class PartnerStore:
    def __init__(self, file_path: Optional[Path] = None):
        self.file_path = Path(file_path or DEFAULT_STORE_PATH)
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        self._ensure_file()

    def _ensure_file(self):
        if not self.file_path.exists():
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2, ensure_ascii=False)

    def load_all(self) -> List[PartnerLead]:
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                raw = json.load(f)
                return [PartnerLead.from_dict(d) for d in raw]
        except Exception:
            return []

    def save_all(self, leads: List[PartnerLead]):
        with open(self.file_path, "w", encoding="utf-8") as f:
            data = [lead.to_dict() for lead in leads]
            json.dump(data, f, indent=2, ensure_ascii=False)

    def get(self, lead_id: str) -> Optional[PartnerLead]:
        for lead in self.load_all():
            if lead.id == lead_id:
                return lead
        return None

    def find_by_email(self, email: str) -> Optional[PartnerLead]:
        clean = email.strip().lower()
        for lead in self.load_all():
            if lead.email.strip().lower() == clean:
                return lead
        return None

    def add(self, lead: PartnerLead) -> bool:
        leads = self.load_all()
        if any(l.id == lead.id or l.email.strip().lower() == lead.email.strip().lower() for l in leads):
            return False
        leads.append(lead)
        self.save_all(leads)
        return True

    def update(self, lead: PartnerLead) -> bool:
        leads = self.load_all()
        for i, existing in enumerate(leads):
            if existing.id == lead.id:
                leads[i] = lead
                self.save_all(leads)
                return True
        return False

    def list_by_status(self, status: LeadStatus) -> List[PartnerLead]:
        return [l for l in self.load_all() if l.status == status]

    def stats(self) -> Dict[str, int]:
        leads = self.load_all()
        counts: Dict[str, int] = {}
        for l in leads:
            s = l.status.value if isinstance(l.status, LeadStatus) else l.status
            counts[s] = counts.get(s, 0) + 1
        counts["total"] = len(leads)
        return counts
