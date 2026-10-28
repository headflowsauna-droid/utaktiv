"""
Utaktiv Partner Outreach Engine - E-postutsender (SMTP SSL :465)
Sender profesjonelle e-poster fra post@utaktiv.no via mail.utaktiv.no.
"""

import os
import json
import smtplib
import email.utils
from email.header import Header
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import Tuple, Optional, List


DEFAULT_CREDS_PATH = Path.home() / ".utaktiv" / "mail_creds.json"
SMTP_SERVER = "mail.utaktiv.no"
SMTP_PORT = 465
DEFAULT_SENDER = "post@utaktiv.no"
DEFAULT_SENDER_NAME = "Alexander Robertsen - Utaktiv"


def get_mail_credentials() -> Tuple[str, Optional[str]]:
    """
    Henter brukernavn og passord for post@utaktiv.no.
    Sjekker miljøvariabler, deretter ~/.utaktiv/mail_creds.json.
    """
    username = os.environ.get("UTAKTIV_MAIL_USER", DEFAULT_SENDER)
    password = os.environ.get("UTAKTIV_MAIL_PASSWORD")

    if not password and DEFAULT_CREDS_PATH.exists():
        try:
            with open(DEFAULT_CREDS_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                username = data.get("username", username)
                password = data.get("password")
        except Exception:
            pass

    return username, password


def save_mail_credentials(password: str, username: str = DEFAULT_SENDER):
    """
    Lagrer e-postpassord sikkert lokalt med begrensede filrettigheter (chmod 600).
    """
    DEFAULT_CREDS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(DEFAULT_CREDS_PATH, "w", encoding="utf-8") as f:
        json.dump({"username": username, "password": password}, f, indent=2)
    os.chmod(DEFAULT_CREDS_PATH, 0o600)


def send_email(
    to_email: str,
    subject: str,
    body_text: str,
    dry_run: bool = False,
    override_password: Optional[str] = None,
    attachments: Optional[List[str]] = None
) -> Tuple[bool, str]:
    """
    Sender en e-post via mail.utaktiv.no:465 over SSL.
    Hvis dry_run=True, simuleres sendingen og e-posten skrives ut.
    Støtter også filvedlegg (attachments) som legges ved meldingen.
    """
    username, password = get_mail_credentials()
    if override_password:
        password = override_password

    if dry_run:
        att_str = f" (m/{len(attachments)} vedlegg)" if attachments else ""
        return True, f"[SIMULERING] E-post til {to_email} klargjort (Emne: '{subject}'){att_str}"

    if not password:
        return False, "Passord for post@utaktiv.no er ikke konfigurert. Sett UTAKTIV_MAIL_PASSWORD eller lagre via CLI."

    try:
        msg = MIMEMultipart("mixed")
        msg["From"] = email.utils.formataddr((str(Header(DEFAULT_SENDER_NAME, "utf-8")), username))
        msg["To"] = to_email
        msg["Subject"] = Header(subject, "utf-8")
        msg["Reply-To"] = username
        msg["Date"] = email.utils.formatdate(localtime=True)
        msg["Message-ID"] = email.utils.make_msgid(domain="utaktiv.no")

        part_text = MIMEText(body_text, "plain", "utf-8")
        msg.attach(part_text)

        # Legg ved eventuelle vedlegg
        if attachments:
            for filepath in attachments:
                p = Path(filepath)
                if not p.exists():
                    continue
                with open(p, "rb") as f:
                    part_file = MIMEBase("application", "octet-stream")
                    part_file.set_payload(f.read())
                encoders.encode_base64(part_file)
                part_file.add_header(
                    "Content-Disposition",
                    f'attachment; filename="{p.name}"'
                )
                msg.attach(part_file)

        # Koble til SMTP over SSL
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=20) as server:
            server.login(username, password)
            server.send_message(msg)

        return True, f"Sendt til {to_email}"
    except smtplib.SMTPAuthenticationError:
        return False, "Autentiseringsfeil mot mail.utaktiv.no: Kontroller passordet."
    except Exception as e:
        return False, f"Feil ved sending: {str(e)}"
