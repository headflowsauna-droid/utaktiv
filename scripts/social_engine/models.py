"""
Utaktiv Social Media Engine - Datamodeller
Håndterer SoMe-innlegg, kampanjer, plattformer (X, LinkedIn, TikTok),
godkjenningsflyt og publiseringsstatuser for Utaktiv.no.
"""

from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime


class Platform(str, Enum):
    X = "x"                  # Twitter / X
    LINKEDIN = "linkedin"    # LinkedIn
    TIKTOK = "tiktok"        # TikTok


class PostStatus(str, Enum):
    IDEA = "idea"            # Konsept/idé
    DRAFTED = "drafted"      # Ferdig skrevet utkast
    APPROVED = "approved"    # Godkjent av Alexander (klar for publisering)
    SCHEDULED = "scheduled"  # Tidsinnstilt
    PUBLISHED = "published"  # Publisert på plattformen
    FAILED = "failed"        # Feilet under publisering


class ContentFormat(str, Enum):
    VIDEO_9_16 = "video_9_16"    # Vertikal kortvideo (8-60 sek)
    THREAD = "thread"            # X-tråd / flerdelt innlegg
    SINGLE_POST = "single_post"  # Standard tekst-/bilde-post
    CAROUSEL = "carousel"        # Dokument/karusell (LinkedIn)


@dataclass
class SocialPost:
    id: str
    platform: Platform
    title: str
    content: str
    format: ContentFormat = ContentFormat.VIDEO_9_16
    hashtags: List[str] = field(default_factory=list)
    video_concept: Optional[str] = None
    media_path: Optional[str] = None
    target_audience: str = "Turentusiaster & barnefamilier"
    call_to_action: str = "Last ned Utaktiv gratis på https://utaktiv.no"
    status: PostStatus = PostStatus.DRAFTED
    campaign_id: Optional[str] = None
    scheduled_time: Optional[str] = None
    published_at: Optional[str] = None
    post_url: Optional[str] = None
    error_message: Optional[str] = None
    metrics: Dict[str, Any] = field(default_factory=lambda: {
        "views": 0,
        "likes": 0,
        "shares": 0,
        "comments": 0
    })
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["platform"] = self.platform.value
        data["status"] = self.status.value
        data["format"] = self.format.value
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SocialPost":
        item = dict(data)
        item["platform"] = Platform(item.get("platform", "x"))
        item["status"] = PostStatus(item.get("status", "drafted"))
        item["format"] = ContentFormat(item.get("format", "video_9_16"))
        return cls(**item)


@dataclass
class Campaign:
    id: str
    name: str
    theme: str
    goal: str
    start_date: str
    end_date: str
    post_ids: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Campaign":
        return cls(**data)
