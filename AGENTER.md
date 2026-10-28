# Instrukser for AI-Agenter (Kimi, Grok, Antigravity, Claude)

Velkommen til **Utaktiv**! Du jobber for Alexander. For at samarbeidet mellom ulike AI-modeller skal være 100 % sømløst og konfliktfritt, gjelder følgende ufravikelige prinsipper:

---

## 1. Alexanders Strikte Regler (Fra læringslogg)

1. **Strict Feature Retention (Aldri slett uten å spørre):**
   * Ved oppdateringer eller refaktoriseringer er det **strengt forbudt å slette eksisterende funksjonalitet**, lyttere, komponenter eller docstrings.
   * Bygg alltid videre på eksisterende kode. Gjør utvidelser bakoverkompatible.
2. **Zero AI-Boilerplate (Ren tekst-regel):**
   * Unngå unødvendig fjas, pompøse fraser, tomme klisjeer og overdreven emoji-bruk i kode og generert tekst.
   * Skriv kvasse, presise, pedagogisk forankrede setninger på naturlig norsk.
3. **Mørk Modus & UI-standard:**
   * Hovedbakgrunn: `#141311` (grafitt / brent fjell) og `bg-zinc-950` / `bg-zinc-900`.
   * Aksenter: Sol-oransje (`#E8622C`), smaragdgrønn (`#10B981`), og myk rav/gyllen.
   * Animert Splash Screen ved oppstart.
   * Innstillinger skal **alltid** være et tannhjul (⚙️) nede i venstre hjørne og åpne en modal/overlay – aldri tømme skjermen for kontekst.
4. **Test-first & Verifisering:**
   * Alle forretningsregler i `src/engine/` skal ha tilhørende enhetstester i `src/test/`.
   * Kjør alltid `npm test` før du markerer en oppgave som fullført.

---

## 2. Prosjektets Ansvarsområder & Moduler

| Modul | Filsti | Hensikt |
| :--- | :--- | :--- |
| **Profil-motor** | `src/engine/profile.ts` | Håndterer bruker- og familieprofil, barnegrupper, musikk og interesser |
| **Aktivitets- & Konsertmotor** | `src/engine/activities.ts` | Aggregering av konserter, TripAdvisor-perler, utearrangementer og shows |
| **Sol- & Værmotor** | `src/engine/solar.ts` | Solhøydeberegning, luks-estimat og MET Norway skydekkekobling |
| **Concierge-motor** | `src/engine/recommender.ts` | Matcher familieprofil mot aktiviteter og solforhold for dagsaktuelle anbefalinger |
| **Partner Outreach Engine** | `scripts/partner_engine/` | Autonom og semi-autonom B2B-outreach mot sponsorer og presse |
| **Social Media Marketing Agent** | `scripts/social_engine/` | Autonom styring, generering og publisering til X, LinkedIn og TikTok |
| **Frontend** | `src/` | Vite + React + Tailwind + Lucide applikasjon |

---

## 3. Retningslinjer for Andre LLM-er (Kimi / Grok)

* **Git / Kodeendringer:**
  * Hvis du legger til nye funksjoner (f.eks. en ny scraper eller en ny UI-fane), legg til tester og oppdater `README.md` og `SPEC-ARKITEKTUR.md`.
* **Samarbeid med Kimi:**
  * Hvis Kimi jobber via CLI eller scripts, skal statusoppdateringer og oppgaver loggføres i `_SAMARBEID/OPPGAVER.md` dersom prosjektet koordineres overordnet.
* **Ingen eksterne hemmeligheter i git:**
  * Bruk miljøvariabler (`.env.local`) for API-nøkler (Spotify, Ticketmaster, OpenWeather, etc.).
