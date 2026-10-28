# Teknisk Rapport: Pakke- og Distribusjonsanalyse for Utaktiv (`utaktiv-web.zip`)

**Rolle:** Teamwork Explorer Instance 2 (Milestone 1, Iterasjon 2 — Audit Remediation: Packaging & Assets)  
**Dato:** 2026-10-27T15:30:00Z  
**Status:** Fullført  

---

## 1. Executive Summary

En fullstendig rettsmedisinsk inspeksjon av `/Users/alexr/Desktop/utaktiv-web.zip` og `/Users/alexr/Projects/Sol-Uteliv/utaktiv-web.zip` mot det reelle produksjonsbygget i `dist/` har avdekket følgende:

1. **Akkumulering av zombiefiler (3,14 MB unødvendig oppblåsing):**
   Både skrivebords-zipen og prosjekt-zipen inneholder **36 oppføringer (8 598 170 bytes ukomprimert, 4,9 MB komprimert)**, mens et rent bygg i `dist/` kun inneholder **25 filer og 3 mapper (5 453 657 bytes ukomprimert, 4,1 MB komprimert)**.
   Årsaken er at tidligere pakkeoperasjoner kjørte `zip -r` mot en allerede eksisterende arkivfil. Standard `zip` sletter **aldri** filer som har forsvunnet fra kildemappen. Vite genererer nye hash-navn for hvert bygg (`index-[hash].js` og `index-[hash].css`). Dermed har 8 foreldede JS- og CSS-filer fra tidligere iterasjoner blitt liggende igjen i arkivet.

2. **Integritet av nødvendige produksjonsressurser i `dist/`:**
   Alle påkrevde komponenter eksisterer og overføres korrekt fra `public/` og Vite-kompilatoren til `dist/`:
   - `.htaccess` (1 023 bytes): Apache SPA-omskriving (`RewriteRule ^ index.html [L]`), MET-proxy og Cache-Control.
   - `Utaktiv.apk` (2 907 727 bytes): Android APK for offline/mobil distribusjon.
   - `api/` (3 PHP-skript: `vipps.php`, `chat.php`, `met.php`): Server-side proxyer og autentiseringsflyt.
   - `assets/` (7 aktive filer): Hovedbunt (`index-EmlNWFgW.js` og `index-BVtnOD9r.css`) + 5 oppdelte vendor-bunter.
   - PWA & Branding: `manifest.webmanifest`, `sw.js`, `icons/` (5 ikoner), `og-image.png` (1200x630) og `alexander-robertsen.jpg`.

3. **Autoritativt brukerdirektiv for hjemskjerm og knapper:**
   Per Alexanders eksplisitte instruks («du skulle ta vekk de tre knappene på skattejakten») og Sentinel/Orchestrator-direktiv, skal `src/App.tsx:705-712` opprettholde **én ren knapp** («Åpne Skattekisten 🔓»). Snarveier til «🌲 Familieeventyret (Lys-speideren)» og «📸 AR Sol-kamera» leveres direkte inne i `SkattekisteModal` (linje 1328–1335) og via URL-parametere (`?eventyr=1`). Bygget og testpakken (27 suiter, 228 tester) er 100 % grønne og samsvarer med dette direktivet.

4. **Deterministisk pakkeprosedyre:**
   For å eliminere zombiefilene og garantere at nye bundler reflekteres uten forurensning, må arkivfilene slettes før ny pakking utføres med `zip -r -9` fra innsiden av `dist/`.

---

## 2. Arkitektur og Filstruktur i `dist/` vs. Eksisterende `utaktiv-web.zip`

### 2.1 Ren kildestruktur i `dist/` (25 filer, 5,45 MB)

Følgende 25 filer utgjør det autoritative produksjonsinnholdet i `dist/`:

| Filsti i `dist/` | Størrelse (bytes) | Formål og kilde |
|---|---|---|
| `.htaccess` | 1 023 | Apache SPA-fallback, HTTPS-tvinging, MIME-typer, Cache-Control (fra `public/.htaccess`) |
| `Utaktiv.apk` | 2 907 727 | Android mobilapp for direkte nedlasting (fra `public/Utaktiv.apk`) |
| `alexander-robertsen.jpg` | 352 495 | Forfatter- og pedagogprofilbilde (fra `public/alexander-robertsen.jpg`) |
| `api/chat.php` | 9 933 | AI Concierge proxy (Gemini 3.8 Flash + OpenAI fallback) |
| `api/met.php` | 1 922 | MET Norway værvarsel-proxy med User-Agent injection |
| `api/vipps.php` | 10 600 | Vipps MobilePay ePayment v1 & Login API v2.0 OAuth flow |
| `assets/data-catalog-BEH2KH2J.js` | 120 932 | Turbase- og aktivitetskatalog (Vite manualChunk) |
| `assets/index-BVtnOD9r.css` | 128 436 | **Aktiv produksjons-CSS** (referert i `dist/index.html`) |
| `assets/index-EmlNWFgW.js` | 667 604 | **Aktiv hovedapplikasjon** (referert i `dist/index.html`) |
| `assets/vendor-icons-BGNh5_WS.js` | 40 227 | Lucide React ikoner (Vite manualChunk) |
| `assets/vendor-leaflet-QIRF8vNb.js` | 149 660 | Leaflet kartmotor (Vite manualChunk) |
| `assets/vendor-react-B6PVxcRJ.js` | 143 446 | React 18 & ReactDOM (Vite manualChunk) |
| `assets/vendor-supabase-Di5kojRX.js` | 176 875 | Supabase klientbibliotek (Vite manualChunk) |
| `b2b-onepager.html` | 7 844 | Frittstående B2B partnerpresentasjon (fra `public/b2b-onepager.html`) |
| `icons/Utaktiv-Vipps-Logo.png` | 66 825 | Vipps merkevareikon (fra `public/icons/`) |
| `icons/apple-touch-icon.png` | 25 945 | iOS hjemskjermikon (fra `public/icons/`) |
| `icons/icon-192.png` | 27 733 | PWA 192x192 ikon (fra `public/icons/`) |
| `icons/icon-512.png` | 84 606 | PWA 512x512 ikon (fra `public/icons/`) |
| `icons/utaktiv-logo.png` | 145 636 | Utaktiv primærlogo (fra `public/icons/`) |
| `index.html` | 3 438 | SPA HTML-inngangspunkt med OpenGraph & meta-tags |
| `manifest.webmanifest` | 573 | PWA manifest-fil (fra `public/manifest.webmanifest`) |
| `og-image.png` | 87 506 | 1200x630 px OpenGraph / Twitter bilde (fra `public/og-image.png`) |
| `sw.js` | 1 399 | Service worker for offline caching (fra `public/sw.js`) |
| `utaktiv-logo.png` | 145 636 | Favicon/logo i rot (fra `public/utaktiv-logo.png`) |
| `utaktiv-sol-logo.png` | 145 636 | Sol-logo i rot (fra `public/utaktiv-sol-logo.png`) |

**Totalt ukomprimert i rent bygg:** 5 453 657 bytes.  
**Komprimert zip-størrelse:** ~4,1 MB (4 196 419 bytes).

---

### 2.2 Zombiefiler identifisert i nåværende `utaktiv-web.zip` (36 filer, 8,60 MB)

I de eksisterende zip-filene på Desktop og i prosjektet ligger følgende 8 utdaterte filer fra tidligere bygg, som **ikke** finnes i `dist/` eller refereres av `dist/index.html`:

| Zombie-fil i eksisterende zip | Størrelse (bytes) | Status / Årsak |
|---|---|---|
| `assets/index-DBAWH6me.css` | 127 711 | Foreldet CSS fra et tidligere bygg |
| `assets/index-3-AKMjf6.js` | 638 707 | Foreldet JS-bunt |
| `assets/index-DJeJTpWR.css` | 128 948 | Foreldet CSS |
| `assets/index-CV5KP5hr.js` | 664 643 | Foreldet JS-bunt |
| `assets/index-Bu0x_km_.js` | 663 319 | Foreldet JS-bunt |
| `assets/index-BALxsn7N.css` | 127 674 | Foreldet CSS |
| `assets/index-BsURHdk6.css` | 127 809 | Foreldet CSS |
| `assets/index-uyRKykbi.js` | 665 702 | Foreldet JS-bunt |

**Sum zombiefiler:** 3 144 513 bytes (3,14 MB ukomprimert).  
Når disse legges til de reelle 5 453 657 bytes, gir det nøyaktig **8 598 170 bytes**, som tilsvarer nøyaktig den ukomprimerte størrelsen i nåværende zip.

---

## 3. Analyse av kritiske distribusjonskomponenter

### 3.1 `.htaccess`
Filen `.htaccess` må ligge i roten av `utaktiv-web.zip` (slik at den havner direkte i cPanels `public_html/`). Den utfører 4 kritiske oppgaver:
1. **HTTPS-tvang:** Kreves for Geolocation API, Service Worker og PWA-installasjon.
2. **MET API-proxy:** `RewriteRule ^api/met/(.*)$ api/met.php?path=$1 [QSA,L]` ruter værforespørsler via PHP med påkrevd `User-Agent`.
3. **SPA Fallback:** `RewriteCond %{REQUEST_FILENAME} !-f ... RewriteRule ^ index.html [L]` sikrer at dyp-lenker og ruter (f.eks. `/auth/callback`) håndteres av React-ruteren.
4. **Cache-Control & MIME:**
   - `sw.js` og `index.html`: `no-cache, max-age=0` (slik at oppdateringer registreres umiddelbart).
   - Bundles med hash: `public, max-age=31536000, immutable`.
   - MIME-typer for `.webmanifest` og `.apk`.

*Merk:* Ved kjøring av `zip` må dotfiler håndteres korrekt. En naiv `zip -r zipfile *` vil i bash/zsh hoppe over `.htaccess` fordi stjernen normalt ikke ekspanderer skjulte filer. Å kjøre `zip -r zipfile .` fra innsiden av `dist/` fanger derimot opp `.htaccess` deterministisk.

### 3.2 `Utaktiv.apk`
Filen `Utaktiv.apk` (2 907 727 bytes) ligger i `public/Utaktiv.apk` og kopieres automatisk til `dist/Utaktiv.apk` ved `vite build`. Den må inkluderes i zip-pakken slik at mobilbrukere og felttestere kan laste ned Android-appen direkte fra `https://utaktiv.no/Utaktiv.apk`.

### 3.3 `api/` Katalogen
Inneholder 3 backend PHP-skript:
- `api/vipps.php`: Håndterer Vipps MobilePay testmiljø/live proxy, token-veksling og OAuth-innlogging.
- `api/chat.php`: AI-assistentproxy som kaller Gemini 3.8 Flash eller OpenAI via sikre miljøvariabler på cPanel.
- `api/met.php`: Proxy for Meteorologisk institutt (api.met.no).

---

## 4. Den eksakte, rene pakkeprosedyren for Worker

For å sikre at ingen gamle bunter akkumuleres, må Worker følge denne deterministiske sekvensen:

```bash
# 1. Bygg prosjektet (kjører tsc og vite build)
npm run build

# 2. Slett eksisterende zip-arkiver for å forhindre zip-u / in-place sammenslåing
rm -f /Users/alexr/Desktop/utaktiv-web.zip /Users/alexr/Projects/Sol-Uteliv/utaktiv-web.zip

# 3. Pakk rent fra innsiden av dist/
# '.' inkluderer .htaccess; -x ekskluderer eventuelle .DS_Store og macOS-metadata
(cd /Users/alexr/Projects/Sol-Uteliv/dist && zip -r -9 /Users/alexr/Projects/Sol-Uteliv/utaktiv-web.zip . -x "*.DS_Store" -x "__MACOSX*")

# 4. Speile den rene pakken til Skrivebordet
cp /Users/alexr/Projects/Sol-Uteliv/utaktiv-web.zip /Users/alexr/Desktop/utaktiv-web.zip
```

---

## 5. Automatisk Verifikasjonssjekkliste for Handoff / Auditor

| Sjekk | Kommando | Forventet resultat |
|---|---|---|
| **1. Oppføringstall** | `unzip -l /Users/alexr/Desktop/utaktiv-web.zip \| tail -n 1` | Nøyaktig **28 files** (25 filer + 3 mapper) |
| **2. Uncompressed Size** | `unzip -l /Users/alexr/Desktop/utaktiv-web.zip \| tail -n 1` | Ca. **5 453 657 bytes** (ikke 8,6 MB) |
| **3. .htaccess tilstede** | `unzip -l /Users/alexr/Desktop/utaktiv-web.zip \| grep -F '.htaccess'` | 1 oppføring: `.htaccess` (1 023 bytes) |
| **4. Utaktiv.apk tilstede** | `unzip -l /Users/alexr/Desktop/utaktiv-web.zip \| grep -F 'Utaktiv.apk'` | 1 oppføring: `Utaktiv.apk` (2 907 727 bytes) |
| **5. api/ skript tilstede** | `unzip -l /Users/alexr/Desktop/utaktiv-web.zip \| grep -F 'api/'` | 3 skript: `chat.php`, `met.php`, `vipps.php` |
| **6. Ingen zombiefiler** | `unzip -l /Users/alexr/Desktop/utaktiv-web.zip \| grep -E 'assets/index-.*\.js$'` | Kun **1** linje (den aktive `index-[hash].js`) |
| **7. Hash-overensstemmelse** | `unzip -p /Users/alexr/Desktop/utaktiv-web.zip index.html \| grep -o 'assets/index-[^"]*\.js'` | Nøyaktig samme hash som filen i `assets/` |
| **8. MD5-paritet** | `md5 /Users/alexr/Desktop/utaktiv-web.zip /Users/alexr/Projects/Sol-Uteliv/utaktiv-web.zip` | Identiske MD5-sjekksummer |
