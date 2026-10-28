# Utaktiv ☀️ — AI-drevet Dagslys- og Opplevelses-Concierge

> **Appen som motiverer folk og barnefamilier til å gå ut i dagslyset — ved å matche personlige interesser, musikk og populære opplevelser med solens rytme.**

Dette prosjektet er en del av Alexanders økosystem for bevissthet, helse og livskvalitet. Det er tilrettelagt for at flere AI-modeller (Antigravity, Kimi, Grok, Claude, Cursor) kan samarbeide friksjonsfritt i samme kodebase.

---

## 1. Visjon & Filosofi

Folk går sjelden ut bare for å «fylle en kvote med 10 000 luks». De går ut fordi:
* Favorittartisten (f.eks. Jason Mraz) har utendørskonsert.
* Det er et spennende barneshow eller skattejakt på Fløyen.
* En uteservering med fantastisk utsikt og gode anmeldelser har sol akkurat nå.
* En skogssti passer akkurat til alderen på barna og familiens tidsvindu.

**Utaktiv snur dørstokkmila på hodet:**
I stedet for å mase om helse, serverer appen uimotståelige opplevelser og aktiviteter skreddersydd til familien. Solen, d-vitaminet, dopaminet og den dype nattesøvnen kommer som en naturlig biologisk gevinst.

---

## 2. Nøkkelfunksjoner

1. **Intelligent Familie- & Brukerprofilering:**
   * Kartlegger navn, bosted/kommune, transportform.
   * Flokken: Antall barn og alder (automatisk tilpasning: vognvennlig for 2-åring vs. klatring og action for 7-åring).
   * Smak: Musikkpreferanser (artister, sjangre), kulturinteresser, friluftsaktiviteter.
2. **VisualActivityCard («Bilde-Først» magasinkort):**
   * Multi-bildekarusell (natur og utsikt, kafé- og pausestopp, fjordbadstue).
   * Direkte integrert Opplett-stempel («☀️ Solvindu kl. 11:30–14:00» / «🌦️ Gå ut etter kl. 13:00 (opplett)»).
   * Visuelle forhåndsbooking-chips (+ Skillingsbolle, + Heit Fjordbadstue) for lokal mat og velvære.
   * Utfoldbar «Detaljer & Trygghet»-skuff for underlag, hvilebenker og toaletter.
3. **Sanntids Tur-kurv & Rutebygger (`useTurKurv`, `TurBuilderModal`):**
   * Rutebygger som lar brukere sette sammen hele dagsutflukter med flere stopp.
   * Geografisk tilpassede opplevelses-tillegg via `getRouteAddonCardsForCity` (f.eks. «Gratis badstue ved fjorden» eksklusivt for Eidfjord; «Varm suppe & surdeigsbrød» og fjordbadstuer for Bergen og øvrige byer).
   * Automatisk kostnadsoppsummering, tidsplan og direkte delbare rute-lenker (`encodeTurSharePayload`) via SMS/WhatsApp.
4. **Solsøker, Opplett-radar & Værsynk (MET Norway):**
   * Beregner solhøyde, luks-estimat og sanntids skydekke.
   * Finner «solluker» i gråværet: *«Skydekket bryter opp over Fløyen kl. 13:15 – utekonserten blir i sol!»*
5. **Sol-Concierge AI Chat:**
   * En empatisk, personlig rådgiver som kjenner familien og gir konkrete, umiddelbare turforslag basert på ledig tid og humør.
6. **B2B Partnersamarbeid & Samfunnsbidrag:**
   * Nullrisikomodell for lokale kafeer, bakerier og badstuer langs rutene.
   * Forankret i Alexanders visjon om å gi Utaktiv tilbake til samfunnet og folkehelsen.

---

## 3. Prosjektstruktur

```
Sol-Uteliv/
├── README.md               # Prosjektoversikt og hurtigstart
├── AGENTER.md              # Retningslinjer for AI-agenter (Kimi, Grok, Antigravity)
├── SPEC-ARKITEKTUR.md      # Teknisk arkitektur, datamodeller og scraper-spesifikasjon
├── package.json            # Avhengigheter (React, Vite, Tailwind, Vitest, Lucide)
├── src/
│   ├── components/         # Gjenbrukbare UI-komponenter (Dark mode, glassmorphism)
│   │   ├── OnboardingModal.tsx # Profilering av familie, barn og musikk
│   │   ├── ActivityFeed.tsx    # Konserter, TripAdvisor-perler og show
│   │   ├── SunRadar.tsx        # Sanntids solhøyde og skydekke (MET Norway)
│   │   ├── ConciergeChat.tsx   # AI-agent chat for personlige anbefalinger
│   │   ├── SettingsModal.tsx   # Innstillinger (⚙️ nede i venstre hjørne)
│   │   └── SplashScreen.tsx    # Animert mørk splash screen ved oppstart
│   ├── engine/             # Ren TypeScript forretningslogikk (100% testet)
│   │   ├── profile.ts      # Bruker- og familiematriser
│   │   ├── activities.ts   # Aktivitetsmatching og TripAdvisor/konsert-parser
│   │   ├── solar.ts        # Astronomisk solhøyde og luks-beregninger
│   │   └── recommender.ts  # Concierge-anbefalingsmotor
│   ├── test/               # Enhetstester (Vitest)
│   └── App.tsx             # Hovedskjerm
```

---

## 4. Hurtigstart for Utviklere & LLM-er

```bash
# Installer avhengigheter
npm install

# Kjør enhetstester
npm test

# Start lokal utviklingsserver
npm run dev
```

Applikasjonen kjører på `http://localhost:5173` (eller port konfigurert av Vite).
Designet følger Alexanders strikte preferanser: mørk grafitt (`#141311`), `zinc-950/900`, sol-oransje aksent (`#E8622C`), og null unødvendig støy.
