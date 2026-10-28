"""
Utaktiv Social Media Engine - TikTok Klient
Håndterer opplasting av 9:16 videoer, captions, lydeffekter og hashtags til @utaktiv via TikTok Creator / Direct Post API.
"""

import os
import json
import urllib.request
import urllib.parse
from typing import Dict, Any
from scripts.social_engine.models import SocialPost
from scripts.social_engine.platforms.base import BasePlatformClient
from scripts.social_engine.credentials import get_credentials


class TikTokClient(BasePlatformClient):
    def __init__(self, dry_run: bool = True):
        super().__init__(dry_run=dry_run)
        self.creds = get_credentials("tiktok")
        self.access_token = self.creds.get("access_token")
        self.creator_username = self.creds.get("username", "utaktiv")

    def check_connection(self) -> Dict[str, Any]:
        has_token = bool(self.access_token)
        return {
            "platform": "tiktok",
            "authenticated": has_token,
            "status": "ready" if has_token else "missing_credentials",
            "creator_username": f"@{self.creator_username}",
            "dry_run": self.dry_run
        }

    def publish(self, post: SocialPost) -> Dict[str, Any]:
        hashtags_str = " ".join([h if h.startswith("#") else f"#{h}" for h in post.hashtags])
        caption = f"{post.title} — {post.content}\n\n{hashtags_str}".strip()

        if self.dry_run or not self.access_token:
            # Simulert sending
            return {
                "success": True,
                "mode": "dry_run" if self.dry_run else "simulated_missing_creds",
                "platform": "tiktok",
                "post_id": post.id,
                "video_concept": post.video_concept or "9:16 Vertikalt videoklipp",
                "caption": caption,
                "preview": {
                    "hook": post.title,
                    "description": post.content,
                    "cta": post.call_to_action
                },
                "post_url": f"https://www.tiktok.com/@{self.creator_username}/video/simulated_{post.id}"
            }

        # LIVE sending via TikTok Creator API
        try:
            url = "https://open.tiktokapis.com/v2/post/publish/video/init/"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            payload = {
                "post_info": {
                    "title": caption[:150],  # TikTok title limit
                    "privacy_level": "PUBLIC_TO_EVERYONE",
                    "disable_duet": False,
                    "disable_comment": False,
                    "disable_stitch": False
                },
                "source_info": {
                    "source": "FILE_UPLOAD"
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
                publish_id = res_data.get("data", {}).get("publish_id")

            return {
                "success": True,
                "mode": "live",
                "platform": "tiktok",
                "post_id": post.id,
                "publish_id": publish_id,
                "post_url": f"https://www.tiktok.com/@{self.creator_username}"
            }
        except Exception as e:
            return {
                "success": False,
                "platform": "tiktok",
                "error": str(e)
            }
