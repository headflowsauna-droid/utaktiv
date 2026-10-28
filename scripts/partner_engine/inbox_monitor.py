"""
Utaktiv Partner Outreach Engine - Innboks-monitor (IMAP SSL :993)
Lytter på innkommende e-poster til post@utaktiv.no, kobler dem mot partnere,
og varsler når en bedrift er interessert i et samarbeid!
"""

import imaplib
import email
import json
from pathlib import Path
from email.header import decode_header
from typing import List, Dict, Any, Tuple
from .mailer import get_mail_credentials, SMTP_SERVER
from .models import LeadStatus
from .store import PartnerStore


IMAP_SERVER = "mail.utaktiv.no"
IMAP_PORT = 993
PROCESSED_FILE = Path(__file__).resolve().parent.parent.parent / "docs" / "data" / "processed_emails.json"


def _get_processed_ids() -> set:
    if PROCESSED_FILE.exists():
        try:
            with open(PROCESSED_FILE, "r", encoding="utf-8") as f:
                return set(json.load(f))
        except Exception:
            return set()
    return set()


def _save_processed_id(msg_id: str):
    ids = _get_processed_ids()
    ids.add(msg_id)
    PROCESSED_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PROCESSED_FILE, "w", encoding="utf-8") as f:
        json.dump(list(ids), f, indent=2)


def _clean_header(header_val: str) -> str:
    if not header_val:
        return ""
    decoded_parts = decode_header(header_val)
    out = []
    for part, enc in decoded_parts:
        if isinstance(part, bytes):
            out.append(part.decode(enc or "utf-8", errors="replace"))
        else:
            out.append(str(part))
    return "".join(out)


def _extract_body(msg: email.message.Message) -> str:
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            cdisp = str(part.get("Content-Disposition"))
            if ctype == "text/plain" and "attachment" not in cdisp:
                payload = part.get_payload(decode=True)
                if payload:
                    body += payload.decode("utf-8", errors="replace")
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            body = payload.decode("utf-8", errors="replace")
    return body.strip()


def check_inbox(store: PartnerStore, mark_as_read: bool = False) -> Tuple[bool, List[Dict[str, Any]], str]:
    """
    Sjekker innboksen for uleste e-poster og matcher med våre leads.
    Returnerer (success, matched_replies, message).
    """
    username, password = get_mail_credentials()
    if not password:
        return False, [], "Passord for post@utaktiv.no mangler. Sett UTAKTIV_MAIL_PASSWORD."

    matched_replies: List[Dict[str, Any]] = []

    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT, timeout=15)
        mail.login(username, password)
        mail.select("INBOX")

        # Søk etter meldinger (siste 30) for å fange opp svar selv om mail-klient på Mac har lest dem
        status, data = mail.search(None, "ALL")
        if status != "OK" or not data or not data[0]:
            mail.logout()
            return True, [], "Ingen meldinger funnet i innboksen."

        email_ids = data[0].split()
        recent_ids = email_ids[-30:] if len(email_ids) > 30 else email_ids
        processed = _get_processed_ids()

        for eid in recent_ids:
            res, msg_data = mail.fetch(eid, "(BODY.PEEK[])")
            if res != "OK":
                continue

            raw_email = msg_data[0][1]
            msg = email.message_from_bytes(raw_email)

            msg_id = msg.get("Message-ID", f"eid_{eid.decode()}")
            if msg_id in processed:
                continue

            from_hdr = _clean_header(msg.get("From", ""))
            subject = _clean_header(msg.get("Subject", ""))
            date_hdr = _clean_header(msg.get("Date", ""))
            body = _extract_body(msg)

            # Ignorer cPanel systemnotifikasjoner
            if "cpanel@" in from_hdr.lower():
                _save_processed_id(msg_id)
                continue

            # Håndter bounce / leveringsfeil (MAILER-DAEMON)
            is_bounce = any(b in from_hdr.lower() for b in ["mailer-daemon", "postmaster"]) or any(b in subject.lower() for b in ["undelivered", "delivery status notification", "failure"])
            if is_bounce:
                # Finn hvilken e-post som feilet i bodyen
                for l in store.load_all():
                    if l.email.strip().lower() in body.lower():
                        l.add_history("bounce", f"Leveringsfeil: E-postadressen {l.email} ble avvist av mottakerserveren.")
                        store.update(l)
                _save_processed_id(msg_id)
                continue

            # Finn avsenders rene e-postadresse
            sender_email = email.utils.parseaddr(from_hdr)[1].strip().lower()

            # Søk opp lead i vår database
            lead = store.find_by_email(sender_email)
            if not lead:
                # Sjekk også om bedriftsnavn eller deler av e-post er nevnt
                for l in store.load_all():
                    if l.email.strip().lower() in from_hdr.lower() or l.business_name.lower() in from_hdr.lower():
                        lead = l
                        break

            # Hvis henvendelsen er fra presse (@ba.no, @bt.no, @vg.no, @nettavisen.no, @aftenposten.no), koble mot relevant presse-lead
            if not lead:
                if "ba.no" in sender_email:
                    lead = store.get("ba-debatt")
                elif "bt.no" in sender_email:
                    lead = store.get("bt-debatt")
                elif "vg.no" in sender_email:
                    lead = store.get("vg-debatt")

            # AI/Regel-basert klassifisering av respons
            body_lower = body.lower()
            is_declined = any(phrase in body_lower for phrase in [
                "ikke interessert", "passer ikke", "må takke nei", "avslår", "uaktuelt", "stopp",
                "ikke kapasitet", "må si nei", "takker nei"
            ])
            is_positive = any(word in body_lower for word in [
                "ja", "møte", "kaffe", "gjerne", "høre mer", "spennende", "interessert",
                "ring", "avtale", "god idé", "velkommen", "passer", "ta en prat"
            ]) and not is_declined

            is_media = any(dom in sender_email for dom in ["ba.no", "bt.no", "vg.no", "nettavisen.no", "aftenposten.no", "klassekampen.no"])
            if is_media and not is_declined:
                is_positive = True

            reply_info = {
                "from": from_hdr,
                "email": sender_email,
                "subject": subject,
                "date": date_hdr,
                "body_snippet": body[:250],
                "lead_id": lead.id if lead else None,
                "lead_name": lead.business_name if lead else None,
                "is_positive": is_positive,
                "is_media": is_media,
            }

            if lead:
                if is_media:
                    if is_declined:
                        lead.status = LeadStatus.REPLIED_DECLINED
                        lead.add_history("media_reply", f"Avisen takket nei / kapasitet: '{subject}'")
                    else:
                        lead.status = LeadStatus.REPLIED_INTERESTED
                        lead.add_history("media_reply", f"🚨 AVISEN HAR SVART: '{subject}'! Alexander må ringe redaksjonen umiddelbart.")
                elif is_declined:
                    lead.status = LeadStatus.REPLIED_DECLINED
                    lead.add_history("reply_received", f"Bedrift takket nei: '{subject}'")
                elif is_positive:
                    lead.status = LeadStatus.REPLIED_INTERESTED
                    lead.add_history("reply_received", f"POSITIV RESPONS: '{subject}'! Alexander varslet.")
                else:
                    lead.status = LeadStatus.REPLIED_QUESTION
                    lead.add_history("reply_received", f"Mottatt svar/spørsmål: '{subject}'")

                store.update(lead)

            matched_replies.append(reply_info)
            _save_processed_id(msg_id)

        mail.logout()
        return True, matched_replies, f"Sjekket innboks: Fant {len(matched_replies)} nye meldinger."
    except Exception as e:
        return False, [], f"Feil ved oppkobling mot IMAP ({IMAP_SERVER}): {str(e)}"
