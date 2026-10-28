# Produkt- og Arkitekturplan: Sol Junior ☀️🧒
*Fra passiv skjermtid til aktiv nabohjelp, dagslys og ekte opptjeningsglede.*

---

## 1. Visjon og Samfunnseffekt

**Sol Junior** er en dedikert følgesvenn-app til *Utaktiv*, designet for barn og ungdom (7–16 år). Den kobler generasjoner i nabolaget og gjør utendørs arbeid og fysisk aktivitet til et engasjerende spill.

### Tre samfunnsproblemer som løses i ett jafs:
1. **Fysisk passivitet & skjermtretthet:** Barn tilbringer for mye tid innendørs i kunstig belysning uten tilstrekkelig dagslys og dopaminstimulerende dagslysrytmer.
2. **Generasjonskløft og uforløst nabolagshjelp:** Eldre, uføre eller travle naboer trenger hjelp til plenklipp, hekktrimming, snømåking, hundelufting eller bilvask, men kjenner ikke barna i gaten.
3. **Mestring og sunn pengeforståelse:** Barn lærer verdien av ærlig arbeid, fellesskap og sparing til egne opplevelser (klatrepark, konserter, idrett).

```
 ┌──────────────────────┐        Vipps (150 kr)       ┌────────────────────────┐
 │   NABO / FORELDER    │────────────────────────────▶│  SOL JUNIOR DEPONI     │
 │ "Trenger gressklipp" │                             │  (Escrow & Forsikring) │
 └──────────────────────┘                             └───────────┬────────────┘
            │                                                     │
            │ Utfører oppgave ute i solen                         │ Løser ut poeng
            ▼                                                     ▼
 ┌──────────────────────┐   + UV/Luks Dagslysbonus    ┌────────────────────────┐
 │     BARNET (APP)     │◀────────────────────────────│ SOL UTELIV KREDITT     │
 │ Måler tid, luks & UV │                             │ (Kan kjøpe billetter)  │
 └──────────────────────┘                             └────────────────────────┘
```

---

## 2. Kjernemekanikker & Spilloversikt

### A. Dobbelt Opptjeningssystem (Arbeid + Solbonus)
Når et barn tar på seg en oppgave, tjener de på **to kilder samtidig**:

1. **Grunnhonorar (fra oppdragsgiver):**
   - Naboen legger ut: *«Klipp plenen (ca. 45 min) — 150 kr / 1500 Sol-mynter»*.
   - Beløpet trekkes umiddelbart fra naboens Vipps/kort og holdes i trygg forvaring (escrow) i appen.
2. **UV- & Dagslysmultiplikator (fra Sol-motoren):**
   - Mens barnet jobber ute, måler Sol-motoren sanntids luks og UV-indeks.
   - **Formel for solbonus:**
     $$\text{Bonuspoeng} = \text{Arbeidstid (min)} \times \left(\frac{\text{Luks}}{10\,000}\right) \times (1 + \text{UV} \times 0.25)$$
   - *Eksempel:* 45 minutter plenklipp i Bergen på en solskinnsdag med 40 000 luks og UV 4:
     $$\text{Bonus} = 45 \times 4 \times (1 + 1.0) = 360\text{ ekstra Sol-Kreditt}$$
   - Barnet sitter igjen med **1500 kr-poeng + 360 UV-dagslyspoeng = 1860 poeng!**

### B. Oppgavekatalogen
| Kategori | Typiske oppgaver | Sesong | Dagslyspotensial |
| :--- | :--- | :--- | :--- |
| **Hage & Uteområde** | Plenklipp, løvraking, vanne blomster, luke ugress | Vår / Sommer / Høst | Ekstremt høyt (direkte sol) |
| **Vinterhjelp** | Måke innkjørsel, strø salt/singel, hente ved | Vinter | Høy biologisk verdi (vinterlys) |
| **Dyrehold** | Gå tur med naboens hund i 45 min | Hele året | Høy kardio + dagslys |
| **Biler & Sykler** | Vaske og tørke bil, vaske/smøre sykler | Vår / Sommer | Moderat/høyt |
| **Hjem & Nabolag** | Gå på butikken, bære panteflasker til retur | Hele året | Korte sol-turer |

---

## 3. Barnevern, Nabolagstrygghet & Foreldrekontroll (OPSEC)

Sikkerheten til barn er førsteprioritet. Systemet bygges med tre faste sikkerhetslag:

1. **Foreldrekobling (Parental Lock):**
   - Barn under 15 år kan kun registreres ved at en forelder autentiserer seg med **BankID / Vipps**.
   - Forelderen mottar push-varsel og må godkjenne:
     - Hver oppgave barnet melder seg på.
     - Hver nabo barnet skal hjelpe.
     - Alle uttak av poeng eller kjøp av billetter.
2. **Geofence i Nabolaget:**
   - Oppgaver fra naboer vises kun innenfor en **maksimal radius på 300–500 meter** fra barnets hjemadresse.
   - Ingen barn sendes ut på ukjente oppdrag langt unna.
3. **Verifiserte Naboer & Ingen Åpen Chat:**
   - Naboer må være verifisert med BankID.
   - Kommunikasjonen er malbasert (f.eks. «Jeg er på vei», «Oppgaven er fullført», «Trenger du gressklipper?»). Ingen fri fritekst-chat mellom ukjente voksne og barn.
4. **Foto-verifikasjon (Før/Etter-bilde):**
   - Barnet tar bilde av den nyklipte plenen eller den måkede trappen i appen.
   - Naboen trykker «Godkjenn» i sin app, og pengene overføres umiddelbart fra deponiet.

---

## 4. Økonomien: Hvordan tjener Utaktiv penger på dette?

Dette skaper en **dobbel provisjonsmotor** for selskapet og stiftelsen:

```
[Nabo betaler 150 kr via Vipps]
         │
         ├──▶ 10 % Trygghets- & Formidlingsgebyr (15 kr) ──▶ [SOL UTELIV DRIFT & STIFTELSE]
         │
         └──▶ 135 kr (1350 poeng) krediteres barnet
                   │
                   ▼
         [Barnet bruker 1350 poeng i Sol-butikken]
         Kjøper f.eks. billett til Høyt & Lavt Klatrepark (360 kr)
                   │
                   ▼
         [Utaktiv formidler billetten til Høyt & Lavt]
         Får 8 % provisjon = 28,80 kr fra arrangøren!
```

### Inntektsstrømmer:
1. **8–10 % plattformgebyr på nabohjelp:** Dekker Vipps-transaksjonskostnad (ca. 1,5–2 %), mikroforsikring (hvis barnet mister en rive), og gir 6–8 % netto margin til stiftelsen.
2. **Affiliate-margin på billetter:** Når barnet veksler poengene sine inn i billetter til klatrepark, kino, konsert eller løp, tjener vi en ekstra provisjon på 5–10 % fra arrangøren.
3. **Kommunal & Stiftelsesstøtte (Folkehelsemidler):** Gjensidigestiftelsen, Sparebankstiftelsen DNB og Helsedirektoratet har store tilskuddspotter for prosjekter som aktiviserer ungdom og forebygger utenforskap.

---

## 5. Teknisk Integrasjon med Utaktiv

Sol Junior bygges på samme datagrunnlag som Utaktiv, men med et forenklet og lekent grensesnitt:

- **Delt bruker- og profilbase:** Forelderens profil i Utaktiv (`profile.children`) kobles direkte til barnets profil i Sol Junior via en 6-sifret paringskode.
- **Sirkadisk & Meteorologisk API:** Gjenbruker Spencer/NOAA-solformelen og MET Norway sanntids skydekke for automatisk UV- og luks-beregning.
- **Delt Sol-Børs:** Poeng opptjent i Sol Junior speiles umiddelbart i familiens samlede opplevelseskvote i Utaktiv.

---

## 6. Neste Konkrete Steg for Gjennomføring

1. **Fase 1 (i Utaktiv nå):**
   - Bygge **`DaylightSensorWidget`** (live dagslysmåler) og **`SolStoreModal`** (Sol-børsen) slik at poengakkumulering og innløsning fungerer i appen i dag.
2. **Fase 2 (Sol Junior Oppgavemotor):**
   - Opprette datamodell for `Chores` (oppgaver), `NeighborhoodEscrow` og `UvMultiplier`.
3. **Fase 3 (Lokal pilot):**
   - Teste i et avgrenset nabolag i Bergen (f.eks. Minde/Fana/Nordnes) med 10 familier og 15 naboer.
