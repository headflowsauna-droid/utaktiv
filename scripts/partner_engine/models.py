"""
Utaktiv Partner Outreach Engine - Datamodeller
Styrer prospektering, e-posthenvendelser og oppfølging av samarbeidspartnere.
"""

from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime


class LeadStatus(str, Enum):
    DISCOVERED = "discovered"              # Funnet/kartlagt, ikke kontaktet ennå
    DRAFTED = "drafted"                    # E-postutkast generert og klart til godkjenning
    SENT = "sent"                          # E-post sendt fra post@utaktiv.no
    OPENED = "opened"                      # (Valgfri) registrert åpnet/klikk
    REPLIED_INTERESTED = "replied_interested"  # Svar mottatt: Positiv! Alexander må ta over!
    REPLIED_QUESTION = "replied_question"      # Svar mottatt: Har spørsmål
    REPLIED_DECLINED = "replied_declined"      # Svar mottatt: Takket nei
    MEETING_SCHEDULED = "meeting_scheduled"    # Kaffe/tlf avtalt med Alexander
    ACTIVE_PARTNER = "active_partner"          # Avtale inngått, oppført i appen


class PartnerCategory(str, Enum):
    SAUNA = "sauna"                        # Fjordbadstuer, sjøbad
    CAFE = "cafe"                          # Fjellstuer, kafeer langs ruter
    CLIMBING_PARK = "climbing_park"        # Klatreparker, familieaktiviteter
    DNT_CABIN = "dnt_cabin"                # DNT-hytter, overnatting
    LOCAL_FOOD = "local_food"              # Gårdsutsalg, lokalmat
    EQUIPMENT_RENTAL = "equipment_rental"  # Utstyrsleie, kajakk, ski
    FESTIVAL = "festival"                  # Konserter, festivaler, løp
    PRESS = "press"                        # Aviser, presse, redaksjoner (BA, BT)
    WORKSHOP = "workshop"                  # Mekaniske verksteder, sveis, smier (skattekiste)


@dataclass
class ContactHistoryItem:
    timestamp: str
    action: str                            # "discovered", "email_sent", "reply_received", "note_added"
    details: str
    channel: str = "email"                 # "email", "phone", "meeting"


@dataclass
class PartnerLead:
    id: str
    business_name: str
    contact_name: str
    email: str
    category: PartnerCategory
    location: str                          # F.eks. "Fløyen, Bergen" eller "Eidfjord"
    associated_trail: str                  # F.eks. "Vidden", "Stoltzekleiven", "Hardanger"
    phone: Optional[str] = None
    website: Optional[str] = None
    status: LeadStatus = LeadStatus.DISCOVERED
    custom_offer: Optional[str] = None     # F.eks. "Vaffel + kaffe", "1t drop-in badstue"
    suggested_price_nok: Optional[int] = None
    notes: str = ""
    last_contact_date: Optional[str] = None
    email_draft_subject: Optional[str] = None
    email_draft_body: Optional[str] = None
    history: List[Dict[str, Any]] = field(default_factory=list)

    def add_history(self, action: str, details: str, channel: str = "email"):
        self.history.append({
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "details": details,
            "channel": channel,
        })

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["category"] = self.category.value if isinstance(self.category, PartnerCategory) else self.category
        d["status"] = self.status.value if isinstance(self.status, LeadStatus) else self.status
        return d

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "PartnerLead":
        cat = PartnerCategory(data.get("category", PartnerCategory.CAFE.value))
        stat = LeadStatus(data.get("status", LeadStatus.DISCOVERED.value))
        return cls(
            id=data["id"],
            business_name=data["business_name"],
            contact_name=data.get("contact_name", "Daglig leder"),
            email=data["email"],
            category=cat,
            location=data.get("location", "Norge"),
            associated_trail=data.get("associated_trail", "Nærområdet"),
            phone=data.get("phone"),
            website=data.get("website"),
            status=stat,
            custom_offer=data.get("custom_offer"),
            suggested_price_nok=data.get("suggested_price_nok"),
            notes=data.get("notes", ""),
            last_contact_date=data.get("last_contact_date"),
            email_draft_subject=data.get("email_draft_subject"),
            email_draft_body=data.get("email_draft_body"),
            history=data.get("history", []),
        )
