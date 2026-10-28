import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ActivityItem } from '../engine/activities';
import { UserProfile } from '../engine/profile';
import { CompletedCheckin, calculateDistanceMeters } from '../engine/checkin';
import { 
  Navigation, 
  Award, 
  Layers, 
  LocateFixed
} from 'lucide-react';

interface InteractiveMapProps {
  activities: ActivityItem[];
  profile: UserProfile;
  completedCheckins: CompletedCheckin[];
  onOpenTicket: (activity: ActivityItem) => void;
  onOpenCheckin: (activity: ActivityItem) => void;
  focusTarget?: {
    query?: string;
    category?: string;
    lat?: number;
    lng?: number;
    zoom?: number;
  } | null;
  onClearFocus?: () => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  activities,
  profile,
  completedCheckins,
  onOpenTicket,
  onOpenCheckin,
  focusTarget,
  onClearFocus,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayersGroupRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [mapTheme, setMapTheme] = useState<'dark' | 'topo' | 'osm'>('dark');
  const [showGeofences, setShowGeofences] = useState<boolean>(true);
  const [locating, setLocating] = useState<boolean>(false);
  const [nearestActivity, setNearestActivity] = useState<{ activity: ActivityItem; distMeters: number } | null>(null);

  // By-koordinater for hurtignavigasjon
  const CITY_COORDS: Record<string, { lat: number; lng: number; zoom: number }> = {
    Bergen: { lat: 60.3913, lng: 5.3221, zoom: 13 },
    Oslo: { lat: 59.9139, lng: 10.7522, zoom: 13 },
    Stavanger: { lat: 58.9700, lng: 5.7331, zoom: 13 },
    Trondheim: { lat: 63.4305, lng: 10.3951, zoom: 13 },
    Kristiansand: { lat: 58.1599, lng: 8.0182, zoom: 13 },
    Bodø: { lat: 67.2804, lng: 14.4049, zoom: 13 },
    Voss: { lat: 60.6280, lng: 6.4180, zoom: 13 },
    Hemsedal: { lat: 60.8601, lng: 8.5529, zoom: 13 },
  };

  // 1. Initialiser Leaflet kart
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCity = profile.city in CITY_COORDS ? profile.city : 'Bergen';
    const initialConfig = CITY_COORDS[initialCity] || { lat: 60.3913, lng: 5.3221, zoom: 13 };

    const map = L.map(mapContainerRef.current, {
      center: [initialConfig.lat, initialConfig.lng],
      zoom: initialConfig.zoom,
      zoomControl: false,
    });

    // Legg til zoom-kontroll oppe til høyre
    L.control.zoom({ position: 'topright' }).addTo(map);

    tileLayersGroupRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    circlesLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 1b. Håndter kartlag (Mørk ESRI, Turkart OpenTopoMap, eller standard OSM)
  useEffect(() => {
    const tileGroup = tileLayersGroupRef.current;
    if (!tileGroup) return;

    tileGroup.clearLayers();

    if (mapTheme === 'dark') {
      // ESRI Dark Gray Canvas — ekte mørk kartografi uten API-nøkkel eller vannmerke
      const base = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
          maxZoom: 16,
        }
      );
      const ref = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '',
          maxZoom: 16,
        }
      );
      tileGroup.addLayer(base);
      tileGroup.addLayer(ref);
    } else if (mapTheme === 'topo') {
      // OpenTopoMap for fotturer, fjelltopper og terrengkonturer
      const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Kartdata: &copy; OpenStreetMap, SRTM | Kart: &copy; OpenTopoMap',
        maxZoom: 17,
      });
      tileGroup.addLayer(topo);
    } else {
      // Standard OpenStreetMap gateplan
      const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      });
      tileGroup.addLayer(osm);
    }
  }, [mapTheme]);

  // 2. Sentrer kartet når brukerens by endres i profilen
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (CITY_COORDS[profile.city]) {
      const cfg = CITY_COORDS[profile.city];
      mapInstanceRef.current.setView([cfg.lat, cfg.lng], cfg.zoom, { animate: true });
    }
  }, [profile.city]);

  // 2b. Hurtignavigasjon fra Sol Concierge (f.eks. "Vis Fløyen-ruter på kartet")
  useEffect(() => {
    if (!focusTarget || !mapInstanceRef.current) return;
    if (focusTarget.lat && focusTarget.lng) {
      mapInstanceRef.current.flyTo([focusTarget.lat, focusTarget.lng], focusTarget.zoom || 15, {
        animate: true,
        duration: 1.2,
      });
    }
    if (focusTarget.category) {
      setSelectedCategory(focusTarget.category);
    }
  }, [focusTarget]);

  // 3. Hjelpefunksjon for å hente kategori-stil
  const getCategoryTheme = (category: string, isCompleted: boolean) => {
    if (isCompleted) {
      return {
        bg: '#059669', // emerald-600
        border: '#34d399', // emerald-400
        icon: '🏆',
        glow: 'rgba(52, 211, 153, 0.4)',
      };
    }
    switch (category) {
      case 'concert':
        return {
          bg: '#ea580c', // orange-600
          border: '#fb923c', // orange-400
          icon: '🎸',
          glow: 'rgba(251, 146, 60, 0.45)',
        };
      case 'sports':
        return {
          bg: '#059669', // emerald-600
          border: '#34d399', // emerald-400
          icon: '🏔️',
          glow: 'rgba(52, 211, 153, 0.4)',
        };
      case 'family':
      case 'show':
        return {
          bg: '#7c3aed', // purple-600
          border: '#c084fc', // purple-400
          icon: '🌲',
          glow: 'rgba(192, 132, 252, 0.4)',
        };
      case 'cafebar':
        return {
          bg: '#d97706', // amber-600
          border: '#fcd34d', // amber-300
          icon: '☀️',
          glow: 'rgba(252, 211, 77, 0.4)',
        };
      case 'festival':
        return {
          bg: '#e11d48', // rose-600
          border: '#fb7185', // rose-400
          icon: '🪂',
          glow: 'rgba(251, 113, 133, 0.4)',
        };
      case 'accommodation':
      case 'hostel':
        return {
          bg: '#0284c7', // sky-600
          border: '#38bdf8', // sky-400
          icon: '🏨',
          glow: 'rgba(56, 189, 248, 0.45)',
        };
      default:
        return {
          bg: '#ea580c',
          border: '#fb923c',
          icon: '📍',
          glow: 'rgba(251, 146, 60, 0.45)',
        };
    }
  };

  // 4. Tegn markører og stempelsirkler
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const circlesLayer = circlesLayerRef.current;

    if (!map || !markersLayer || !circlesLayer) return;

    markersLayer.clearLayers();
    circlesLayer.clearLayers();

    const filtered = activities.filter(act => {
      if (focusTarget?.query) {
        const q = focusTarget.query.toLowerCase();
        const matches =
          act.title.toLowerCase().includes(q) ||
          act.locationName.toLowerCase().includes(q) ||
          act.description.toLowerCase().includes(q);
        if (matches) return true;
      }
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'badges') return !!act.checkinTarget;
      return act.category === selectedCategory;
    });

    filtered.forEach(act => {
      const isCompleted = completedCheckins.some(c => c.activityId === act.id);
      const theme = getCategoryTheme(act.category, isCompleted);

      // Egendefinert HTML DivIcon
      const markerHtml = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 9999px;
          background: ${theme.bg};
          border: 2.5px solid ${theme.border};
          box-shadow: 0 0 16px ${theme.glow}, 0 4px 6px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: transform 0.2s ease;
          position: relative;
        ">
          <span style="font-size: 16px; line-height: 1;">${theme.icon}</span>
          ${isCompleted ? `
            <div style="
              position: absolute;
              top: -4px;
              right: -4px;
              width: 16px;
              height: 16px;
              border-radius: 9999px;
              background: #10b981;
              border: 1.5px solid #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 9px;
              color: white;
              font-weight: bold;
            ">✓</div>
          ` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'sol-custom-marker',
        html: markerHtml,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -22],
      });

      const marker = L.marker([act.coordinates.lat, act.coordinates.lng], { icon: customIcon });

      // Tegn GPS-radius sirkel dersom stempelpost finnes
      if (act.checkinTarget && showGeofences) {
        const radiusM = act.checkinTarget.radiusMeters || 400;
        const circle = L.circle([act.coordinates.lat, act.coordinates.lng], {
          radius: radiusM,
          color: isCompleted ? '#10b981' : '#f97316',
          weight: 1.5,
          opacity: 0.8,
          dashArray: '4, 6',
          fillColor: isCompleted ? '#10b981' : '#f97316',
          fillOpacity: 0.08,
        });
        circle.addTo(circlesLayer);
      }

      // Marker popup med skreddersydd dark theme
      const popupContent = `
        <div style="padding: 14px; min-width: 250px; font-family: inherit;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${theme.border}; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 9999px;">
              ${act.category.toUpperCase()}
            </span>
            <span style="font-size: 11px; font-weight: 600; color: #fbbf24; display: flex; align-items: center; gap: 3px;">
              ☀️ ${(act.estimatedLux / 1000).toFixed(0)}k luks
            </span>
          </div>

          <h4 style="font-size: 14px; font-weight: 700; color: #ffffff; margin: 0 0 4px 0; line-height: 1.3;">
            ${act.title}
          </h4>

          <div style="font-size: 11px; color: #a1a1aa; margin-bottom: 10px; display: flex; align-items: center; gap: 4px;">
            <span>📍</span> <span>${act.locationName}, ${act.city}</span>
          </div>

          ${act.checkinTarget ? `
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 6px 10px; margin-bottom: 10px; font-size: 11px; color: #6ee7b7; display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 600;">${act.checkinTarget.badgeName}</span>
              <span style="font-family: monospace; font-size: 10px;">±${act.checkinTarget.radiusMeters}m</span>
            </div>
          ` : ''}

          <div style="display: flex; gap: 6px;">
            ${act.ticket ? `
              <button id="map-btn-ticket-${act.id}" style="
                flex: 1;
                background: #ea580c;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 7px 10px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.15s;
              ">
                Kjøp billett (${act.ticket.priceNok} kr)
              </button>
            ` : ''}

            ${act.checkinTarget ? `
              <button id="map-btn-checkin-${act.id}" style="
                flex: 1;
                background: ${isCompleted ? '#064e3b' : '#059669'};
                color: ${isCompleted ? '#6ee7b7' : '#ffffff'};
                border: 1px solid ${isCompleted ? '#059669' : 'transparent'};
                border-radius: 8px;
                padding: 7px 10px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
              ">
                ${isCompleted ? '✓ Fullført' : 'GPS Innsjekk'}
              </button>
            ` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300 });

      // Lytter på popup open for å koble til React callbacks
      marker.on('popupopen', () => {
        const ticketBtn = document.getElementById(`map-btn-ticket-${act.id}`);
        if (ticketBtn) {
          ticketBtn.onclick = () => onOpenTicket(act);
        }
        const checkinBtn = document.getElementById(`map-btn-checkin-${act.id}`);
        if (checkinBtn) {
          checkinBtn.onclick = () => onOpenCheckin(act);
        }
      });

      marker.addTo(markersLayer);
    });
  }, [activities, selectedCategory, showGeofences, completedCheckins]);

  // 5. GPS: Hent brukerens nåværende posisjon
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolokasjon støttes ikke av nettleseren.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const map = mapInstanceRef.current;
        if (!map) return;

        // Sentrer kartet mot brukeren
        map.setView([lat, lng], 14, { animate: true });

        // Oppdater eller lag bruker-markør med pulserende GPS-ring
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([lat, lng]);
        } else {
          const userIcon = L.divIcon({
            className: 'user-gps-marker',
            html: `
              <div style="position: relative; width: 24px; height: 24px;">
                <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(59, 130, 246, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="position: absolute; inset: 4px; border-radius: 9999px; background: #3b82f6; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          userMarkerRef.current = L.marker([lat, lng], { icon: userIcon }).addTo(map);
          userMarkerRef.current.bindPopup(`
            <div style="padding: 10px; font-size: 12px; color: white;">
              <strong>📍 Din nåværende GPS-posisjon</strong>
              <div style="color: #93c5fd; font-size: 10px; margin-top: 4px;">Nøyaktighet: ±${Math.round(pos.coords.accuracy)}m</div>
            </div>
          `);
        }

        // Beregn nærmeste aktivitet
        let closest: { activity: ActivityItem; distMeters: number } | null = null;
        activities.forEach(act => {
          const d = calculateDistanceMeters(lat, lng, act.coordinates.lat, act.coordinates.lng);
          if (!closest || d < closest.distMeters) {
            closest = { activity: act, distMeters: d };
          }
        });
        setNearestActivity(closest);
      },
      err => {
        setLocating(false);
        console.warn('GPS feilet eller tillatelse ble avvist:', err);
        // Fallback til profilkoordinater hvis GPS ikke er tillatt
        const map = mapInstanceRef.current;
        if (map && profile.coordinates) {
          map.setView([profile.coordinates.lat, profile.coordinates.lng], 13, { animate: true });
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // 6. Hurtig-zoom til by
  const handleJumpToCity = (cityName: string) => {
    const map = mapInstanceRef.current;
    if (!map || !CITY_COORDS[cityName]) return;
    const cfg = CITY_COORDS[cityName];
    map.setView([cfg.lat, cfg.lng], cfg.zoom, { animate: true });
  };

  return (
    <div className="space-y-3">
      {/* Banner for fokusert rute (f.eks. Fløyen fra Concierge) */}
      {focusTarget?.query && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-orange-500/15 border border-orange-500/40 text-orange-950 dark:text-orange-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">🏔️</span>
            <span>
              Viser ruter og stopp for: <strong className="font-bold">{focusTarget.query}</strong>
            </span>
          </div>
          {onClearFocus && (
            <button
              onClick={onClearFocus}
              className="text-[11px] font-semibold text-orange-600 dark:text-orange-300 hover:underline bg-white/60 dark:bg-black/40 px-2.5 py-1 rounded-lg border border-orange-500/30 cursor-pointer"
            >
              Vis alle steder
            </button>
          )}
        </div>
      )}

      {/* Kart-verktøylinje & Kategori-filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`min-h-11 px-3.5 rounded-full text-xs font-medium transition shrink-0 inline-flex items-center ${
              selectedCategory === 'all'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm'
            }`}
          >
            Alle steder ({activities.length})
          </button>
          <button
            onClick={() => setSelectedCategory('badges')}
            className={`min-h-11 px-3.5 rounded-full text-xs font-medium transition shrink-0 inline-flex items-center flex items-center gap-1.5 ${
              selectedCategory === 'badges'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 border border-zinc-200 dark:border-emerald-900/50 shadow-sm'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Kun Stempelposter
          </button>
          <button
            onClick={() => setSelectedCategory('concert')}
            className={`min-h-11 px-3.5 rounded-full text-xs font-medium transition shrink-0 inline-flex items-center ${
              selectedCategory === 'concert'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm'
            }`}
          >
            🎸 Konsert
          </button>
          <button
            onClick={() => setSelectedCategory('sports')}
            className={`min-h-11 px-3.5 rounded-full text-xs font-medium transition shrink-0 inline-flex items-center ${
              selectedCategory === 'sports'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm'
            }`}
          >
            🏔️ Fjell & Løp
          </button>
          <button
            onClick={() => setSelectedCategory('family')}
            className={`min-h-11 px-3.5 rounded-full text-xs font-medium transition shrink-0 inline-flex items-center ${
              selectedCategory === 'family'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm'
            }`}
          >
            🌲 Familie & Klatring
          </button>
          <button
            onClick={() => setSelectedCategory('cafebar')}
            className={`min-h-11 px-3.5 rounded-full text-xs font-medium transition shrink-0 inline-flex items-center ${
              selectedCategory === 'cafebar'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm'
            }`}
          >
            ☕ Sol-kafé
          </button>
        </div>

        {/* Kartstil, Geofence og Byvelger */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
          {/* Kartstil-velger */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 text-xs shadow-sm">
            <button
              onClick={() => setMapTheme('dark')}
              className={`px-2 py-1 rounded transition text-[11px] font-medium ${
                mapTheme === 'dark' ? 'bg-zinc-100 dark:bg-zinc-800 text-orange-600 dark:text-orange-400 font-semibold shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Mørk kartmodus uten vannmerke"
            >
              🌙 Mørk
            </button>
            <button
              onClick={() => setMapTheme('topo')}
              className={`px-2 py-1 rounded transition text-[11px] font-medium ${
                mapTheme === 'topo' ? 'bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-semibold shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Topografisk turkart for fjell og stier"
            >
              🏔️ Turkart
            </button>
            <button
              onClick={() => setMapTheme('osm')}
              className={`px-2 py-1 rounded transition text-[11px] font-medium ${
                mapTheme === 'osm' ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-semibold shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Standard gatekart"
            >
              🗺️ Gater
            </button>
          </div>

          <button
            onClick={() => setShowGeofences(!showGeofences)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition border flex items-center gap-1.5 shadow-sm ${
              showGeofences
                ? 'bg-orange-50 dark:bg-zinc-800 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-500/40'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800'
            }`}
            title="Slå av/på geofence sirkler"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">GPS-radius</span>
          </button>

          {/* Rask byvelger */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 text-xs shadow-sm">
            {Object.keys(CITY_COORDS).map(cName => (
              <button
                key={cName}
                onClick={() => handleJumpToCity(cName)}
                className={`px-2 py-1 rounded transition text-[11px] font-medium ${
                  profile.city.toLowerCase() === cName.toLowerCase()
                    ? 'bg-orange-500 text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {cName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kart-beholder med overlay-elementer */}
      <div className="relative w-full h-[68dvh] min-h-[420px] md:h-[540px] rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating "Finn Min Posisjon" knapp (GPS) */}
        <div className="absolute bottom-5 right-5 z-[500] flex flex-col gap-2">
          <button
            onClick={handleLocateMe}
            disabled={locating}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-zinc-900/95 hover:bg-zinc-850 border border-zinc-700/80 hover:border-orange-500/60 text-white text-xs font-semibold shadow-xl backdrop-blur-md transition group"
          >
            <LocateFixed className={`w-4 h-4 text-orange-400 ${locating ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
            <span>{locating ? 'Finner posisjon...' : 'Min GPS-posisjon'}</span>
          </button>
        </div>

        {/* Nærmeste aktivitet banner ved aktiv GPS */}
        {nearestActivity && (
          <div className="absolute top-4 left-4 z-[500] max-w-sm p-3 rounded-xl bg-zinc-900/95 border border-zinc-700/80 shadow-2xl backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Navigation className="w-3.5 h-3.5" />
                Nærmeste aktivitet fra deg:
              </span>
              <span className="font-mono text-white font-bold">
                {nearestActivity.distMeters < 1000
                  ? `${Math.round(nearestActivity.distMeters)} m`
                  : `${(nearestActivity.distMeters / 1000).toFixed(1)} km`}
              </span>
            </div>
            <div className="text-xs font-bold text-white truncate">
              {nearestActivity.activity.title}
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
              <span>{nearestActivity.activity.locationName}</span>
              {nearestActivity.activity.checkinTarget && (
                <span className="text-orange-400 font-semibold">
                  {nearestActivity.activity.checkinTarget.badgeName}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tegnforklaring (Legend) nede til venstre */}
        <div className="absolute bottom-5 left-5 z-[500] hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-zinc-950/85 border border-zinc-800/80 backdrop-blur-md text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span> Konsert
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Fjell/Løp
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> Familie
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Kafe/Sol
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full border border-emerald-400 inline-block"></span> Stempelsone
          </span>
        </div>
      </div>
    </div>
  );
};
