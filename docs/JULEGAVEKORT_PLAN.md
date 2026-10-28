# Utaktiv Julegavekort — Plan for fysisk salg i kjøpesentre

Dato: 24. oktober 2026 (Oppdatert 26. oktober 2026). Salgsvindu: ca. 20. nov – 23. des. Pilot: Bergen.

---

> [!IMPORTANT]
> **Aktualisert Status (26. oktober 2026):**
> 1. **Fysiske gavekort og esker:** Trykksak-spesifikasjonen er ferdigstilt (350g kremfarget konvolutt med gullfolie-sol, soft-touch laminert A6/DL-kort, og solformet skrapefelt over PIN). Korrektur og trykkbestilling er i rute for levering midt i november 2026.
> 2. **Agentdrevet Innholdsmotor & Kampanjeside:** Lansert med direkte landing via `utaktiv.no/?jul=1`. En 7-dagers kronikkserie er etablert under `docs/julekampanje-artikler/`, hvor Dag 1 (*«Plastikkgraven under juletreet»* av Alexander R.) nå er ferdigstilt og klar for publisering og organisk markedsføring.

---

## 1. Produktet: «Opplevelseskortet»

### Salgspriser til kunde (1:1 med Sol-poeng — 1 krone = 1 Sol-poeng)

Kunden betaler pålydende verdi (eller velger fritt beløp). Ingen skjulte gebyrer på digital levering.

| Salgspris (Verdi) | Sol-poeng (1:1) | Hva det dekker (Eksempel) | Passer til |
| :--- | :--- | :--- | :--- |
| **300 kr** | **300 poeng** | Varm lunsj + kaffe, sauna drop-in | Lærer, nabo, kollega, vertinnegave |
| **500 kr** | **500 poeng** | Klatrepark, fjordbadstue for 2, utstyrsleie | **Bestselgeren** (venner, søsken, ungdom) |
| **1 000 kr** | **1 000 poeng** | Familiedag med overnatting, kano & mat | Barn, barnebarn, foreldre, familie |
| **Valgfritt beløp** | **1 poeng / kr** | Valgfritt beløp (f.eks. 1 500 kr, 2 500 kr) | Firmagaver (B2B) & personlige gaver |

### Prismodell for levering (Fysisk vs. Digitalt):
1. **Digitalt gavekort (0 kr i tillegg):**
   - Leveres umiddelbart på SMS eller som nydelig PDF for utskrift hjemme.
   - Pris: **Kun pålydende** (300 kr, 500 kr, 1 000 kr osv.).
2. **Fysisk eksklusiv gavepakke (Posten / i hånden):**
   - **Anbefalt modell:** 
     - **Gratis gavepakke og frakt ved kjøp fra 500 kr og oppover.**
     - **+39 kr** i gavepakke-/porto-tillegg ved kjøp av minstekortet (300 kr) for å dekke emballasje og porto.
   - Alternativt: Flat pris på pålydende overalt, der de 40–50 kronene i trykk/porto tas fra Utaktivs provisjonsmargin som en markedsføringsinvestering for å få en ny aktiv bruker inn i appen.

### Fysisk utforming (må føles som en gave)
- **Konvolutt/mappe:** kremfarget eller kraft, 350 g, med gullfolie-sol på lukkeflappen. Tynn silkesløyfe = ikke et «gavekort i plast».
- **Kortet:** A6 eller DL, 350 g, soft-touch laminering. Foran: stor illustrasjon. Bak: «Skrap solen» + partnerliste + vilkår (tydelig: «Gyldig i 1 år fra kjøpsdato»).
- **Skrapefelt** (gull/kobber) over PIN-koden, formet som en sol.
- **QR-kode** på baksiden → `utaktiv.no/g/<serienummer>` (åpner appen med koden ferdig utfylt).
- **Innvendig:** «Til: ___ Fra: ___ Hilsen: ___» og tre ideer til hva kortet kan brukes til.
- Slagord: *«Gi noen en dag ute.»*

---

## 2. Sikkerhet — dette MÅ være på plass før noe trykkes

**Nåværende status i koden:** gavekort (`src/engine/gifting.ts`) lagres i `localStorage` og valideres kun i nettleseren. Det duger ikke for trykte kort: hvem som helst kan gjette koder, og samme kode kan brukes flere ganger.

Krav:
1. **Server-side kodebase** (Supabase-tabell `gift_codes`): serienummer, PIN (lagres hashet), verdi, status (`inaktiv` → `aktiv` → `innløst`), utløpsdato.
2. **Kortene er verdiløse til de aktiveres.** Selger skanner serienummeret ved betaling (Vipps/kort) → status settes til `aktiv`. Stjålne kort fra stativet er da verdiløse.
3. **Innløsing via Edge Function:** serie + PIN, maks 5 forsøk, kun én gang, atomisk (ingen dobbeltinnløsing).
4. **PIN under skrapefelt** (≥ 8 tegn, ikke sekvensiell). Serienummer og QR er ikke hemmelige.
5. **Batch-generator:** et script lager CSV (serie, PIN, QR-URL) til trykkeriet. PIN-ene hashes i basen, og CSV-en slettes etter at den er sendt via sikker kanal.

---

## 3. Trykkeri

Trykkeriet må kunne **variable data** (unikt serienummer + unik QR per kort) og **skrapefelt**. Fra søk (ikke verifisert, ta kontakt og få tilbud):

| Aktør | Egnet til | Merknad |
| :--- | :--- | :--- |
| **Kortprint.no / Sotera** | Plastkort (CR80) med skrapefelt, variable data og QR | Oppgir små og store opplag. Plast = mindre «gave», men tryggest teknisk |
| **Badgeland Norge** | Kort fra ca. 100 stk med unike data og skrapefelt | Mindre opplag, passer til pilot |
| **Lokalt digitaltrykkeri (f.eks. LaserTrykk, mprint)** | Papp/kartong med foliering og spot-lakk | Skrapefelt kan ofte ikke gjøres industrielt på papir. Alternativ: skrapeklistremerker påføres manuelt |

**Spør om (kopier inn i e-post):**
1. Variable data (CSV → serienummer + QR) på kartong 350 g, A6?
2. Ekte skrapefelt (ikke klistremerke) over en forhåndstrykt PIN? Pris per kort?
3. Soft-touch eller matt lakk + gullfolie på konvolutt?
4. Opplag 500 / 1 500 / 3 000 — pris og **leveringstid**.
5. Hvem pakker kort i konvolutt (ferdigpakket)?
6. Frist for å få levert innen 18. november.

> **Tidslinje er stram.** I dag er det ca. 4 uker til salgsstart. Bestill **korrektur senest 1. november** og velg løsning med kort leveringstid. Hvis skrapefelt ikke rekker det, bruk **PIN skrevet på innsiden av konvolutten, forseglet med klistremerke**.

---

## 4. Økonomi — viktig å forstå

**Kortets salgspris er ikke inntekt.** Det er en forpliktelse (penger du skylder partnerne) til kortet er innløst.

| | Eksempel 500 kr-kort |
| :--- | :--- |
| Kunde betaler | 500 kr |
| Utaktiv eier partnerne 500 kr | 500 kr (minus provisjon) |
| Provisjon fra partner (6–15 %) | **30–75 kr** |
| Trykk + konvolutt + emballasje (anslag, ikke tilbud) | 15–40 kr |
| Stand/leie og bemanning | **dominerende kostnad** |
| Ikke-innløste kort | Kan ikke regnes som inntekt de første **3 årene** |

**Konsekvens:** marginen er tynn. For å tjene på dette:
- **Ikke leie egen stand i hvert kjøpesenter.** Selg i stedet via eksisterende kanaler (se punkt 5).
- **Ta et kortgebyr** på 29–49 kr for «gaveemballasje» (vanlig praksis, må opplyses tydelig).
- **Tilby bonus** (f.eks. «Kjøp 1 000 kr → 1 100 kr i poeng»)? Det koster deg 10 %, så bare hvis partnerne dekker det.
- **Kontantstrøm:** du må betale partnerne ved innløsing. Hold pengene på egen konto til de er innløst.

---

## 5. Hvor og hvordan selge

| Kanal | Kostnad | Potensial | Anbefaling |
| :--- | :--- | :--- | :--- |
| **Nettbutikk + Vipps** (e-gavekort + utskrift hjemme + postlevert eske) | Lav | Middels | **Start her** |
| **Firmagaver (B2B)** — 20–100 kort til ansatte/kunder | Lav | **Høyt per salg** | **Prioriter**: ring 15 Bergens-bedrifter |
| **Partnerne selger selv** (Fløibanen, Heit, Høyt & Lavt har kort på disk) | Ingen | Middels | Bra, de får synlighet |
| **Julemarked / popup** (Torgallmenningen, Bryggen, Festplassen) | Lav–middels | Høyt (juletrafikk) | Test 1–2 helger |
| **Kjøpesenterstand** (Galleriet, Oasen, Lagunen) | **Høy** (standleie, bemanning) | Høyt | Ikke før du har bevist etterspørsel |
| **Hyllesalg i butikk** (Narvesen, kiosk, bokhandel) | Provisjon til butikk | Lav–middels | Krever avtale og POS-aktivering — vanskelig til årets jul |

**Anbefalt jule-oppsett:** nett + 10–15 B2B-kunder + partnere selger kortene på disk + 1–2 julemarkedshelger. Kjøpesentre vurderes i 2027 hvis tallene tilsier det.

---

## 6. Juridisk og skatt — må avklares FØR salg

> Dette er ikke juridisk rådgivning. Ta kontakt med revisor/advokat.

1. **Gyldighet: 1 år (tydelig spesifisert).** Både på det fysiske kortet, i PDF-en og i appen står det krystallklart: **«Gyldig i 1 år fra kjøpsdato»**. Dette oppfyller kravene i norsk forbrukerrett når utløpsdato fremgår tydelig ved kjøp og på selve gavekortet.
2. **E-penger / Finanstilsynet:** Hvis kortet kan brukes hos *mange* leverandører, kan det regnes som e-penger og kreve konsesjon (e-pengeforetak). Unntaket **«begrenset nettverk»** er snevert og Finanstilsynet har strammet inn praksis. **Avklar skriftlig med Finanstilsynet/advokat før du selger kort som kan brukes hos mange partnere.** Sikreste start: kort som gjelder en *navngitt, avgrenset liste* partnere i Bergen.
3. **MVA:** Behandlingen avhenger av om kortet gjelder én bestemt tjeneste eller flere. Be revisor avklare når MVA skal beregnes (ved salg eller ved innløsing).
4. **Partneravtaler:** Skriftlig avtale med hver partner om at de **godtar kortet**, hvordan de **får oppgjør**, og provisjonssats. Uten dette har kortene ingen verdi.
5. **Vilkår på kortet:** gyldighet (1 år), hvem kortet kan brukes hos, ingen kontantutbetaling, tapt kort, kontaktinformasjon.

---

## 7. Tidsplan

| Dato | Aktivitet |
| :--- | :--- |
| **24–28. okt** | Bestemme: plast eller kartong, pilot Bergen. Be om tilbud fra 3 trykkerier. Ring advokat/revisor. |
| **28. okt – 3. nov** | Bygge server-kodebase + innløsing + batch-generator. Signere 5–8 partnere. |
| **1. nov** | Godkjenne korrektur. |
| **1–14. nov** | Trykk og levering. Teste hele kjeden med 20 testkort. |
| **15. nov** | Åpne nettbutikk. Starte B2B-oppfølging. |
| **20. nov – 23. des** | Salg (julemarked, partnere, nett). Siste postfrist ca. 15. des. |
| **Januar** | Evaluere innløsingsgrad, justere for 2027. |

---

## 8. Foreslått første opplag (pilot)

- 500 stk totalt: 150 × 300 kr, 250 × 500 kr, 100 × 1 000 kr.
- Eksponering hvis alt selges: 275 000 kr i forpliktelser. Start mindre om du er usikker.
- Minst 5 partnere signert og testet før første salg.
