---
name: utaktiv-social-agent
description: >-
  Autonom og semi-autonom SoMe-markedsføringsagent for Utaktiv.no. Kontrollerer
  og koordinerer X (Twitter), LinkedIn og TikTok. Genererer plattformoptimerte innlegg,
  knytter Google Flow-videoer (Veo 3.1 & Omni 1.1 Flash) til virale kampanjer, administrerer
  godkjenningskøen, og publiserer med dry-run eller live API-integrasjon.
---

# Utaktiv Social Media Agent

Denne ferdigheten lar Antigravity og Alexander drifte en helhetlig, skalerbar SoMe-markedsføringsmotor for Utaktiv.no.
Agenten har full kontroll over:
* **TikTok:** Korte 9:16 vertikale videoer, sterke hooks på under 2 sekunder, gamification («Finn skattekisten i Byfjellene»), konkurranse om opphold i Space Capsule 2027.
* **X (Twitter):** Tech- og indie-hacker-perspektiv (#buildinpublic), arkitektur, sanntids dagslysdata fra MET Norway, bruk av Google Flow / Omni 1.1 Flash, engasjerende tråder.
* **LinkedIn:** B2B, folkehelse, pedagogikk, skjermfri tid for barnefamilier, og partnerskap med lokale reiselivsaktører (fjordbadstuer, fjellstuer, Tiny Dome Retreats).

---

## 🏛️ Arkitektur & Agent-arbeidsflyt

```
[Google Flow AI Studio] (Veo 3.1 / Omni 1.1 Flash 9:16 videoer)
       │
       ▼
[Content Generator] (scripts/social_engine/generator.py)
       │
       ▼
[Social Store / Queue] (docs/data/social_posts.json)
       │
       ├──> [Review / Approval] (Human-in-the-loop / Alexander godkjenner)
       │
       ▼
[Platform Clients] (Dry-run test eller Live API-utsending)
       ├── X API v2 (Tweets & Threads)
       ├── LinkedIn API (Artikler & B2B oppdateringer)
       └── TikTok Creator API (9:16 videoer, captions & hashtags)
```

---

## 💻 Kjørbare Kommandoer (CLI)

Kjør verktøyet direkte med `python3 -m scripts.social_engine.cli`:

```bash
# 1. Se oversikt over køen og statuser
python3 -m scripts.social_engine.cli list

# 2. Generer nye poster basert på videokonsepter (f.eks. 'skattekiste-fjell' eller 'space-capsule-2027')
python3 -m scripts.social_engine.cli generate skattekiste-fjell
python3 -m scripts.social_engine.cli generate space-capsule-2027

# 3. Forhåndsvis en bestemt post (tekst, video-brief, hashtags, CTA)
python3 -m scripts.social_engine.cli preview <post_id>

# 4. Godkjenn en post for publisering
python3 -m scripts.social_engine.cli approve <post_id>

# 5. Test-publiser en post (trygg simulering / dry-run)
python3 -m scripts.social_engine.cli publish <post_id>

# 6. Publiser LIVE til det faktiske sosiale mediet
python3 -m scripts.social_engine.cli publish <post_id> --live

# 7. Publiser alle godkjente poster i køen (batch)
python3 -m scripts.social_engine.cli publish-approved --live

# 8. Sjekk status på tilkoblinger og nøkler
python3 -m scripts.social_engine.cli status

# 9. Sett API-nøkler sikkert (lagres i ~/.utaktiv/social_creds.json med chmod 600)
python3 -m scripts.social_engine.cli set-credentials x api_key=XXX access_token=YYY
python3 -m scripts.social_engine.cli set-credentials linkedin access_token=ZZZ author_urn=urn:li:person:123
python3 -m scripts.social_engine.cli set-credentials tiktok access_token=AAA username=utaktiv
```

---

## 🔒 OPSEC & Sikkerhet

* **Sikker lagring:** Nøkler lagres aldri i versjonskontrollert kode. De lagres enten som miljøvariabler eller i `~/.utaktiv/social_creds.json` (chmod 600).
* **Godkjenningsvern (Human-in-the-loop):** Ingen poster sendes live med mindre de enten er eksplisitt godkjent med `approve`, eller kjøres med `--force`.
