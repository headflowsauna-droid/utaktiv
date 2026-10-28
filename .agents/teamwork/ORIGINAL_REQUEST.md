# Original User Request

## Initial Request — 2026-10-27T14:30:35Z

Bygge og videreutvikle Utaktiv Soljakten og Skattejakten: Et asymmetrisk samarbeidsspill for barnefamilier der femåringen er helten («Lys-speideren»), med Askeladd-sekk («Jeg fant, jeg fant!»), 10 snakkende fabeldyr, 12 måneders Asbjørnsen & Moe-eventyr og finale i Eidfjord for 1/12 Tinydome Spacecapsule (95 000 kr).

Working directory: /Users/alexr/Projects/Sol-Uteliv

## Requirements

### R1. Asymmetrisk Familie-samarbeid og Askeladd-sekken
Spillet skal kreve at barnet observerer unike natursymboler eller bruker samlede dingser i sekken (elvestein, einerkvist, krystallflis), mens den voksne må spørre barnet for å løse gåten. Avsluttes med felles 3-sekunders berøringsfusjon.

### R2. 10 Snakkende Skogsdyr og Månedseventyr
10 dyr langs stien med distinkte personligheter, lydfrekvenser og offline dialoger, samt årshjul med 12 Asbjørnsen & Moe-eventyr som rullerer månedlig.

### R3. Vanntett Enhetsøkonomi & Familiepott
Maksimum 15 mynter sanket på stien per familietur, 30 kr fullføringsbonus til Familiepotten (totalt maks 45 kr per tur) med deterministisk dato-låst idempotens, 0 % saunarabatt og 100 % partner-finansierte gaver.

## Acceptance Criteria

### Funksjonell Verifisering
- [x] 188 av 188 automatiserte tester grønne over 25 testsuiter (`vitest run`).
- [x] TypeScript-kompilering og Vite-produksjonsbygging fullføres feilfritt.
- [x] Produksjonspakke `/Users/alexr/Desktop/utaktiv-web.zip` (4.3 MB) oppdatert med nye moduler.
- [ ] Felttesting med 3-5 barnefamilier i Byfjellene i Bergen.

## Brukerdirektiver & Justeringer (2026-10-27T15:42:16Z)
- **UI-direktiv fra Alexander (brukeren)**: «du skulle ta vekk de tre knappene på skattejakten».
  De tre knappene på Skattejakten-banneret i `src/App.tsx` skal IKKE ligge på forsiden, men erstattes av én enkelt fokusert knapp: «Åpne Skattekisten 🔓». Familieeventyret og AR-kamera er lagt som direkte snarveier innad i `SkattekisteModal` (og via `?eventyr=1`). Dette er et autoritativt brukerkrav som overstyrer enhver tidligere intern plan om en 3-knappers gruppe på forsiden.


## Follow-up — 2026-10-27T15:25:29Z

VIKTIG KORREKSJON OG BRUKERDIREKTIV TIL ORCHESTRATOR OG VICTORY AUDITOR:

1. **Brukerkravet overstyrer intern spec**: 
   Brukeren (Alexander) har etter testing eksplisitt gitt følgende bindende ordre:
   «du skulle ta vekk de tre knappene på skattejakten»
   Han har lastet opp skjermbilde fra utaktiv.no der de tre knappene forstyrret banneret.

2. **Gjeldende autoritativ status i koden**:
   - `src/App.tsx` skal ha og HAR KUN én ren knapp: «Åpne Skattekisten 🔓». Den skal IKKE endres tilbake til 3 knapper.
   - Snarveier til «Familieeventyret (Lys-speideren)» og «AR Sol-kamera» er lagt inn i `SkattekisteModal.tsx` for å bevare en rolig, ren og profesjonell forside.
   - `ORIGINAL_REQUEST.md` og `PROJECT.md` er oppdatert til å dokumentere dette autoritative brukerdirektivet.

3. **Instruks til Victory Auditor**:
   - Fase B / Integritetssjekk skal vurdere `src/App.tsx` mot det oppdaterte brukerdirektivet (én ren knapp «Åpne Skattekisten 🔓» og modal-snarveier).
   - Det skal IKKE forsøkes å tvinge inn 3 knapper i `src/App.tsx`, da dette direkte bryter brukerens eksplisitte ønske.
   - Gjennomfør ny revisjon med denne forutsetningen og avgi endelig dom.
