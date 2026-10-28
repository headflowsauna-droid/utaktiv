---
name: utaktiv-partner-outreach
description: >-
  Autonom og semi-autonom partner-outreach for Utaktiv.no. Kartlegger bedrifter (kafeer,
  fjordbadstuer, klatreparker, DNT-hytter), genererer skreddersydde e-postutkast, sender
  fra post@utaktiv.no via mail.utaktiv.no (SMTP SSL:465), og overvåker innboksen (IMAP:993)
  for å koble interesserte partnere direkte med Alexander Robertsen.
---

# Utaktiv Partner Outreach Engine

Denne ferdigheten lar Antigravity administrere og automatisere B2B-partnerskap for Utaktiv.no.
Systemet er bygget med **Human-in-the-loop** for å sikre full kontroll, høy leveringsgrad og null spam.

---

## 🏛️ Arkitektur & Agent-roller

1. **Scout / Researcher Agent:**
   * Kartlegger bedrifter langs populære turruter (Vidden, Stoltzen, Fløyen, Hardanger, osv.).
   * Registrerer bedriftsnavn, kontaktperson, e-post, kategori og anbefalt tilbud.
   * Lagrer prospekter i `docs/data/partner_leads.json`.

2. **Outreach Agent (via `post@utaktiv.no`):**
   * Genererer personlige, ikke-masete e-poster basert på kategori (Badstue, Kafé, Klatrepark, DNT, samt Presse/Aviser).
   * **Presseinnsalg (BA og BT):** Skreddersyr forhåndstips og debattkronikker om «Den Store Norske Skattejakten», stålkisten i Byfjellene («Sveisemester-sitatet»), og annonsering av storpremien når en samarbeidspartner er klar.
   * Fremhever fordelene for bedrifter: Gratis oppføring, sol- og dagslysradar, og at turgåere kan innløse Sol-poeng (1 poeng = 1 kr).
   * Sender via `mail.utaktiv.no:465` over SSL med Alexander Robertsen som avsender.
   * Støtter tørrkjøring (dry-run) som standard for trygg forhåndsvisning.

3. **Innboks-Monitor & Handoff Agent:**
   * Kobler til `mail.utaktiv.no:993` over IMAP SSL.
   * Lytter på innkommende svar til `post@utaktiv.no`.
   * Gjenkjenner svar fra journalister (`@ba.no`, `@bt.no`) og interesserte partnere, og varsler Alexander umiddelbart med kontaktinfo slik at han kan ta over samtalen eller ringe.

---

## 💻 Kjørbare Kommandoer (CLI)

Verktøyet kan kjøres globalt med `utaktiv-partner` (eller `python3 -m scripts.partner_engine.cli`):

```bash
# 1. Se oversikt over alle partnere og presse-leads
utaktiv-partner list

# 2. Se status-statistikk
utaktiv-partner stats

# 3. Generer e-postutkast for bedrift eller avis
utaktiv-partner draft <lead_id> [--partner "Sponsor/Partnernavn"]
# Eksempler:
utaktiv-partner draft ba-tips --partner "Heit Bergen Fjordbadstue"
utaktiv-partner draft bt-debatt --partner "Fløibanen AS"
utaktiv-partner draft heit-bergen

# 4. Test-send (simulert forhåndsvisning / dry-run)
utaktiv-partner send <lead_id>

# 5. Send faktisk e-post fra post@utaktiv.no (LIVE)
utaktiv-partner send <lead_id> --live

# 6. Sjekk innboksen for svar fra bedrifter eller journalister
utaktiv-partner check-inbox

# 7. Lagre passord for post@utaktiv.no sikkert lokalt (chmod 600)
python3 -m scripts.partner_engine.cli set-password <passord>
```

---

## 🔒 Sikkerhet & Retningslinjer (OPSEC)

* **Autentisering:** E-postpassord lagres aldri i git-sporede filer. Det lagres enten som miljøvariabel `UTAKTIV_MAIL_PASSWORD` eller i `~/.utaktiv/mail_creds.json` (chmod 600).
* **Volumbegrensning:** Send maksimalt 5–10 nye partnerhenvendelser per dag for å unngå spam-flagg og sikre høy svarrespons.
* **Alexander som kontaktpunkt:** Alle e-poster avsluttes med:
  * Alexander Robertsen, Grunnlegger Utaktiv.no
  * Tlf: 411 19 608
  * E-post: post@utaktiv.no
  * Lenke: https://utaktiv.no/b2b-onepager.html
