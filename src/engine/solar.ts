/**
 * Sol- og dagslysberegningsmotor for Utaktiv
 * Basert på astronomiske solformler (Spencer/NOAA) tilpasset nordiske breddegrader.
 */

export interface SolarStatus {
  solarAltitudeDegrees: number;
  azimuthDegrees: number;
  isDaylight: boolean;
  clearSkyLux: number;
  cloudCoverPercent: number; // 0–100. Standard 40 når ingen måling sendes inn.
  actualEstimatedLux: number;
  uvIndex: number;
  circadianWindow: 'morning' | 'midday' | 'evening' | 'night';
  melatoninImpact: string;
  /** Satt bare når et MET-kall eller en eksplisitt fallback er brukt. */
  weatherSource?: 'met-norway' | 'fallback';
  temperatureC?: number;
}

export interface MetSolarInput {
  cloudCoverPercent: number;
  temperatureC?: number;
}

/**
 * Beregner solas høyde over horisonten
 */
export function calculateSolarAltitude(
  date: Date,
  lat: number,
  lng: number
): { altitude: number; azimuth: number } {
  const dayOfYear = getDayOfYear(date);
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  // Solas deklinasjon (Spencer 1971 / NOAA)
  const b = (2 * Math.PI * (dayOfYear - 1)) / 365;
  const declination =
    0.006918 -
    0.399912 * Math.cos(b) +
    0.070257 * Math.sin(b) -
    0.006758 * Math.cos(2 * b) +
    0.000907 * Math.sin(2 * b) -
    0.002697 * Math.cos(3 * b) +
    0.00148 * Math.sin(3 * b);

  // Tidsjevning i minutter
  const eqtime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(b) -
      0.032077 * Math.sin(b) -
      0.014615 * Math.cos(2 * b) -
      0.040849 * Math.sin(2 * b));

  const timeOffset = eqtime + 4 * lng;
  const tst = hour * 60 + timeOffset;
  const solarHour = (tst / 4) - 180;
  const haRad = (solarHour * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;

  const sinAlt =
    Math.sin(latRad) * Math.sin(declination) +
    Math.cos(latRad) * Math.cos(declination) * Math.cos(haRad);
  const altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const altitude = (altRad * 180) / Math.PI;

  // Azimut med klokken fra nord. NOAA-cos av deklinasjon, bredde og timevinkel.
  // Timevinkel > 0 er etter soltid-middag, da står solen vest for sør.
  const cosAlt = Math.cos(altRad);
  let azimuth = 180;
  if (Math.abs(cosAlt) > 1e-6) {
    const cosAz =
      (Math.sin(declination) * Math.cos(latRad) -
        Math.cos(declination) * Math.sin(latRad) * Math.cos(haRad)) /
      cosAlt;
    azimuth = (Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180) / Math.PI;
    if (solarHour > 0) azimuth = 360 - azimuth;
  }

  return { altitude, azimuth };
}

export function estimateLux(altitudeDegrees: number, cloudCoverPercent: number): number {
  if (altitudeDegrees <= -6) return 0; // Astronomisk / nautisk mørke
  if (altitudeDegrees <= 0) return 500 * (1 + altitudeDegrees / 6); // Skumring

  // Klar himmel: luks som funksjon av solhøyde
  const clearSkyLux = Math.min(
    110000,
    Math.round(100000 * Math.sin((altitudeDegrees * Math.PI) / 180))
  );

  // Demping ved skydekke (MET Norway cloud_area_fraction)
  const cloudFraction = Math.max(0, Math.min(100, cloudCoverPercent)) / 100;
  const actualLux = Math.round(clearSkyLux * (1 - 0.75 * Math.pow(cloudFraction, 2)));

  return Math.max(300, actualLux);
}

export function estimateUvIndex(altitudeDegrees: number, cloudCoverPercent: number): number {
  if (altitudeDegrees <= 0) return 0;
  const clearUv = Math.max(0, Math.sin((altitudeDegrees * Math.PI) / 180) * 8.5);
  const cloudFraction = Math.max(0, Math.min(100, cloudCoverPercent)) / 100;
  const actualUv = clearUv * (1 - 0.6 * cloudFraction);
  return Math.round(actualUv * 10) / 10;
}

export function getSolarStatus(date: Date, lat: number, lng: number, cloudCoverPercent = 40): SolarStatus {
  const { altitude, azimuth } = calculateSolarAltitude(date, lat, lng);
  const clearSkyLux = estimateLux(altitude, 0);
  const actualEstimatedLux = estimateLux(altitude, cloudCoverPercent);
  const uvIndex = estimateUvIndex(altitude, cloudCoverPercent);
  const hour = date.getHours();

  let circadianWindow: SolarStatus['circadianWindow'] = 'night';
  let melatoninImpact = 'Rolig hvile';

  if (hour >= 6 && hour < 11) {
    circadianWindow = 'morning';
    melatoninImpact = 'Kritisk fase: Lyset nullstiller døgnklokken og gir dopaminboost for hele dagen.';
  } else if (hour >= 11 && hour < 17) {
    circadianWindow = 'midday';
    melatoninImpact = 'Høyest luks og D-vitaminproduksjon. Gir maksimal våkenhet og energi.';
  } else if (hour >= 17 && hour < 21) {
    circadianWindow = 'evening';
    melatoninImpact = 'Mykt kveldslys forbereder kveldens melatoninutskillelse for dyp søvn.';
  }

  return {
    solarAltitudeDegrees: Math.round(altitude * 10) / 10,
    azimuthDegrees: Math.round(azimuth * 10) / 10,
    isDaylight: altitude > -4,
    clearSkyLux,
    cloudCoverPercent,
    actualEstimatedLux,
    uvIndex,
    circadianWindow,
    melatoninImpact,
  };
}

/** Kobler et ekte MET-svar til solstatus. App.tsx kaller dette når den er klar. */
export function buildSolarStatusFromMet(
  date: Date,
  lat: number,
  lng: number,
  met: MetSolarInput
): SolarStatus {
  const status = getSolarStatus(date, lat, lng, met.cloudCoverPercent);
  return {
    ...status,
    weatherSource: 'met-norway',
    ...(typeof met.temperatureC === 'number' ? { temperatureC: met.temperatureC } : {}),
  };
}

function getDayOfYear(d: Date): number {
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 0));
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
