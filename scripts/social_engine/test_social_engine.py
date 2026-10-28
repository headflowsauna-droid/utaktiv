"""
Enhetstester for Utaktiv Social Media Engine
Tester modeller, lagring, generator og plattformklienter (X, LinkedIn, TikTok).
"""

import unittest
import tempfile
import os
from pathlib import Path

from scripts.social_engine.models import SocialPost, Platform, PostStatus, ContentFormat, Campaign
from scripts.social_engine.store import SocialStore
from scripts.social_engine.generator import ContentGenerator, VIDEO_CAMPAIGNS
from scripts.social_engine.platforms.x_client import XClient
from scripts.social_engine.platforms.linkedin_client import LinkedInClient
from scripts.social_engine.platforms.tiktok_client import TikTokClient


class TestSocialEngine(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.posts_file = Path(self.temp_dir.name) / "test_posts.json"
        self.campaigns_file = Path(self.temp_dir.name) / "test_campaigns.json"
        self.store = SocialStore(posts_path=self.posts_file, campaigns_path=self.campaigns_file)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_post_serialization(self):
        post = SocialPost(
            id="test-post-1",
            platform=Platform.X,
            title="Test Tweet",
            content="Dette er en test-tweet for Utaktiv",
            hashtags=["utaktiv", "sol"],
            status=PostStatus.DRAFTED
        )
        data = post.to_dict()
        self.assertEqual(data["platform"], "x")
        self.assertEqual(data["status"], "drafted")

        reconstructed = SocialPost.from_dict(data)
        self.assertEqual(reconstructed.id, post.id)
        self.assertEqual(reconstructed.platform, Platform.X)
        self.assertEqual(reconstructed.hashtags, ["utaktiv", "sol"])

    def test_store_crud(self):
        post1 = SocialPost(id="p1", platform=Platform.TIKTOK, title="TikTok 1", content="Text 1")
        post2 = SocialPost(id="p2", platform=Platform.LINKEDIN, title="LinkedIn 1", content="Text 2")
        
        self.store.save_post(post1)
        self.store.save_post(post2)

        all_posts = self.store.get_all_posts()
        self.assertEqual(len(all_posts), 2)

        fetched = self.store.get_post("p1")
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.title, "TikTok 1")

        # Oppdatering
        fetched.status = PostStatus.APPROVED
        self.store.save_post(fetched)
        updated = self.store.get_post("p1")
        self.assertEqual(updated.status, PostStatus.APPROVED)

        # Godkjent kø
        queue = self.store.get_approved_queue()
        self.assertEqual(len(queue), 1)
        self.assertEqual(queue[0].id, "p1")

        # Sletting
        deleted = self.store.delete_post("p2")
        self.assertTrue(deleted)
        self.assertEqual(len(self.store.get_all_posts()), 1)

    def test_content_generator(self):
        posts = ContentGenerator.generate_campaign_posts("skattekiste-fjell")
        self.assertEqual(len(posts), 3)

        platforms = {p.platform for p in posts}
        self.assertIn(Platform.X, platforms)
        self.assertIn(Platform.LINKEDIN, platforms)
        self.assertIn(Platform.TIKTOK, platforms)

        # Space Capsule kampanjen
        sc_posts = ContentGenerator.generate_campaign_posts("space-capsule-2027")
        self.assertEqual(len(sc_posts), 3)
        tt_post = next(p for p in sc_posts if p.platform == Platform.TIKTOK)
        self.assertIn("Space Capsule", tt_post.content)

    def test_platform_clients_dry_run(self):
        post = SocialPost(
            id="dry-test",
            platform=Platform.X,
            title="Dry Run Test",
            content="Testing dry run mode",
            hashtags=["test"]
        )

        # X
        x_client = XClient(dry_run=True)
        res_x = x_client.publish(post)
        self.assertTrue(res_x["success"])
        self.assertEqual(res_x["platform"], "x")

        # LinkedIn
        li_client = LinkedInClient(dry_run=True)
        post.platform = Platform.LINKEDIN
        res_li = li_client.publish(post)
        self.assertTrue(res_li["success"])
        self.assertEqual(res_li["platform"], "linkedin")

        # TikTok
        tt_client = TikTokClient(dry_run=True)
        post.platform = Platform.TIKTOK
        res_tt = tt_client.publish(post)
        self.assertTrue(res_tt["success"])
        self.assertEqual(res_tt["platform"], "tiktok")


if __name__ == "__main__":
    unittest.main()
