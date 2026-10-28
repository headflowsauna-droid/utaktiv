"""
Utaktiv Social Media Engine - LinkedIn Klient
Håndterer publisering av artikler, video-oppdateringer og innlegg til Alexanders personlige profil og Utaktiv Company Page.
"""

import os
import json
import urllib.request
import urllib.parse
from typing import Dict, Any
from scripts.social_engine.models import SocialPost
from scripts.social_engine.platforms.base import BasePlatformClient
from scripts.social_engine.credentials import get_credentials


class LinkedInClient(BasePlatformClient):
    def __init__(self, dry_run: bool = True):
        super().__init__(dry_run=dry_run)
        self.creds = get_credentials("linkedin")
        self.access_token = self.creds.get("access_token")
        self.author_urn = self.creds.get("author_urn") or self.creds.get("person_urn")

    def check_connection(self) -> Dict[str, Any]:
        has_token = bool(self.access_token)
        return {
            "platform": "linkedin",
            "authenticated": has_token,
            "status": "ready" if has_token else "missing_credentials",
            "author_urn": self.author_urn or "urn:li:person:alexander-robertsen",
            "dry_run": self.dry_run
        }

    def publish(self, post: SocialPost) -> Dict[str, Any]:
        hashtags_str = " ".join([h if h.startswith("#") else f"#{h}" for h in post.hashtags])
        full_text = f"{post.title}\n\n{post.content}\n\n{hashtags_str}".strip()

        if self.dry_run or not self.access_token:
            # Simulert sending
            return {
                "success": True,
                "mode": "dry_run" if self.dry_run else "simulated_missing_creds",
                "platform": "linkedin",
                "post_id": post.id,
                "preview": full_text,
                "post_url": f"https://www.linkedin.com/feed/update/urn:li:activity:simulated_{post.id}"
            }

        # LIVE sending via LinkedIn UGC Post API
        try:
            url = "https://api.linkedin.com/v2/ugcPosts"
            headers = {
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
                "Authorization": f"Bearer {self.access_token}"
            }
            author = self.author_urn or "urn:li:person:CURRENT_USER"
            payload = {
                "author": author,
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {
                            "text": full_text
                        },
                        "shareMediaCategory": "NONE"
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                remote_urn = res_data.get("id")

            return {
                "success": True,
                "mode": "live",
                "platform": "linkedin",
                "post_id": post.id,
                "remote_id": remote_urn,
                "post_url": f"https://www.linkedin.com/feed/update/{remote_urn}"
            }
        except Exception as e:
            return {
                "success": False,
                "platform": "linkedin",
                "error": str(e)
            }
