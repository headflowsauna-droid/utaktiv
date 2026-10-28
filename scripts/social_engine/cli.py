#!/usr/bin/env python3
"""
Utaktiv Social Media Engine - Kommandolinjegrensesnitt (CLI)
Lar Alexander og AI-agenten styre innholdsproduksjon, godkjenning og publisering
til X, LinkedIn og TikTok.
"""

import sys
import argparse
from datetime import datetime
from typing import List

from scripts.social_engine.models import Platform, PostStatus, SocialPost
from scripts.social_engine.store import SocialStore
from scripts.social_engine.generator import ContentGenerator, VIDEO_CAMPAIGNS
from scripts.social_engine.platforms.x_client import XClient
from scripts.social_engine.platforms.linkedin_client import LinkedInClient
from scripts.social_engine.platforms.tiktok_client import TikTokClient
from scripts.social_engine.credentials import save_credentials, get_credentials


def get_client(platform: Platform, live: bool = False):
    dry_run = not live
    if platform == Platform.X:
        return XClient(dry_run=dry_run)
    elif platform == Platform.LINKEDIN:
        return LinkedInClient(dry_run=dry_run)
    elif platform == Platform.TIKTOK:
        return TikTokClient(dry_run=dry_run)
    else:
        raise ValueError(f"Ukjent plattform: {platform}")


def cmd_list(args):
    store = SocialStore()
    posts = store.get_all_posts()

    if args.status:
        posts = [p for p in posts if p.status.value == args.status]
    if args.platform:
        posts = [p for p in posts if p.platform.value == args.platform]

    if not posts:
        print("\n📭 Ingen poster funnet med de gitte filtrene.")
        print("💡 Tips: Generer nye poster med: python3 -m scripts.social_engine.cli generate skattekiste-fjell\n")
        return

    print(f"\n📱 Utaktiv Social Media Queue ({len(posts)} poster):\n" + "=" * 80)
    print(f"{'ID':<30} | {'Plattform':<10} | {'Status':<10} | {'Tittel / Konsept'}")
    print("-" * 80)
    for p in posts:
        status_icons = {
            PostStatus.IDEA: "💡",
            PostStatus.DRAFTED: "📝",
            PostStatus.APPROVED: "✅",
            PostStatus.SCHEDULED: "⏰",
            PostStatus.PUBLISHED: "🚀",
            PostStatus.FAILED: "❌"
        }
        icon = status_icons.get(p.status, "❓")
        print(f"{p.id:<30} | {p.platform.value.upper():<10} | {icon} {p.status.value:<8} | {p.title[:35]}")
    print("=" * 80 + "\n")


def cmd_generate(args):
    store = SocialStore()
    campaign_key = args.campaign or "skattekiste-fjell"
    try:
        new_posts = ContentGenerator.generate_campaign_posts(campaign_key)
        for p in new_posts:
            store.save_post(p)
        print(f"\n✨ Genererte {len(new_posts)} nye poster for kampanjen '{campaign_key}':")
        for p in new_posts:
            print(f"  • [{p.platform.value.upper()}] ID: {p.id}")
            print(f"    Tittel: {p.title}")
            print(f"    Format: {p.format.value}")
        print("\n💡 Se detaljer med: python3 -m scripts.social_engine.cli preview <id>")
        print("💡 Godkjenn for publisering med: python3 -m scripts.social_engine.cli approve <id>\n")
    except Exception as e:
        print(f"❌ Feil ved generering: {e}")


def cmd_preview(args):
    store = SocialStore()
    post = store.get_post(args.id)
    if not post:
        print(f"❌ Fant ingen post med ID '{args.id}'.")
        return

    print("\n" + "=" * 70)
    print(f"📱 Forhåndsvisning: [{post.platform.value.upper()}] — ID: {post.id}")
    print(f"📌 Status: {post.status.value.upper()} | Format: {post.format.value}")
    if post.video_concept:
        print(f"🎬 Video-konsept: {post.video_concept}")
    print("-" * 70)
    print(f"TITTEL / HOOK:\n{post.title}\n")
    print(f"INNHOLD:\n{post.content}\n")
    print(f"HASHTAGS:\n{' '.join(['#' + h.lstrip('#') for h in post.hashtags])}\n")
    print(f"CTA:\n{post.call_to_action}")
    if post.post_url:
        print(f"🔗 URL: {post.post_url}")
    print("=" * 70 + "\n")


def cmd_approve(args):
    store = SocialStore()
    post = store.get_post(args.id)
    if not post:
        print(f"❌ Fant ingen post med ID '{args.id}'.")
        return

    post.status = PostStatus.APPROVED
    store.save_post(post)
    print(f"\n✅ Post '{post.id}' er nå GODKJENT ({post.platform.value.upper()})!")
    print(f"💡 Publiser med: python3 -m scripts.social_engine.cli publish {post.id} [--live]\n")


def cmd_publish(args):
    store = SocialStore()
    post = store.get_post(args.id)
    if not post:
        print(f"❌ Fant ingen post med ID '{args.id}'.")
        return

    if post.status != PostStatus.APPROVED and not args.force:
        print(f"⚠️ Posten har status '{post.status.value}'. Den må godkjennes først med: approve {post.id}")
        print("   (Bruk --force hvis du vil overstyre godkjenning).")
        return

    client = get_client(post.platform, live=args.live)
    mode_text = "🔴 LIVE PUBLISERING" if args.live else "🟡 TØRRKJØRING (Dry-run)"
    print(f"\n{mode_text} til {post.platform.value.upper()}...")

    res = client.publish(post)
    if res.get("success"):
        print("✅ Publisering vellykket!")
        print(f"   Modus: {res.get('mode')}")
        if res.get("post_url"):
            print(f"   Lenke: {res.get('post_url')}")
            post.post_url = res.get("post_url")
        if args.live:
            post.status = PostStatus.PUBLISHED
            post.published_at = datetime.now().isoformat()
            store.save_post(post)
    else:
        print(f"❌ Feil ved publisering: {res.get('error')}")
        if args.live:
            post.status = PostStatus.FAILED
            post.error_message = res.get("error")
            store.save_post(post)
    print()


def cmd_publish_approved(args):
    store = SocialStore()
    approved = store.get_approved_queue()
    if not approved:
        print("\n📭 Ingen godkjente poster i køen.")
        return

    print(f"\n🚀 Starter publisering av {len(approved)} godkjente poster ({'LIVE' if args.live else 'DRY-RUN'}):")
    for post in approved:
        client = get_client(post.platform, live=args.live)
        print(f"\n• Behandler {post.id} ({post.platform.value.upper()})...")
        res = client.publish(post)
        if res.get("success"):
            print(f"  ✅ Suksess! Lenke: {res.get('post_url')}")
            if args.live:
                post.status = PostStatus.PUBLISHED
                post.published_at = datetime.now().isoformat()
                post.post_url = res.get("post_url")
                store.save_post(post)
        else:
            print(f"  ❌ Feilet: {res.get('error')}")


def cmd_status(args):
    store = SocialStore()
    posts = store.get_all_posts()
    
    print("\n" + "=" * 60)
    print("📊 Utaktiv Social Media Engine Status")
    print("=" * 60)
    print(f"Totalt antall innlegg i databasen: {len(posts)}")
    print(f"• Utkast (Drafted):    {len([p for p in posts if p.status == PostStatus.DRAFTED])}")
    print(f"• Godkjent (Approved):  {len([p for p in posts if p.status == PostStatus.APPROVED])}")
    print(f"• Publisert (Published): {len([p for p in posts if p.status == PostStatus.PUBLISHED])}")
    print(f"• Feilet (Failed):     {len([p for p in posts if p.status == PostStatus.FAILED])}")
    print("-" * 60)
    print("Tilkoblinger & API-nøkler:")
    for plat in [Platform.X, Platform.LINKEDIN, Platform.TIKTOK]:
        client = get_client(plat, live=False)
        conn = client.check_connection()
        auth_icon = "🟢" if conn.get("authenticated") else "⚪"
        print(f"• {plat.value.upper():<10}: {auth_icon} {conn.get('status')} (Autentisert: {conn.get('authenticated')})")
    print("=" * 60 + "\n")


def cmd_set_credentials(args):
    platform = args.platform.lower()
    creds = {}
    for item in args.pairs:
        if "=" in item:
            k, v = item.split("=", 1)
            creds[k.strip()] = v.strip()
    if not creds:
        print("❌ Ingen nøkler oppgitt. Bruk format: key1=val1 key2=val2")
        return
    save_credentials(platform, creds)
    print(f"🔒 Lagret {len(creds)} nøkler sikkert for {platform.upper()} i ~/.utaktiv/social_creds.json (chmod 600).")


def main():
    parser = argparse.ArgumentParser(description="Utaktiv Social Media Marketing Engine")
    subparsers = parser.add_subparsers(dest="command", help="Underkommandoer")

    # list
    p_list = subparsers.add_parser("list", help="List opp poster i køen")
    p_list.add_argument("--status", choices=["idea", "drafted", "approved", "scheduled", "published", "failed"], help="Filtrer på status")
    p_list.add_argument("--platform", choices=["x", "linkedin", "tiktok"], help="Filtrer på plattform")

    # generate
    p_gen = subparsers.add_parser("generate", help="Generer nye poster fra et videokonsept")
    p_gen.add_argument("campaign", nargs="?", default="skattekiste-fjell", choices=list(VIDEO_CAMPAIGNS.keys()), help="Kampanjenøkkel")

    # preview
    p_prev = subparsers.add_parser("preview", help="Forhåndsvis en post i detalj")
    p_prev.add_argument("id", help="Post ID")

    # approve
    p_app = subparsers.add_parser("approve", help="Godkjenn en post for publisering")
    p_app.add_argument("id", help="Post ID")

    # publish
    p_pub = subparsers.add_parser("publish", help="Publiser en post (dry-run som standard)")
    p_pub.add_argument("id", help="Post ID")
    p_pub.add_argument("--live", action="store_true", help="Send faktisk til plattformens API")
    p_pub.add_argument("--force", action="store_true", help="Overstyr godkjenningskrav")

    # publish-approved
    p_batch = subparsers.add_parser("publish-approved", help="Publiser alle godkjente poster i køen")
    p_batch.add_argument("--live", action="store_true", help="Send faktisk til plattformenes API-er")

    # status
    subparsers.add_parser("status", help="Vis systemstatus og API-tilkoblinger")

    # set-credentials
    p_creds = subparsers.add_parser("set-credentials", help="Lagre API-nøkler sikkert")
    p_creds.add_argument("platform", choices=["x", "linkedin", "tiktok"], help="Plattform")
    p_creds.add_argument("pairs", nargs="+", help="Nøkkel-verdi-par (f.eks. api_key=xyz access_token=abc)")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(0)

    dispatch = {
        "list": cmd_list,
        "generate": cmd_generate,
        "preview": cmd_preview,
        "approve": cmd_approve,
        "publish": cmd_publish,
        "publish-approved": cmd_publish_approved,
        "status": cmd_status,
        "set-credentials": cmd_set_credentials
    }
    dispatch[args.command](args)


if __name__ == "__main__":
    main()
