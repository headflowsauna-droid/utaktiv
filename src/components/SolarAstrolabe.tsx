import React, { useState, useEffect, useMemo } from 'react';
import { 
  calculateSolarAltitude, 
  SolarStatus 
} from '../engine/solar';
import { 
  Compass, 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  MapPin, 
  RotateCcw
} from 'lucide-react';

interface SolarAstrolabeProps {
  city: string;
  lat?: number;
  lng?: number;
  currentSolar: SolarStatus;
  onSelectScrubTime?: (hour: number, minute: number) => void;
  lang?: 'no' | 'en';
}

interface CitySunProfile {
  lat: number;
  lng: number;
  no: {
    noon: { spot: string; tip: string };
    golden: { spot: string; tip: string };
    blue: { spot: string; tip: string };
    night: { spot: string; tip: string };
  };
  en: {
    noon: { spot: string; tip: string };
    golden: { spot: string; tip: string };
    blue: { spot: string; tip: string };
    night: { spot: string; tip: string };
  };
}

const CITY_PROFILES: Record<string, CitySunProfile> = {
  Bergen: {
    lat: 60.3913,
    lng: 5.3221,
    no: {
      noon: {
        spot: 'Fløyen & Skomakerdiket (Direkte sol på solveggen)',
        tip: 'Turleder-tid! Nå smaker skillingsbollen på Skomakerdiket best!',
      },
      golden: {
        spot: 'Byfjorden & Sandviksbatteriet (Gyldent lys over fjorden)',
        tip: 'Ta med bestefar til utsiktspunktet før solen dypper i havet.',
      },
      blue: {
        spot: 'Lune kafeer & opplyste stier i Fjellveien',
        tip: 'Tenk dere om: Er det tid for varm kakao og tørre ullsokker nå?',
      },
      night: {
        spot: 'Vedfyrt fjordbadstue på Heit eller Nordnes Sjøbad',
        tip: 'Se etter stjernene over Vidden og lån en lommelykt!',
      },
    },
    en: {
      noon: {
        spot: 'Mount Fløyen & Skomakerdiket (Direct sun on the mountain wall)',
        tip: 'Peak daylight! Fresh cinnamon buns taste best at Fløistuen now.',
      },
      golden: {
        spot: 'Sandviksbatteriet viewpoint (Golden hour over Byfjorden)',
        tip: 'Catch the warm sunset rays over the fjord before twilight.',
      },
      blue: {
        spot: 'Cozy cafes & illuminated paths along Fjellveien',
        tip: 'Nordic twilight: Time for hot cocoa and warm woolen layers!',
      },
      night: {
        spot: 'Wood-fired floating fjord sauna at Heit or Nordnes Sjøbad',
        tip: 'Starlit fjord swim and sauna under clear Nordic skies.',
      },
    },
  },
  Trondheim: {
    lat: 63.4305,
    lng: 10.3951,
    no: {
      noon: {
        spot: 'Skistua & Gråkallen i Bymarka (Panoramasol over Trøndelag)',
        tip: 'Kanelsnurr på Skistua og full fart i akebakken!',
      },
      golden: {
        spot: 'Kristiansten Festning & Gamle Bybro (Gyldent lys over Nidelven)',
        tip: 'Se solnedgangen over Nidarosdomen før kvelden kommer.',
      },
      blue: {
        spot: 'Lune kafeer på Bakklandet og opplyste stier langs Nidelven',
        tip: 'Tid for kakao på Bakklandet og varme votter!',
      },
      night: {
        spot: 'Fjordbadstue på Havet Arena eller stjernehimmel i Bymarka',
        tip: 'Se etter nordlyset og stjernebildene over fjorden!',
      },
    },
    en: {
      noon: {
        spot: 'Skistua & Gråkallen in Bymarka (Panoramic sun over Trøndelag)',
        tip: 'Sunny ski trails, warm waffles, and crisp Nordic mountain air.',
      },
      golden: {
        spot: 'Kristiansten Fortress & Old Town Bridge (Golden light on Nidelva)',
        tip: 'Photograph the iconic wooden wharves in pure golden light.',
      },
      blue: {
        spot: 'Cozy cobblestone cafes in Bakklandet & illuminated river trails',
        tip: 'Nordic blue hour: Warm cafe stops and lit bridges.',
      },
      night: {
        spot: 'Fjord sauna at Havet Arena or aurora hunting in Bymarka',
        tip: 'Look north for green aurora ribbons dancing above the fjord!',
      },
    },
  },
  Eidfjord: {
    lat: 60.4678,
    lng: 7.0706,
    no: {
      noon: {
        spot: 'Vøringsfossen & Kjeåsen (Krystallklart lys over Hardangervidda)',
        tip: 'Kikk ned i det mektige juvet ved Vøringsfossen!',
      },
      golden: {
        spot: 'Hæreid-platået (Solens siste stråler over Hardangerfjorden)',
        tip: 'Løp over gravhaugene på Hæreid mens fjorden bader i gull.',
      },
      blue: {
        spot: 'Sjel og Gane i Heggjagarden eller lune kafeer i sentrum',
        tip: 'Varm saft og lokal eplekake fra Hardanger venter!',
      },
      night: {
        spot: 'Gratis badstue nede ved fjorden (eller Heit Eidfjord panoramabadstue)',
        tip: 'Stummende mørkt mellom de stupbratte fjellene – magisk!',
      },
    },
    en: {
      noon: {
        spot: 'Vøringsfossen canyon & Kjeåsen farm (Crisp mountain daylight)',
        tip: 'Peer down into the massive gorge under clear Nordic mountain sun.',
      },
      golden: {
        spot: 'Hæreid Iron Age plateau (Last golden rays hitting Hardangerfjord)',
        tip: 'Walk through ancient Viking mounds while the fjord turns gold.',
      },
      blue: {
        spot: 'Sjel og Gane restaurant in Heggjagarden or cozy village cafes',
        tip: 'Savor warm spiced Hardanger apple juice as dusk settles.',
      },
      night: {
        spot: 'Free fjord dugnad sauna by the shore (or Heit Eidfjord Panorama)',
        tip: 'Deep fjord darkness surrounded by 1,000-meter cliffs.',
      },
    },
  },
  Bodø: {
    lat: 67.2804,
    lng: 14.4049,
    no: {
      noon: {
        spot: 'Keiservarden & Turisthytta (360° arktisk kystutsikt i fullt dagslys)',
        tip: 'Se over mot Lofotveggen mens solen varmer i fjeset!',
      },
      golden: {
        spot: 'Mjelle strand eller Rønvikfjellet (Midnattssol og gyllent lys over storhavet)',
        tip: 'Samle røde steiner i fjæra på Mjelle i kveldssolen.',
      },
      blue: {
        spot: 'Moloen & Pust Fjordbadstue i Bodø Havn',
        tip: 'Arktisk blåtime over havnebassenget – lysene tennes i byen.',
      },
      night: {
        spot: 'Nordlysjakt ved Saltstraumen eller vedfyrt badstue på Pust',
        tip: 'Se opp! Grønne nordlysslør danser over himmelen!',
      },
    },
    en: {
      noon: {
        spot: 'Keiservarden & Turisthytta (360° Arctic ocean panoramic daylight)',
        tip: 'Gaze across Vestfjorden to the dramatic Lofoten wall.',
      },
      golden: {
        spot: 'Mjelle red sand beach or Rønvikfjellet (Midnight sun / Golden ocean light)',
        tip: 'Endless Nordic golden hour stretching over the open Arctic Sea.',
      },
      blue: {
        spot: 'Breakwater pier & Pust Fjord Sauna in Bodø Harbour',
        tip: 'Arctic twilight paints the sea deep cobalt blue.',
      },
      night: {
        spot: 'Aurora borealis hunt at Saltstraumen or hot sauna at Pust',
        tip: 'Northern lights dancing directly above the Arctic sea.',
      },
    },
  },
  Tromsø: {
    lat: 69.6492,
    lng: 18.9553,
    no: {
      noon: {
        spot: 'Fjellheisen & Storsteinen (Arktisk lys over Ishavsbyen)',
        tip: 'Ta taubanen opp og speid etter reinsdyr på fjellet!',
      },
      golden: {
        spot: 'Telegrafbukta (Gyllent skjær over sundet og fjelltoppene)',
        tip: 'Løp i fjæra mens himmelen gløder i rosa og oransje.',
      },
      blue: {
        spot: 'Pust Tromsø eller kyststien rundt Prestvannet',
        tip: 'Magisk arktisk mørketidslys – finn frem refleksvesten!',
      },
      night: {
        spot: 'Aurora-safari eller dampende varm badstue i havna',
        tip: 'Nordlyset blafrer rett over hodene våre!',
      },
    },
    en: {
      noon: {
        spot: 'Fjellheisen cable car & Storsteinen (Arctic panorama over the island)',
        tip: 'Look out over snow-dusted peaks and Arctic fjords.',
      },
      golden: {
        spot: 'Telegrafbukta beach (Vibrant pastel sunset over the sound)',
        tip: 'Watch the skies turn violet and gold over the Arctic sea.',
      },
      blue: {
        spot: 'Pust Tromsø floating sauna or Prestvannet nature trail',
        tip: 'The famed Arctic Blue Hour: magical cobalt twilight.',
      },
      night: {
        spot: 'Northern Lights safari or steamy harbor sauna',
        tip: 'Vibrant green Aurora borealis ribbons sweeping across the sky.',
      },
    },
  },
  Stavanger: {
    lat: 58.97,
    lng: 5.7331,
    no: {
      noon: {
        spot: 'Dalsnuten & Gramstad (Fullt dagslys over Lysefjorden og Jæren)',
        tip: 'Matpakke og kikkert på Dalsnuten!',
      },
      golden: {
        spot: 'Sverd i fjell & Hafrsfjord (Gyldent lys over vikingmonumentet)',
        tip: 'Klatre i steinene ved vikingsverdene i kveldssolen.',
      },
      blue: {
        spot: 'Fargegaten & Damp Fjordbadstue i Badedammen',
        tip: 'Lune kafeer i Fargegaten med varm sjokolade.',
      },
      night: {
        spot: 'Damp Sauna eller kveldstur langs Breiavatnet',
        tip: 'Stjerneklart over fjorden!',
      },
    },
    en: {
      noon: {
        spot: 'Dalsnuten & Gramstad (Panoramic daylight over fjords and coastal plains)',
        tip: 'Fresh sea breezes and stunning views towards Lysefjorden.',
      },
      golden: {
        spot: 'Swords in Rock & Hafrsfjord (Warm golden sunset at Viking monument)',
        tip: 'Iconic bronze Viking swords glowing in the sunset.',
      },
      blue: {
        spot: 'Fargegaten colorful quarter & Damp Fjord Sauna',
        tip: 'Vibrant street life and warm cafes during blue hour.',
      },
      night: {
        spot: 'Damp Sauna in Badedammen or evening stroll around Breiavatnet',
        tip: 'Reflections of city lights across the tranquil harbor.',
      },
    },
  },
  Kristiansand: {
    lat: 58.1599,
    lng: 8.0182,
    no: {
      noon: {
        spot: 'Baneheia & 3. Stampe (Sørlandssol og lune svaberg)',
        tip: 'Løp rundt Ravnedalen og spis is i solen!',
      },
      golden: {
        spot: 'Odderøya Fyr (Gyllent solfall over Skagerrak)',
        tip: 'Speid etter båter fra fyret mens solen går ned.',
      },
      blue: {
        spot: 'Fiskebrygga & Bystranda Sauna',
        tip: 'Kveldsstemning langs bryggene med varm fiskekake.',
      },
      night: {
        spot: 'Bystranda badstue i vannkanten',
        tip: 'Hør bølgeskvulpet i nattemørket.',
      },
    },
    en: {
      noon: {
        spot: 'Baneheia forest trails & Ravnedalen park (Sunlit granite rocks)',
        tip: 'Explore forested lakes and warm coastal microclimates.',
      },
      golden: {
        spot: 'Odderøya Lighthouse (Golden sunset stretching over Skagerrak sea)',
        tip: 'Historic fortress paths with sweeping ocean horizons.',
      },
      blue: {
        spot: 'Fiskebrygga canal wharves & Bystranda Sauna',
        tip: 'Cozy seafood dinners and illuminated waterfront paths.',
      },
      night: {
        spot: 'Bystranda beach sauna right by the water',
        tip: 'Starlit sea dips and wood-fired warmth in the coastal night.',
      },
    },
  },
  Oslo: {
    lat: 59.9139,
    lng: 10.7522,
    no: {
      noon: {
        spot: 'Frognerseteren & Vettakollen (Panoramasol over Oslofjorden)',
        tip: 'Eplekake på Frognerseteren og klatretur i Vettakollen!',
      },
      golden: {
        spot: 'Ekebergparken & Havnepromenaden (Gyldent kveldsskjær over byen)',
        tip: 'Finn skulpturene i skogen mens solen går ned bak åsene.',
      },
      blue: {
        spot: 'KOK Badstue på Langkaia eller lune kafeer på Grünerløkka',
        tip: 'Langs Akerselva tennes lyktene – tid for bolle!',
      },
      night: {
        spot: 'KOK Sørenga eller stjernekikkert på Tryvann',
        tip: 'Oslos lys glitrer i fjorden under stjernehimmelen.',
      },
    },
    en: {
      noon: {
        spot: 'Frognerseteren & Vettakollen (Wide-open daylight over Oslofjord)',
        tip: 'Legendary apple pie and top-of-the-city panoramic views.',
      },
      golden: {
        spot: 'Ekeberg Sculpture Park & Harbor Promenade (Golden skyline glow)',
        tip: 'Stroll among outdoor sculptures as the city skyline turns gold.',
      },
      blue: {
        spot: 'KOK Floating Sauna by the Opera or cozy Grünerløkka cafes',
        tip: 'City lights reflecting in the fjord at twilight.',
      },
      night: {
        spot: 'KOK Sørenga floating sauna or stargazing from Holmenkollen',
        tip: 'Dipping into the cold fjord under the illuminated skyline.',
      },
    },
  },
};

// Subtil mekanisk Leica/urverk mikrolyd via Web Audio API (0 eksterne lydfiler)
function playMechanicalTick(isMuted: boolean, pitch: number = 800) {
  if (isMuted || typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.015);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.018);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.02);
  } catch {
    // Ignorer hvis lydblokkert av nettleseren
  }
}

export const SolarAstrolabe: React.FC<SolarAstrolabeProps> = ({
  city,
  lat = 60.3913, // Bergen default
  lng = 5.3221,
  currentSolar,
  onSelectScrubTime,
  lang = 'no',
}) => {
  const profile = CITY_PROFILES[city] || CITY_PROFILES['Bergen'];
  const effectiveLat = profile ? profile.lat : lat;
  const effectiveLng = profile ? profile.lng : lng;

  const now = new Date();
  const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();

  // Scrub-tid i minutter fra midnatt (f.eks. 12:00 = 720 minutter)
  const [scrubMinutes, setScrubMinutes] = useState<number>(currentMinutesFromMidnight);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true); // Dempet som standard
  const [ambientLuxDetected, setAmbientLuxDetected] = useState<number | null>(null);

  // Sporing av fysisk lyssensor (AmbientLightSensor) om tilgjengelig i nettleseren
  useEffect(() => {
    if (typeof window !== 'undefined' && 'AmbientLightSensor' in window) {
      try {
        const Sensor = (window as unknown as { AmbientLightSensor: new () => { illuminance: number; start: () => void; addEventListener: (t: string, cb: () => void) => void } }).AmbientLightSensor;
        const sensor = new Sensor();
        sensor.addEventListener('reading', () => {
          setAmbientLuxDetected(Math.round(sensor.illuminance));
        });
        sensor.start();
      } catch {
        // Fallback til ingen sensor
      }
    }
  }, []);

  // Beregn solposisjon for valgt scrub-tid
  const scrubSolar = useMemo(() => {
    const targetDate = new Date();
    targetDate.setHours(Math.floor(scrubMinutes / 60));
    targetDate.setMinutes(scrubMinutes % 60);
    targetDate.setSeconds(0);

    const { altitude, azimuth } = calculateSolarAltitude(targetDate, effectiveLat, effectiveLng);
    const alt = Math.round(altitude * 10) / 10;
    const az = Math.round(azimuth * 10) / 10;

    // Estimert luks basert på solhøyde og typisk skydekke (40 %)
    let lux = 0;
    if (alt > 0) {
      lux = Math.round(Math.sin((Math.max(0, alt) * Math.PI) / 180) * 45000 * 0.65);
    }

    // Finn himmelretning (f.eks. Sør-Sørøst)
    const directions = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV', 'N'];
    const compassIndex = Math.round((az % 360) / 45);
    const compassDir = directions[compassIndex] || 'S';

    const langKey = lang === 'en' ? 'en' : 'no';
    const cityTexts = profile ? profile[langKey] : CITY_PROFILES['Bergen'][langKey];

    // Fargetemperatur og atmosfære
    let phaseName = lang === 'en' ? 'Night & Starlight / Aurora' : 'Natt & Stjernehimmel';
    let phaseAccent = 'from-indigo-950 via-zinc-950 to-zinc-950';
    let spotHighlight = cityTexts.night.spot;
    let childTip = cityTexts.night.tip;

    if (alt > 15) {
      phaseName = lang === 'en' ? 'Peak Daylight Window' : 'Middagslystopp (Maks Dagslys)';
      phaseAccent = 'from-amber-500/20 via-orange-950/40 to-zinc-950';
      spotHighlight = cityTexts.noon.spot;
      childTip = cityTexts.noon.tip;
    } else if (alt > 0) {
      phaseName = lang === 'en' ? 'Golden Hour (Low Sun Angle)' : 'Gylden Time (The Golden Hour)';
      phaseAccent = 'from-orange-600/25 via-amber-950/40 to-zinc-950';
      spotHighlight = cityTexts.golden.spot;
      childTip = cityTexts.golden.tip;
    } else if (alt > -6) {
      phaseName = lang === 'en' ? 'Arctic Blue Hour & Twilight' : 'Blåtime & Skumring';
      phaseAccent = 'from-sky-950/40 via-blue-950/30 to-zinc-950';
      spotHighlight = cityTexts.blue.spot;
      childTip = cityTexts.blue.tip;
    }

    return {
      altitude: alt,
      azimuth: az,
      lux,
      compassDir,
      phaseName,
      phaseAccent,
      spotHighlight,
      childTip,
      isDaylight: alt > 0,
      hourFormatted: `${String(Math.floor(scrubMinutes / 60)).padStart(2, '0')}:${String(scrubMinutes % 60).padStart(2, '0')}`,
    };
  }, [scrubMinutes, effectiveLat, effectiveLng, profile, lang]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setScrubMinutes(val);
    setIsLive(false);

    // Haptisk feedback på mobil
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(8);
    }

    // Mekanisk klikk-lyd
    playMechanicalTick(isMuted, 600 + (val / 1440) * 400);

    if (onSelectScrubTime) {
      onSelectScrubTime(Math.floor(val / 60), val % 60);
    }
  };

  const handleResetToLive = () => {
    setScrubMinutes(currentMinutesFromMidnight);
    setIsLive(true);
    playMechanicalTick(isMuted, 1000);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([15, 20, 15]);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-b ${scrubSolar.phaseAccent} border border-white/10 p-5 sm:p-7 shadow-2xl transition-all duration-500 text-white`}>
      {/* Bakgrunns-glød som følger solen */}
      <div 
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700"
        style={{
          backgroundColor: scrubSolar.isDaylight 
            ? 'rgba(232, 98, 44, 0.18)' 
            : 'rgba(59, 130, 246, 0.12)',
        }}
      />

      {/* HEADER: Tittel + Live/Reset + Barn/Voksen-bryter */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Compass className="w-5 h-5 animate-[spin_20s_linear_infinite]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-wider uppercase text-zinc-200">
                {lang === 'en' ? 'The Tactile Solar Astrolabe' : 'Det Taktile Sol-Astrolabiet'}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400 border border-amber-500/20 font-bold">
                {lang === 'en' ? 'NOAA Spencer Solar Engine' : 'NOAA Spencer-kjerne'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {lang === 'en'
                ? `Scrub the solar arc to see sun angle, daylight lux, and mountain shadows in ${city}.`
                : `Dra i solbuen for å se skyggefall, luks og solvegger i ${city} gjennom døgnet.`}
            </p>
          </div>
        </div>

        {/* Kontroller: Lydbryter + Live/Nå-knapp */}
        <div className="flex items-center gap-2">
          {/* Lyd (Valgfri mikrolyd) */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
              isMuted 
                ? 'bg-zinc-900/80 border-zinc-800 text-zinc-500 hover:text-zinc-300' 
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            }`}
            title={isMuted ? 'Slå på mekanisk klikkelyd' : 'Demp klikkelyd'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Reset til sanntid */}
          {!isLive && (
            <button
              type="button"
              onClick={handleResetToLive}
              className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm animate-pulse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? `Now (${currentSolar.actualEstimatedLux} lux)` : `Nå (${currentSolar.actualEstimatedLux} luks)`}</span>
            </button>
          )}
        </div>
      </div>

      {/* SELVE SOLBUEN (Hovedinstrumentet) */}
      <div className="relative z-10 py-6 space-y-4">
        {/* Stor tids- og telemetrivisning */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Klokkeslett */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-md">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
              {lang === 'en' ? 'Simulated Sun Time' : 'Simulert Soltid'}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-0.5">
              {scrubSolar.hourFormatted}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
              {isLive 
                ? (lang === 'en' ? '● Live Solar Sync' : '● Sanntids-synk') 
                : (lang === 'en' ? '○ Time Scrubbed' : '○ Tidsstyrt')}
            </div>
          </div>

          {/* Solhøyde over horisonten */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-md">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
              {lang === 'en' ? 'Solar Altitude' : 'Solhøyde'}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-zinc-100 mt-0.5">
              {scrubSolar.altitude > 0 ? `+${scrubSolar.altitude}°` : `${scrubSolar.altitude}°`}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
              {scrubSolar.isDaylight 
                ? (lang === 'en' ? 'Sun above horizon' : 'Solen over horisonten') 
                : (lang === 'en' ? 'Below horizon' : 'Under horisonten')}
            </div>
          </div>

          {/* Dagslysstyrke i Luks */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-md">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
              {lang === 'en' ? 'Daylight Strength' : 'Dagslysstyrke'}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-orange-400 mt-0.5">
              {scrubSolar.lux.toLocaleString(lang === 'en' ? 'en-US' : 'no-NO')} <span className="text-xs font-normal text-zinc-400">{lang === 'en' ? 'lux' : 'luks'}</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
              {scrubSolar.lux > 10000 
                ? (lang === 'en' ? 'Circadian Peak Light' : 'Optimal døgnrytme') 
                : (lang === 'en' ? 'Soft Twilight' : 'Skumringslys')}
            </div>
          </div>

          {/* Himmelretning (Azimut) */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-md">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
              {lang === 'en' ? 'Compass Heading' : 'Kompassretning'}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-zinc-100 mt-0.5 flex items-center gap-1.5">
              <span>{scrubSolar.compassDir}</span>
              <span className="text-xs text-zinc-400 font-mono font-normal">({scrubSolar.azimuth}°)</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
              {scrubSolar.phaseName.split(' ')[0]}
            </div>
          </div>
        </div>

        {/* INTERAKTIV SOL-SCRUBBER SLIDER (Mekanisk instrument) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono px-1">
            <span className="flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              06:00
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <Sun className="w-3.5 h-3.5" />
              12:00 {lang === 'en' ? 'Midday' : 'Middag'}
            </span>
            <span className="flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              22:00 {lang === 'en' ? 'Evening' : 'Kveld'}
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min={360} // 06:00
              max={1320} // 22:00
              step={15} // 15-minutters mekaniske trinn
              value={scrubMinutes}
              onChange={handleSliderChange}
              className="w-full h-3 bg-zinc-900 rounded-full appearance-none cursor-pointer border border-white/15 focus:outline-none accent-[#E8622C]"
            />
          </div>
        </div>

        {/* DYNAMISK LOKAL SOL-RADAR: Hva skjer i valgt by akkurat på dette klokkeslettet? */}
        <div className="p-4 rounded-2xl bg-zinc-950/90 border border-amber-500/30 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400">
                {lang === 'en' 
                  ? 'Best Sun Wall & Experience at ' + scrubSolar.hourFormatted 
                  : 'Beste Solvegg & Opplevelse kl. ' + scrubSolar.hourFormatted}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                {scrubSolar.phaseName}
              </span>
            </div>

            <p className="text-xs text-zinc-200 leading-relaxed">
              {lang === 'en'
                ? `📍 ${scrubSolar.spotHighlight}. Sun angle (${scrubSolar.altitude}°) casts minimal mountain shadow here now.`
                : `📍 ${scrubSolar.spotHighlight}. Solens vinkel (${scrubSolar.altitude}°) kaster minimalt med skygge her nå.`}
            </p>
          </div>
        </div>

        {/* Omgivelseslys-sensor (hvis tilgjengelig) */}
        {ambientLuxDetected !== null && (
          <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2 pt-1 px-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              {lang === 'en'
                ? <>Ambient light sensor detected: <strong>{ambientLuxDetected} lux</strong> in your room.</>
                : <>Telefonens lyssensor måler: <strong>{ambientLuxDetected} luks</strong> i rommet ditt.</>}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
