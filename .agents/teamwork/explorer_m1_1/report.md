# Utaktiv Soljakten & Skattejakten: Teknisk Analyse for Milestone 1
**Modul i fokus**: `src/components/FamilieEventyrModal.tsx` & relaterte motorer (`src/engine/familieEventyr.ts`, `src/engine/askeladden.ts`)  
**Dato**: 2026-10-27  
**Forfatter**: Teamwork Preview Explorer (Instance 1)  

---

## 1. Sammendrag (Executive Summary)

Denne analysen kartlegger den nøyaktige feilrettings- og forbedringsstrategien for **Milestone 1 (Touch Fusion & Multitouch)** i henhold til kravene i `ORIGINAL_REQUEST.md` og `PROJECT.md`:
1. **Hold-timer for berøringsfusjon**: Nåværende kode i `FamilieEventyrModal.tsx` fullfører på 2,0 sekunder (20 intervaller à 100 ms med steg på 5 %). Kravet krever en **nøyaktig 3,0-sekunders** holdetid med jevn fremdriftsanimasjon.
2. **Flerberøringshåndtering (Multi-touch)**: Nåværende implementasjon reagerer på en enkelt fingerberøring (`onTouchStart={() => setIsHolding(true)}`), har ingen validering av `touches.length >= 2`, mangler beskyttelse mot mobile «spøkelsesklikk» (syntetiske mouse-events), og gir ikke visuell tilbakemelding på om 1 eller 2 fingre er plassert.
3. **Lydeffekt-verifisering (Barnetone & Seiersfanfare)**: Web Audio API-syntesen initialiserer en ny `AudioContext` ved hvert tonekall, mangler håndtering av `suspended`-tilstand i mobile nettlesere (iOS Safari / Chrome), og mangler kobling for sekvensiell avspilling av barnets suksesslyd (`child_success`) og familiens seiersfanfare (`victory`) ved fullføring av Steg 3.

---

## 2. Detaljert Analyse: Problem 1 – Hold-timer for berøringsfusjon

### Nåværende kodeobservasjon (`src/components/FamilieEventyrModal.tsx`, linje 70–90)
```tsx
70:   // Håndter 3-sekunders hold for Steg 3 (Sol-Fusjonen)
71:   useEffect(() => {
72:     let interval: NodeJS.Timeout | null = null;
73:     if (isHolding && currentStep === 3 && !isCompleted) {
74:       interval = setInterval(() => {
75:         setFusionHoldProgress((prev) => {
76:           if (prev >= 100) {
77:             clearInterval(interval!);
78:             handleCompleteAdventure();
79:             return 100;
80:           }
81:           return prev + 5;
82:         });
83:       }, 100);
84:     } else {
85:       setFusionHoldProgress(0);
86:     }
87:     return () => {
88:       if (interval) clearInterval(interval);
89:     };
90:   }, [isHolding, currentStep, isCompleted]);
```

### Matematisk feil og konsekvenser
- `setInterval` kjører hvert **100 ms**.
- Hvert tikk øker `prev` med **5 %**.
- Antall tikk til 100 %: `100 / 5 = 20 tikk`.
- Total forløpt tid: `20 * 100 ms = 2000 ms = 2,0 sekunder`.
- **Konklusjon**: Spillet fullfører 1,0 sekund for tidlig! Både krav R1 i `ORIGINAL_REQUEST.md` og teksten i `familieEventyr.ts` (linje 127: «Hold inne i 3 sekunder») spesifiserer eksplisitt 3,0 sekunder.

### Løsningsstrategi
For å oppnå en deterministisk, nøyaktig 3,0-sekunders timer som er uavhengig av tidsavvik i nettleserens `setInterval` (f.eks. ved bakgrunns-throttling eller lav bildefrekvens), anbefales en **tidsstempelbasert delta-beregning**:

```tsx
const FUSION_HOLD_DURATION_MS = 3000; // Nøyaktig 3,0 sekunder
const FUSION_TICK_INTERVAL_MS = 50;  // 20 fps for jevn progressbar

useEffect(() => {
  let interval: NodeJS.Timeout | null = null;
  if (isHolding && currentStep === 3 && !isCompleted) {
    const startTime = Date.now();
    interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / FUSION_HOLD_DURATION_MS) * 100);
      if (progress >= 100) {
        if (interval) clearInterval(interval);
        setFusionHoldProgress(100);
        handleCompleteAdventure();
      } else {
        setFusionHoldProgress(progress);
      }
    }, FUSION_TICK_INTERVAL_MS);
  } else {
    setFusionHoldProgress(0);
  }
  return () => {
    if (interval) clearInterval(interval);
  };
}, [isHolding, currentStep, isCompleted]);
```

### Visuell oppdatering
I linje 519 i `FamilieEventyrModal.tsx`:
- Endre CSS-overgang fra `transition-all duration-100` til `transition-all duration-75 ease-linear`.
- I sirkelsenteret (linje 504) kan fremdriften vises som prosent eller gjenværende tid:
  `{isHolding ? `${Math.round(fusionHoldProgress)}%` : touchCount === 1 ? '1 finger til!' : 'Hold inne!'}`.

---

## 3. Detaljert Analyse: Problem 2 – Flerberøringshåndtering (Multi-touch)

### Nåværende kodeobservasjon (`src/components/FamilieEventyrModal.tsx`, linje 495–501)
```tsx
495:                   <div
496:                     onMouseDown={() => setIsHolding(true)}
497:                     onMouseUp={() => setIsHolding(false)}
498:                     onTouchStart={() => setIsHolding(true)}
499:                     onTouchEnd={() => setIsHolding(false)}
500:                     className="relative w-36 h-36 rounded-full ..."
501:                   >
```

### Svakheter identifisert
1. **Ingen sjekk av antall berøringspunkter**: En enkelt barnefinger på skjermen starter fusjonen. Den voksne trenger ikke å delta, noe som bryter med det pedagogiske premisset om felles fysisk synkronisering.
2. **Ingen oppdatering ved delvis fingerslipp**: Hvis to fingre settes ned og én løftes, kan `onTouchEnd` avfyres, men `touches.length` sjekkes aldri.
3. **Mangler `onTouchMove` og `onTouchCancel`**: Hvis fingrene glir av elementet eller en systemgest avbryter berøringen, forblir tilstanden udefinert.
4. **Spøkelsesklikk på berøringsskjermer**: Mobile nettlesere emulerer ofte `onMouseDown` 300 ms etter en berøring. Uten sperre kan et slippet berøringssteg utilsiktet starte på nytt via syntetisk musehendelse.
5. **Skrivebordsstøtte**: På datamaskin uten berøringsskjerm (mus/trackpad) må utviklere og testere kunne teste fusjonen ved å holde nede venstre mustast.

### Løsningsstrategi
1. **Tilstands- og referansestyring**:
```tsx
const [touchCount, setTouchCount] = useState<number>(0);
const lastTouchTimestampRef = React.useRef<number>(0);
```

2. **Berøringshendelser (`touches.length >= 2`)**:
```tsx
const handleTouchStart = (e: React.TouchEvent) => {
  lastTouchTimestampRef.current = Date.now();
  ensureAudioContext();
  const count = e.touches.length;
  setTouchCount(count);
  if (count >= 2) {
    setIsHolding(true);
  } else {
    setIsHolding(false);
  }
};

const handleTouchMove = (e: React.TouchEvent) => {
  lastTouchTimestampRef.current = Date.now();
  const count = e.touches.length;
  setTouchCount(count);
  if (count >= 2) {
    setIsHolding(true);
  } else {
    setIsHolding(false);
  }
};

const handleTouchEnd = (e: React.TouchEvent) => {
  lastTouchTimestampRef.current = Date.now();
  const count = e.touches.length;
  setTouchCount(count);
  if (count < 2) {
    setIsHolding(false);
  }
};

const handleTouchCancel = () => {
  lastTouchTimestampRef.current = Date.now();
  setTouchCount(0);
  setIsHolding(false);
};
```

3. **Robust skrivebordsfallback for mus**:
```tsx
const handleMouseDown = () => {
  // Avvis syntetiske klikk fra berøringsskjermer
  if (Date.now() - lastTouchTimestampRef.current < 750) return;
  ensureAudioContext();
  setIsHolding(true);
};

const handleMouseUp = () => {
  if (Date.now() - lastTouchTimestampRef.current < 750) return;
  setIsHolding(false);
};

const handleMouseLeave = () => {
  setIsHolding(false);
};
```

4. **Visuelle indikatorer for samtidig berøring**:
Under eller over krystallen legges det til to distinkte statusmerker:
- 👶 **Lys-speideren (Barnet)**: Lyser opp når `touchCount >= 1` (eller ved skrivebordsmus).
- 🧔 **Kart-leseren (Den voksne)**: Lyser opp når `touchCount >= 2` (eller ved skrivebordsmus).
- Hjelpetekst:
  - 0 fingre: *«Hold to fingre på skjermen samtidig (én fra barnet og én fra den voksne)!»*
  - 1 finger: *«☝️ 1 finger registrert! Barnet og den voksne må holde samtidig.»*
  - 2 fingre: *«⚡ Berøringsfusjon pågår! Hold stødig i 3 sekunder...»*
  - Skrivebordsmodus: *«💻 Skrivebordsmodus: Hold nede musetasten for å teste fusjonen»*

---

## 4. Detaljert Analyse: Problem 3 – Lydsyntese & Toneutløsning

### Nåværende kodeobservasjon (`src/components/FamilieEventyrModal.tsx`, linje 93–144 og 198–215)
```tsx
93:   const playSound = (type: 'child_success' | 'adult_success' | 'victory' | 'error') => {
94:     try {
95:       const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
96:       if (!AudioCtx) return;
97:       const ctx = new AudioCtx();
...
101:       if (type === 'child_success') {
... // Triangelbølge C5 (523.25 Hz) -> G5 (783.99 Hz) i 0.35s
113:       } else if (type === 'victory') {
... // Sinus-arpeggio [523.25, 659.25, 783.99, 1046.5] (C5, E5, G5, C6)
126:       } else if (type === 'error') {
... // Sagtannbølge 220 Hz
137:       }
```

### Svakheter identifisert
1. **Ressurslekkasje og nettleserblokkering**: Å opprette `new AudioCtx()` på hvert tonekall skaper for mange uavhengige instanser. Nettlesere (spesielt på iOS og Android) begrenser antallet til mellom 6 og 32 instanser før de nekter å lage nye.
2. **`suspended`-tilstand under asynkron tidsavbrudd**: Fordi `handleCompleteAdventure()` utløses inne i en `setInterval`-callback etter 3 sekunder, kan nettleserens `AudioContext` havne i `suspended`-tilstand dersom den ikke ble åpnet eller vekket under en brukerinitiert hendelse (`touchstart` / `mousedown`).
3. **Manglende `adult_success` i switch-blokken**: Unionstypen i linje 94 inkluderer `'adult_success'`, men i funksjonskroppen finnes ingen `else if (type === 'adult_success')`. Linje 174 i `handleAdultOptionSelect` kaller `playSound('child_success')` i stedet.
4. **Toneaktivering ved fullført eventyr**:
   - I `handleCompleteAdventure()` (linje 198–215) kalles kun `playSound('victory')`.
   - Oppgaveteksten ber om å verifisere at **både barnets suksesslyd (`child_success`) og seiersfanfaren (`victory`) utløses ved fullføring**.
   - Dette reflekterer spillets pedagogiske kjerne: Først belønnes femåringen for å ha vært helten («Lys-speideren»), før den store familietriumfen feires!

### Løsningsstrategi for lyd
1. **Gjenbrukbar AudioContext-referanse med gjenopptakelse**:
```tsx
const audioContextRef = React.useRef<AudioContext | null>(null);

const ensureAudioContext = (): AudioContext | null => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current.state === 'suspended') {
      void audioContextRef.current.resume();
    }
    return audioContextRef.current;
  } catch {
    return null;
  }
};
```
2. **Legge til `adult_success`-tone**:
Harmonisk varm tone: G4 (392,00 Hz) til C5 (523,25 Hz) med sinusbølge.
3. **Kombinert seierssekvens i `handleCompleteAdventure`**:
```tsx
const handleCompleteAdventure = () => {
  // 1. Spill først barnets suksesslyd for å hedre Lys-speideren
  playSound('child_success');

  // 2. Spill familiens triumferende seiersfanfare etter 350 ms (når barnetonen runder av)
  setTimeout(() => {
    playSound('victory');
  }, 350);

  setIsCompleted(true);
  saveAdventureProgress({
    adventureId: adventure.id,
    currentStep: 3,
    childSecretFound: childSecret || undefined,
    adultLogicSolved: true,
    isCompleted: true,
    completedAt: new Date().toISOString()
  });
  if (onAwardPoints) {
    onAwardPoints(adventure.reward.points);
  }
  claimAdventureBonus(adventure.id);
  setFamilyPot(getFamilyPotSummary());
};
```

---

## 5. Konkret Endringsplan for `src/components/FamilieEventyrModal.tsx`

Nedenfor er den nøyaktige koden som implementøren kan sette rett inn:

### A. Tilstand og referanser (rundt linje 52–56)
```tsx
<<<<
  // Felles-hold timer for steg 3
  const [fusionHoldProgress, setFusionHoldProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
====
  // Felles-hold timer og multitouch for steg 3 (Nøyaktig 3,0 sekunder berøringsfusjon)
  const FUSION_HOLD_DURATION_MS = 3000;
  const FUSION_TICK_INTERVAL_MS = 50;

  const [fusionHoldProgress, setFusionHoldProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [touchCount, setTouchCount] = useState<number>(0);
  const lastTouchTimestampRef = React.useRef<number>(0);
  const audioContextRef = React.useRef<AudioContext | null>(null);
>>>>
```

### B. Timer-effekt (linje 70–90)
```tsx
<<<<
  // Håndter 3-sekunders hold for Steg 3 (Sol-Fusjonen)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isHolding && currentStep === 3 && !isCompleted) {
      interval = setInterval(() => {
        setFusionHoldProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval!);
            handleCompleteAdventure();
            return 100;
          }
          return prev + 5;
        });
      }, 100);
    } else {
      setFusionHoldProgress(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHolding, currentStep, isCompleted]);
====
  // Håndter nøyaktig 3,0-sekunders hold for Steg 3 (Sol-Fusjonen)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isHolding && currentStep === 3 && !isCompleted) {
      const startTime = Date.now();
      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / FUSION_HOLD_DURATION_MS) * 100);
        if (progress >= 100) {
          if (interval) clearInterval(interval);
          setFusionHoldProgress(100);
          handleCompleteAdventure();
        } else {
          setFusionHoldProgress(progress);
        }
      }, FUSION_TICK_INTERVAL_MS);
    } else {
      setFusionHoldProgress(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHolding, currentStep, isCompleted]);
>>>>
```

### C. AudioContext & Hendelseshåndterere (linje 92–144 og nye funksjoner)
```tsx
  const ensureAudioContext = (): AudioContext | null => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current.state === 'suspended') {
        void audioContextRef.current.resume();
      }
      return audioContextRef.current;
    } catch {
      return null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    lastTouchTimestampRef.current = Date.now();
    ensureAudioContext();
    const count = e.touches.length;
    setTouchCount(count);
    if (count >= 2) {
      setIsHolding(true);
    } else {
      setIsHolding(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    lastTouchTimestampRef.current = Date.now();
    const count = e.touches.length;
    setTouchCount(count);
    if (count >= 2) {
      setIsHolding(true);
    } else {
      setIsHolding(false);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    lastTouchTimestampRef.current = Date.now();
    const count = e.touches.length;
    setTouchCount(count);
    if (count < 2) {
      setIsHolding(false);
    }
  };

  const handleTouchCancel = () => {
    lastTouchTimestampRef.current = Date.now();
    setTouchCount(0);
    setIsHolding(false);
  };

  const handleMouseDown = () => {
    if (Date.now() - lastTouchTimestampRef.current < 750) return;
    ensureAudioContext();
    setIsHolding(true);
  };

  const handleMouseUp = () => {
    if (Date.now() - lastTouchTimestampRef.current < 750) return;
    setIsHolding(false);
  };

  const handleMouseLeave = () => {
    setIsHolding(false);
  };
```

### D. Fullføring og toneaktivering (linje 198–215)
```tsx
<<<<
  const handleCompleteAdventure = () => {
    playSound('victory');
    setIsCompleted(true);
====
  const handleCompleteAdventure = () => {
    // Spill først barnets suksesslyd for å hedre Lys-speideren, og deretter familiens seiersfanfare
    playSound('child_success');
    setTimeout(() => {
      playSound('victory');
    }, 350);
    setIsCompleted(true);
>>>>
```

### E. JSX i Steg 3 (linje 493–527)
```tsx
<<<<
              {/* Steg 3: Hold nede sammen (Fusjonen) */}
              {currentStep === 3 && (
                <div className="flex flex-col items-center justify-center text-center py-4 space-y-4">
                  <div
                    onMouseDown={() => setIsHolding(true)}
                    onMouseUp={() => setIsHolding(false)}
                    onTouchStart={() => setIsHolding(true)}
                    onTouchEnd={() => setIsHolding(false)}
                    className="relative w-36 h-36 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 border-4 border-amber-300 shadow-2xl flex flex-col items-center justify-center cursor-pointer select-none active:scale-95 transition"
                  >
                    <span className="text-5xl animate-pulse">✨</span>
                    <span className="text-[10px] font-black uppercase text-slate-950 mt-1">
                      {isHolding ? 'Lader...' : 'Hold inne!'}
                    </span>

                    {/* Progress ring */}
                    {isHolding && (
                      <div
                        style={{ opacity: fusionHoldProgress / 100 }}
                        className="absolute inset-0 rounded-full border-4 border-white shadow-[0_0_30px_#f59e0b] animate-ping pointer-events-none"
                      ></div>
                    )}
                  </div>

                  <div className="w-full max-w-xs bg-slate-800 rounded-full h-3 overflow-hidden border border-white/10">
                    <div
                      style={{ width: `${fusionHoldProgress}%` }}
                      className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full transition-all duration-100"
                    ></div>
                  </div>

                  <p className="text-slate-300 text-xs">
                    Hold to fingre på skjermen samtidig (én fra barnet og én fra den voksne)!
                  </p>
                </div>
              )}
====
              {/* Steg 3: Hold nede sammen (Fusjonen) */}
              {currentStep === 3 && (
                <div className="flex flex-col items-center justify-center text-center py-4 space-y-4">
                  {/* Statusindikator for multitouch */}
                  <div className="flex items-center justify-center gap-3 text-xs font-bold">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition ${
                        touchCount >= 1 || (isHolding && touchCount === 0)
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-white/5 border-white/10 text-slate-500'
                      }`}
                    >
                      <span>👶</span>
                      <span>Lys-speideren {touchCount >= 1 || (isHolding && touchCount === 0) ? '✓' : '...'}</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition ${
                        touchCount >= 2 || (isHolding && touchCount === 0)
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-white/5 border-white/10 text-slate-500'
                      }`}
                    >
                      <span>🧔</span>
                      <span>Kart-leseren {touchCount >= 2 || (isHolding && touchCount === 0) ? '✓' : '...'}</span>
                    </div>
                  </div>

                  <div
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchCancel}
                    className="relative w-36 h-36 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 border-4 border-amber-300 shadow-2xl flex flex-col items-center justify-center cursor-pointer select-none active:scale-95 transition"
                  >
                    <span className="text-5xl animate-pulse">✨</span>
                    <span className="text-[10px] font-black uppercase text-slate-950 mt-1">
                      {isHolding
                        ? `${Math.round(fusionHoldProgress)}%`
                        : touchCount === 1
                        ? '1 finger til!'
                        : 'Hold inne!'}
                    </span>

                    {/* Progress ring */}
                    {isHolding && (
                      <div
                        style={{ opacity: fusionHoldProgress / 100 }}
                        className="absolute inset-0 rounded-full border-4 border-white shadow-[0_0_30px_#f59e0b] animate-ping pointer-events-none"
                      ></div>
                    )}
                  </div>

                  <div className="w-full max-w-xs bg-slate-800 rounded-full h-3 overflow-hidden border border-white/10">
                    <div
                      style={{ width: `${fusionHoldProgress}%` }}
                      className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full transition-all duration-75 ease-linear"
                    ></div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-slate-300 text-xs font-medium">
                      {touchCount === 1 ? (
                        <span className="text-amber-300 font-bold">
                          ☝️ 1 finger registrert! Barnet og den voksne må holde samtidig.
                        </span>
                      ) : isHolding ? (
                        <span className="text-amber-200 font-bold">
                          ⚡ Berøringsfusjon pågår! Hold stødig i 3 sekunder...
                        </span>
                      ) : (
                        'Hold to fingre på skjermen samtidig (én fra barnet og én fra den voksne)!'
                      )}
                    </p>
                    {touchCount === 0 && (
                      <p className="text-[10px] text-slate-500">
                        💻 Skrivebordsmodus: Hold nede musetasten for å teste fusjonen
                      </p>
                    )}
                  </div>
                </div>
              )}
>>>>
```

---

## 6. Verifisering og Testmetode

Implementasjonen kan verifiseres deterministisk gjennom følgende steg:
1. **Enhetstester**:
   - `npx vitest run`: Sjekk at alle 188 tester i 25 suiter forblir grønne.
   - Kan suppleres med en dedikert mock-test av timer og multitouch i en ny test-fil hvis ønskelig.
2. **Kompilering og produksjonsbygging**:
   - `npx tsc --noEmit`: Skal fullføre med 0 feil.
   - `npm run build`: Vite-bygging genererer optimaliserte chunks i `dist/`.
3. **Manuell feltsjekk / simulering**:
   - På skrivebord: Hold museknappen inne i 3 sekunder. Verifiser at fremdriftslinjen bruker nøyaktig 3 sekunder til 100 %, at prosenttelleren teller jevnt opp, og at begge toner spilles.
   - I Chrome DevTools med «Toggle Device Toolbar» og multitouch-simulering (Shift+Drag):
     - Med 1 touchpunkt: Lys-speideren er registrert, men fusjonen starter ikke.
     - Med 2 touchpunkter: Begge er registrert, fusjonen starter, og fullføres etter 3,0 sekunder.
     - Slipp 1 finger etter 1,5 sekund: Fusjonen avbrytes umiddelbart og nullstilles til 0 %.
