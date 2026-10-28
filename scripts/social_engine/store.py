"""
Utaktiv Social Media Engine - Lagringsmodul
Håndterer JSON-persistering av SoMe-poster, statusoppdateringer og kampanjer.
"""

import os
import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime

from scripts.social_engine.models import SocialPost, Campaign, Platform, PostStatus


DEFAULT_POSTS_PATH = Path("docs/data/social_posts.json")
DEFAULT_CAMPAIGNS_PATH = Path("docs/data/social_campaigns.json")


class SocialStore:
    def __init__(self, posts_path: Path = DEFAULT_POSTS_PATH, campaigns_path: Path = DEFAULT_CAMPAIGNS_PATH):
        self.posts_path = Path(posts_path)
        self.campaigns_path = Path(campaigns_path)
        self._ensure_storage_exists()

    def _ensure_storage_exists(self) -> None:
        self.posts_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.posts_path.exists():
            self._save_raw_posts([])
        if not self.campaigns_path.exists():
            self._save_raw_campaigns([])

    def _load_raw_posts(self) -> List[Dict[str, Any]]:
        try:
            with open(self.posts_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _save_raw_posts(self, data: List[Dict[str, Any]]) -> None:
        with open(self.posts_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def _load_raw_campaigns(self) -> List[Dict[str, Any]]:
        try:
            with open(self.campaigns_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _save_raw_campaigns(self, data: List[Dict[str, Any]]) -> None:
        with open(self.campaigns_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    # ------------------ Post operasjoner ------------------

    def get_all_posts(self) -> List[SocialPost]:
        raw = self._load_raw_posts()
        return [SocialPost.from_dict(p) for p in raw]

    def get_post(self, post_id: str) -> Optional[SocialPost]:
        for post in self.get_all_posts():
            if post.id == post_id:
                return post
        return None

    def save_post(self, post: SocialPost) -> None:
        post.updated_at = datetime.now().isoformat()
        posts = self.get_all_posts()
        found = False
        for i, existing in enumerate(posts):
            if existing.id == post.id:
                posts[i] = post
                found = True
                break
        if not found:
            posts.append(post)
        self._save_raw_posts([p.to_dict() for p in posts])

    def delete_post(self, post_id: str) -> bool:
        posts = self.get_all_posts()
        initial_len = len(posts)
        posts = [p for p in posts if p.id != post_id]
        if len(posts) < initial_len:
            self._save_raw_posts([p.to_dict() for p in posts])
            return True
        return False

    def get_posts_by_status(self, status: PostStatus) -> List[SocialPost]:
        return [p for p in self.get_all_posts() if p.status == status]

    def get_posts_by_platform(self, platform: Platform) -> List[SocialPost]:
        return [p for p in self.get_all_posts() if p.platform == platform]

    def get_approved_queue(self) -> List[SocialPost]:
        """Returnerer poster som er godkjent og klare til sending."""
        return [p for p in self.get_all_posts() if p.status in [PostStatus.APPROVED, PostStatus.SCHEDULED]]

    # ------------------ Kampanje operasjoner ------------------

    def get_all_campaigns(self) -> List[Campaign]:
        raw = self._load_raw_campaigns()
        return [Campaign.from_dict(c) for c in raw]

    def get_campaign(self, campaign_id: str) -> Optional[Campaign]:
        for campaign in self.get_all_campaigns():
            if campaign.id == campaign_id:
                return campaign
        return None

    def save_campaign(self, campaign: Campaign) -> None:
        campaigns = self.get_all_campaigns()
        found = False
        for i, existing in enumerate(campaigns):
            if existing.id == campaign.id:
                campaigns[i] = campaign
                found = True
                break
        if not found:
            campaigns.append(campaign)
        self._save_raw_campaigns([c.to_dict() for c in campaigns])
