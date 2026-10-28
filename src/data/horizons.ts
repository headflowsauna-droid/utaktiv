import type { HorizonProfile } from '../engine/sunPlace';

/**
 * Ryggvinkel per 15 grader, fra nord og med klokken.
 * Målt 25. oktober 2026 mot Kartverket hoydedata.
 * 0 betyr åpent vann eller lavere terreng. Negativ vinkel er ikke brukt,
 * så sola under den astronomiske horisonten ikke blir en ekstra oppdiktet time.
 */
export const HORIZONS: Record<string, HorizonProfile> = {
  "nordnesparken": {
    id: "nordnesparken",
    lat: 60.3989675,
    lng: 5.3025007,
    groundMeters: 2.2,
    ridgeDeg: [1.2, 2.95, 5.02, 8.32, 8.26, 7.16, 7.92, 6.74, 4.94, 1.86, 1.66, 4.89, 2.5, 4.53, 4.69, 0.31, 2.19, 1.28, 0.51, 0.73, 0.67, 0.46, 0.01, 0.09],
    fetchedOn: "2026-10-25",
    source: "Kartverket hoydedata ws.geonorge.no/hoydedata/v1/punkt koordsys=4258",
  },
  "svanevik-solheimsvannet": {
    id: "svanevik-solheimsvannet",
    lat: 60.3681821,
    lng: 5.3476255,
    groundMeters: 20.3,
    ridgeDeg: [5.7, 7.57, 3.3, 3.44, 6.47, 10.72, 9.58, 6.95, 5.38, 4.03, 4.57, 4.23, 3.4, 0.28, 3.6, 10.69, 15.43, 14.88, 13.29, 9.93, 5.06, 0.56, 0.65, 1.31],
    fetchedOn: "2026-10-25",
    source: "Kartverket hoydedata ws.geonorge.no/hoydedata/v1/punkt koordsys=4258",
  },
  "saetregaarden": {
    id: "saetregaarden",
    lat: 60.5035909,
    lng: 5.3021345,
    groundMeters: 216.4,
    ridgeDeg: [0.11, 0.08, 0.69, 2.23, 5.59, 9.35, 12.97, 12.63, 9.42, 4.47, 7.8, 10.41, 12.53, 12.69, 15.77, 14.29, 16.24, 16.09, 14.64, 8.18, 5.9, 2.15, 0.0, 0.0],
    fetchedOn: "2026-10-25",
    source: "Kartverket hoydedata ws.geonorge.no/hoydedata/v1/punkt koordsys=4258",
  },
  "alpakkaparken": {
    id: "alpakkaparken",
    lat: 60.6027389,
    lng: 5.0491056,
    groundMeters: 14.3,
    ridgeDeg: [2.62, 1.64, 2.2, 1.91, 2.35, 1.61, 2.46, 0.1, 0.75, 2.31, 4.97, 7.6, 6.68, 4.02, 3.83, 2.6, 2.79, 1.86, 0.63, 0.15, 1.75, 2.02, 2.74, 2.67],
    fetchedOn: "2026-10-25",
    source: "Kartverket hoydedata ws.geonorge.no/hoydedata/v1/punkt koordsys=4258",
  },
};
