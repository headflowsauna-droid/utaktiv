"""
Utaktiv Social Media Engine - X (Twitter) Klient
Håndterer publisering av tweets, tråder og video til @alexrobertsen / @utaktiv via X API v2.
"""

import os
import json
import urllib.request
import urllib.parse
from typing import Dict, Any, List
from scripts.social_engine.models import SocialPost
from scripts.social_engine.platforms.base import BasePlatformClient
from scripts.social_engine.credentials import get_credentials


class XClient(BasePlatformClient):
    def __init__(self, dry_run: bool = True):
        super().__init__(dry_run=dry_run)
        self.creds = get_credentials("x")
        self.api_key = self.creds.get("api_key")
        self.api_secret = self.creds.get("api_secret")
        self.access_token = self.creds.get("access_token")
        self.access_token_secret = self.creds.get("access_token_secret")
        self.bearer_token = self.creds.get("bearer_token")

    def check_connection(self) -> Dict[str, Any]:
        has_keys = bool(self.bearer_token or (self.api_key and self.access_token))
        return {
            "platform": "x",
            "authenticated": has_keys,
            "status": "ready" if has_keys else "missing_credentials",
            "dry_run": self.dry_run
        }

    def publish(self, post: SocialPost) -> Dict[str, Any]:
        content = post.content
        hashtags_str = " ".join([h if h.startswith("#") else f"#{h}" for h in post.hashtags])
        full_text = f"{content}\n\n{hashtags_str}".strip()

        # Hvis posten inneholder "---", er det en tråd
        tweets = [t.strip() for t in full_text.split("---") if t.strip()]

        if self.dry_run or not (self.bearer_token or (self.api_key and self.access_token)):
            # Simulert sending
            return {
                "success": True,
                "mode": "dry_run" if self.dry_run else "simulated_missing_creds",
                "platform": "x",
                "post_id": post.id,
                "tweets_count": len(tweets),
                "preview": tweets,
                "post_url": f"https://x.com/alexrobertsen/status/simulated_{post.id}"
            }

        # LIVE sending via X API v2
        try:
            url = "https://api.twitter.com/2/tweets"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.bearer_token}" if self.bearer_token else f"Bearer {self.access_token}"
            }
            
            first_tweet_id = None
            last_tweet_id = None

            for i, tweet_body in enumerate(tweets):
                payload: Dict[str, Any] = {"text": tweet_body}
                if last_tweet_id:
                    payload["reply"] = {"in_reply_to_tweet_id": last_tweet_id}

                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers=headers,
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=15) as resp:
                    res_data = json.loads(resp.read().decode("utf-8"))
                    tweet_id = res_data.get("data", {}).get("id")
                    if i == 0:
                        first_tweet_id = tweet_id
                    last_tweet_id = tweet_id

            return {
                "success": True,
                "mode": "live",
                "platform": "x",
                "post_id": post.id,
                "remote_id": first_tweet_id,
                "post_url": f"https://x.com/alexrobertsen/status/{first_tweet_id}"
            }
        except Exception as e:
            return {
                "success": False,
                "platform": "x",
                "error": str(e)
            }
