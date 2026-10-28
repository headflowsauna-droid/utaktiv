#!/usr/bin/env python3
"""
Utaktiv Partner Outreach Engine - CLI & Automasjonsverktøy
Bruk:
  python3 scripts/partner_engine/cli.py list
  python3 scripts/partner_engine/cli.py seed
  python3 scripts/partner_engine/cli.py draft <lead_id>
  python3 scripts/partner_engine/cli.py send <lead_id> [--live]
  python3 scripts/partner_engine/cli.py send-batch [--max 5] [--live]
  python3 scripts/partner_engine/cli.py check-inbox
  python3 scripts/partner_engine/cli.py stats
  python3 scripts/partner_engine/cli.py set-password <passord>
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime
from typing import List

from .models import PartnerLead, LeadStatus, PartnerCategory
from .store import PartnerStore
from .templates import generate_outreach_email
from .mailer import send_email, save_mail_credentials, get_mail_credentials
from .inbox_monitor import check_inbox


def cmd_seed(store: PartnerStore):
    """Fyller databasen med de bekreftede partner-prospektene fra BEDRIFTSLISTE_PARTNERE.md."""
    initial_leads = [
        PartnerLead(
            id="heit-bergen",
            business_name="Heit Bergen Fjordbadstue",
            contact_name="Daglig leder",
            email="post@heitbergen.no",
            category=PartnerCategory.SAUNA,
            location="Marineholmen & Nordnes, Bergen",
            associated_trail="Byfjorden / Vidden-målgang / Koengen",
            phone="55 00 00 00",
            website="https://heitbergen.no",
            custom_offer="1t drop-in vedfyrt badstue & sjøbad etter fjelltur",
            suggested_price_nok=225,
            notes="Topp prioritet. Populært stopp etter Vidden og før Koengen-konserter."
        ),
        PartnerLead(
            id="voss-fjordbadstue",
            business_name="Voss Fjordbadstue",
            contact_name="Bookingansvarlig",
            email="booking@vossfjordbadstue.no",
            category=PartnerCategory.SAUNA,
            location="Vangsvatnet, Voss",
            associated_trail="Ekstremsportveko-løypene / Prestegardsmoen",
            custom_offer="Flytende badstue og forfriskende dukkert i Vangsvatnet",
            suggested_price_nok=210,
            notes="Perfekt match for Voss og ekstremsportpublikum."
        ),
        PartnerLead(
            id="damp-sauna",
            business_name="Damp Sauna",
            contact_name="Daglig leder",
            email="hei@dampsauna.no",
            category=PartnerCategory.SAUNA,
            location="Lysefjorden / Preikestolen",
            associated_trail="Preikestolen",
            website="https://dampsauna.no",
            custom_offer="Fjordbadstue etter turen opp til Preikestolen",
            suggested_price_nok=240,
            notes="Ikonisk stopp for turister og fjellfolk."
        ),
        PartnerLead(
            id="city-sauna-bergen",
            business_name="City Sauna Bergen",
            contact_name="Daglig leder",
            email="post@citysauna.no",
            category=PartnerCategory.SAUNA,
            location="Sandviken, Bergen",
            associated_trail="Stoltzekleiven / Sandviksbatteriet",
            custom_offer="Restitusjon for beina etter Stoltzekleiven",
            suggested_price_nok=200,
            notes="Ligger ved foten av Stoltzen."
        ),
        PartnerLead(
            id="floistuen-kafe",
            business_name="Fløistuen Kafé (Fløibanen AS)",
            contact_name="Kaféleder",
            email="post@floyen.no",
            category=PartnerCategory.CAFE,
            location="Fløyen toppen, Bergen",
            associated_trail="Vidden / Fløyen Trollsti",
            phone="55 33 68 00",
            website="https://floyen.no",
            custom_offer="Varm bergensk skillingsbolle & kaffe",
            suggested_price_nok=65,
            notes="Hovedmålgang for tusenvis av turgåere på Fløyen."
        ),
        PartnerLead(
            id="skomakerstuen-kafe",
            business_name="Skomakerstuen Kafé",
            contact_name="Driftsleder",
            email="post@floyen.no",
            category=PartnerCategory.CAFE,
            location="Skomakerdiket, Fløyen",
            associated_trail="Skomakerdiket / Fløyen",
            custom_offer="Nystekt fjellvaffel med rømme/syltetøy & saft",
            suggested_price_nok=55,
            notes="Svært barnevennlig kafé ved vannet."
        ),
        PartnerLead(
            id="skyskraperen-ulriken",
            business_name="Skyskraperen Restaurant / Ulriken Café",
            contact_name="Booking",
            email="booking@skyskraperen.no",
            category=PartnerCategory.CAFE,
            location="Ulriken toppen, Bergen",
            associated_trail="Vidden / Ulriken 643",
            phone="55 32 04 04",
            website="https://skyskraperen.no",
            custom_offer="Ulriken Energi-lunsj & kaffe før turen over Vidden",
            suggested_price_nok=110,
            notes="Høyeste Byfjell-stopp."
        ),
        PartnerLead(
            id="hoyt-lavt-bergen",
            business_name="Høyt & Lavt Klatrepark Bergen",
            contact_name="Daglig leder",
            email="bergen@hoytlavt.no",
            category=PartnerCategory.CLIMBING_PARK,
            location="Nesttun / Osvegen, Bergen",
            associated_trail="Nesttun / Fana",
            phone="55 92 63 00",
            website="https://hoytlavt.no/bergen",
            custom_offer="Klatrebillett + gratis energivaffel for barna",
            suggested_price_nok=360,
            notes="Barnas absolutte favoritt for innløsing av oppsparte Sol-poeng."
        ),
        PartnerLead(
            id="ado-arena",
            business_name="AdO Arena",
            contact_name="Daglig leder",
            email="post@adoarena.no",
            category=PartnerCategory.CLIMBING_PARK,
            location="Store Lungegårdsvann, Bergen",
            associated_trail="Byrunden / Lungegårdsvannet",
            website="https://adoarena.no",
            custom_offer="Dagslysbad + familieis",
            suggested_price_nok=165,
            notes="Norges nasjonalanlegg for svømming og stup."
        ),
        PartnerLead(
            id="sjel-og-gane",
            business_name="Sjel & Gane",
            contact_name="Arthur",
            email="arthur@sjeloggane.no",
            category=PartnerCategory.CAFE,
            location="Eidfjord, Hardanger",
            associated_trail="Hardangerfjord / Vøringsfossen",
            phone="+47 932 57 370",
            website="https://sjeloggane.no",
            custom_offer="Lokal tradisjonsmat og ferske bakverk",
            suggested_price_nok=195,
            notes="Lokal gastronomisk perle i Eidfjord."
        ),
        PartnerLead(
            id="saetregarden-aasane",
            business_name="Sætregården Friluftsgård",
            contact_name="Driftsleder",
            email="post@saetregarden.no",
            category=PartnerCategory.CAFE,
            location="Åsane, Bergen",
            associated_trail="Den trondhjemske postvei / Veten",
            custom_offer="Nystekte sveler og saft etter turen opp Veten",
            suggested_price_nok=55,
            notes="Gammel skysstasjon og friluftssenter for barnefamilier."
        ),
        # Aviser & Presse (BA & BT) for Skattejakten
        PartnerLead(
            id="ba-tips",
            business_name="Bergensavisen (BA) Nyheter",
            contact_name="Nyhetsredaksjonen",
            email="tips@ba.no",
            category=PartnerCategory.PRESS,
            location="Bergen sentrum",
            associated_trail="Byfjellene i Bergen",
            custom_offer="Heit Bergen Fjordbadstue / Sparebanken Vest",
            notes="Tips om Skattejakten i Byfjellene, kodelåst stålkiste og storpremie."
        ),
        PartnerLead(
            id="ba-debatt",
            business_name="Bergensavisen (BA) Debatt",
            contact_name="Debattredaksjonen",
            email="debatt@ba.no",
            category=PartnerCategory.PRESS,
            location="Bergen",
            associated_trail="Byfjellene / Fløyen",
            custom_offer="Heit Bergen Fjordbadstue / Sparebanken Vest",
            notes="Hovedinnlegg om skjermfrihet, dagslys og Skattejakten."
        ),
        PartnerLead(
            id="bt-tips",
            business_name="Bergens Tidende (BT) Nyheter",
            contact_name="Nyhetsdesken",
            email="2211@bt.no",
            category=PartnerCategory.PRESS,
            location="Bergen sentrum",
            associated_trail="Byfjellene / Vidden",
            custom_offer="Heit Bergen Fjordbadstue / Sparebanken Vest",
            notes="Forhåndstips og fotomulighet for Skattejakten."
        ),
        PartnerLead(
            id="bt-debatt",
            business_name="Bergens Tidende (BT) Debatt",
            contact_name="Debattledelsen",
            email="debatt@bt.no",
            category=PartnerCategory.PRESS,
            location="Bergen",
            associated_trail="Byfjellene i Bergen",
            custom_offer="Heit Bergen Fjordbadstue / Sparebanken Vest",
            notes="Kronikk om folkehelse, analog lek og Skattejakten."
        ),
    ]

    added = 0
    for l in initial_leads:
        if store.add(l):
            added += 1

    print(f"✅ Seeding fullført: {added} nye partnere lagt til i {store.file_path}")
    print(f"Totalt antall partnere i registeret: {len(store.load_all())}")


def cmd_list(store: PartnerStore, status_filter: str = None):
    leads = store.load_all()
    if status_filter:
        leads = [l for l in leads if l.status.value == status_filter]

    if not leads:
        print("Ingen partnere funnet.")
        return

    print(f"\n{'ID':<22} {'BEDRIFT':<32} {'KATEGORI':<15} {'STATUS':<18} {'E-POST'}")
    print("=" * 110)
    for l in leads:
        cat = l.category.value if isinstance(l.category, PartnerCategory) else l.category
        stat = l.status.value if isinstance(l.status, LeadStatus) else l.status
        print(f"{l.id:<22} {l.business_name[:30]:<32} {cat:<15} {stat:<18} {l.email}")
    print("=" * 110)
    print(f"Totalt: {len(leads)} partnere\n")


def cmd_draft(store: PartnerStore, lead_id: str, partner_name: str = None):
    lead = store.get(lead_id)
    if not lead:
        print(f"Feil: Fant ikke partner med ID '{lead_id}'")
        return

    if partner_name:
        lead.custom_offer = partner_name

    subject, body = generate_outreach_email(lead)
    lead.email_draft_subject = subject
    lead.email_draft_body = body
    lead.status = LeadStatus.DRAFTED
    lead.add_history("draft_created", f"Genererte e-postutkast: '{subject}'")
    store.update(lead)

    print("\n" + "=" * 80)
    print(f"UTKAST FOR: {lead.business_name} <{lead.email}>")
    print("=" * 80)
    print(f"Emne: {subject}\n")
    print(body)
    print("=" * 80)
    print(f"✅ Utkast lagret for '{lead.id}'. Status endret til 'drafted'.\n")


def cmd_send(store: PartnerStore, lead_id: str, live: bool = False, attachment: str = None):
    lead = store.get(lead_id)
    if not lead:
        print(f"Feil: Fant ikke partner med ID '{lead_id}'")
        return

    # Generer eller bruk eksisterende utkast
    if not lead.email_draft_body or not lead.email_draft_subject:
        subj, body = generate_outreach_email(lead)
        lead.email_draft_subject = subj
        lead.email_draft_body = body

    attachments = []
    if attachment:
        attachments.append(attachment)
    elif lead.category == PartnerCategory.PRESS or (isinstance(lead.category, str) and lead.category == "press"):
        default_pic = Path(__file__).resolve().parent.parent.parent / "docs" / "Alexander_Robertsen_Forfatterbilde.jpg"
        if default_pic.exists():
            attachments.append(str(default_pic))

    is_dry_run = not live
    ok, msg = send_email(
        to_email=lead.email,
        subject=lead.email_draft_subject,
        body_text=lead.email_draft_body,
        dry_run=is_dry_run,
        attachments=attachments if attachments else None
    )

    if ok:
        att_note = f" (m/{len(attachments)} vedlegg: {Path(attachments[0]).name})" if attachments else ""
        if live:
            lead.status = LeadStatus.SENT
            lead.last_contact_date = datetime.now().isoformat()
            lead.add_history("email_sent", f"Sendte henvendelse: '{lead.email_draft_subject}' via post@utaktiv.no{att_note}")
            store.update(lead)
            print(f"🚀 [LIVE SENDING VELLYKKET] E-post sendt til {lead.business_name} ({lead.email}){att_note}!")
        else:
            print(f"🔍 [SIMULERT SENDING (DRY-RUN)]")
            print(f"Til: {lead.business_name} <{lead.email}>")
            print(f"Emne: {lead.email_draft_subject}")
            if attachments:
                print(f"Vedlegg: {attachments[0]}")
            print(f"For å sende på ordentlig: legg til flagget --live")
    else:
        print(f"❌ Sending feilet: {msg}")


def cmd_check_inbox(store: PartnerStore):
    print("📬 Kobler opp mot mail.utaktiv.no:993 (IMAP SSL) for å sjekke svar...")
    ok, replies, msg = check_inbox(store)
    print(msg)

    if replies:
        print("\n" + "🔥" * 35)
        print("INNKOMMENDE SVAR:")
        for r in replies:
            status_tag = "🚨 [INTERESSERT PARTNER!]" if r["is_positive"] else "ℹ️ [SVAR MOTTATT]"
            print(f"\n{status_tag}")
            print(f"Fra: {r['from']}")
            print(f"Emne: {r['subject']}")
            print(f"Utdrag: {r['body_snippet'][:140]}...")
            if r["lead_name"]:
                print(f"Koblet til lead: {r['lead_name']} ({r['lead_id']})")
        print("🔥" * 35 + "\n")


def cmd_stats(store: PartnerStore):
    counts = store.stats()
    print("\n📊 PARTNER OUTREACH STATUS:")
    print("=" * 40)
    for k, v in counts.items():
        print(f"{k:<25}: {v}")
    print("=" * 40 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Utaktiv Partner Outreach Engine")
    subparsers = parser.add_subparsers(dest="command")

    # seed
    subparsers.add_parser("seed", help="Fyll databasen med innledende partnere")

    # list
    list_p = subparsers.add_parser("list", help="List partnere")
    list_p.add_argument("--status", help="Filtrer etter status")

    # draft
    draft_p = subparsers.add_parser("draft", help="Generer e-postutkast")
    draft_p.add_argument("lead_id", help="Lead ID (f.eks. ba-tips, bt-debatt, heit-bergen)")
    draft_p.add_argument("--partner", help="Sponsor / samarbeidspartner som stiller med premie")

    # send
    send_p = subparsers.add_parser("send", help="Send e-post til lead")
    send_p.add_argument("lead_id", help="Lead ID")
    send_p.add_argument("--live", action="store_true", help="Send faktisk e-post via SMTP")
    send_p.add_argument("--attachment", help="Sti til filvedlegg (f.eks. forfatterbilde)")

    # check-inbox
    subparsers.add_parser("check-inbox", help="Sjekk innboks via IMAP for svar")

    # stats
    subparsers.add_parser("stats", help="Vis statistikk")

    # set-password
    pw_p = subparsers.add_parser("set-password", help="Lagre passord for post@utaktiv.no")
    pw_p.add_argument("password", help="Passord for e-postkontoen")

    args = parser.parse_args()
    store = PartnerStore()

    if args.command == "seed":
        cmd_seed(store)
    elif args.command == "list":
        cmd_list(store, args.status)
    elif args.command == "draft":
        cmd_draft(store, args.lead_id, getattr(args, "partner", None))
    elif args.command == "send":
        cmd_send(store, args.lead_id, live=args.live, attachment=getattr(args, "attachment", None))
    elif args.command == "check-inbox":
        cmd_check_inbox(store)
    elif args.command == "stats":
        cmd_stats(store)
    elif args.command == "set-password":
        save_mail_credentials(args.password)
        print("✅ Passord for post@utaktiv.no er trygt lagret lokalt (chmod 600)!")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
