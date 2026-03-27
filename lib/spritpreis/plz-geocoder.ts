/**
 * PLZ → Coordinates Geocoder
 * ==========================
 * Static mapping of German PLZ prefixes (2-digit) to approximate coordinates.
 * Covers all of Germany with ~100 entries.
 * In-memory cache for exact PLZ lookups via Nominatim API fallback.
 */

interface Coordinates {
  lat: number
  lng: number
}

// Map of 2-digit PLZ prefix → approximate city center coordinates
const PLZ_PREFIX_MAP: Record<string, Coordinates> = {
  '01': { lat: 51.05, lng: 13.74 }, // Dresden
  '02': { lat: 51.15, lng: 14.97 }, // Görlitz/Bautzen
  '03': { lat: 51.76, lng: 14.33 }, // Cottbus
  '04': { lat: 51.34, lng: 12.37 }, // Leipzig
  '06': { lat: 51.48, lng: 11.97 }, // Halle
  '07': { lat: 50.88, lng: 11.59 }, // Gera/Jena
  '08': { lat: 50.72, lng: 12.49 }, // Zwickau
  '09': { lat: 50.83, lng: 12.92 }, // Chemnitz
  '10': { lat: 52.52, lng: 13.40 }, // Berlin Mitte
  '12': { lat: 52.47, lng: 13.44 }, // Berlin Süd
  '13': { lat: 52.57, lng: 13.38 }, // Berlin Nord
  '14': { lat: 52.39, lng: 13.07 }, // Potsdam
  '15': { lat: 52.35, lng: 14.55 }, // Frankfurt/Oder
  '16': { lat: 52.75, lng: 13.24 }, // Oranienburg
  '17': { lat: 53.56, lng: 13.26 }, // Neubrandenburg
  '18': { lat: 54.09, lng: 12.14 }, // Rostock
  '19': { lat: 53.63, lng: 11.41 }, // Schwerin
  '20': { lat: 53.55, lng: 9.99 },  // Hamburg
  '21': { lat: 53.47, lng: 9.97 },  // Hamburg Süd
  '22': { lat: 53.60, lng: 10.05 }, // Hamburg Ost
  '23': { lat: 53.87, lng: 10.69 }, // Lübeck
  '24': { lat: 54.32, lng: 10.14 }, // Kiel
  '25': { lat: 54.52, lng: 9.57 },  // Schleswig
  '26': { lat: 53.14, lng: 8.21 },  // Oldenburg
  '27': { lat: 53.18, lng: 8.60 },  // Bremen Nord
  '28': { lat: 53.08, lng: 8.80 },  // Bremen
  '29': { lat: 52.97, lng: 10.57 }, // Celle
  '30': { lat: 52.37, lng: 9.74 },  // Hannover
  '31': { lat: 52.15, lng: 9.95 },  // Hildesheim
  '32': { lat: 52.09, lng: 8.75 },  // Bad Salzuflen
  '33': { lat: 52.03, lng: 8.53 },  // Bielefeld
  '34': { lat: 51.31, lng: 9.50 },  // Kassel
  '35': { lat: 50.58, lng: 8.68 },  // Gießen
  '36': { lat: 50.55, lng: 9.68 },  // Fulda
  '37': { lat: 51.53, lng: 9.94 },  // Göttingen
  '38': { lat: 52.27, lng: 10.52 }, // Braunschweig
  '39': { lat: 52.13, lng: 11.63 }, // Magdeburg
  '40': { lat: 51.23, lng: 6.78 },  // Düsseldorf
  '41': { lat: 51.19, lng: 6.44 },  // Mönchengladbach
  '42': { lat: 51.26, lng: 7.17 },  // Wuppertal
  '43': { lat: 51.37, lng: 7.69 },  // Iserlohn
  '44': { lat: 51.51, lng: 7.47 },  // Dortmund
  '45': { lat: 51.46, lng: 7.01 },  // Essen
  '46': { lat: 51.47, lng: 6.85 },  // Oberhausen
  '47': { lat: 51.43, lng: 6.76 },  // Duisburg
  '48': { lat: 51.96, lng: 7.63 },  // Münster
  '49': { lat: 52.28, lng: 8.04 },  // Osnabrück
  '50': { lat: 50.94, lng: 6.96 },  // Köln
  '51': { lat: 50.96, lng: 7.01 },  // Köln Ost
  '52': { lat: 50.78, lng: 6.08 },  // Aachen
  '53': { lat: 50.73, lng: 7.10 },  // Bonn
  '54': { lat: 49.75, lng: 6.64 },  // Trier
  '55': { lat: 50.00, lng: 8.27 },  // Mainz
  '56': { lat: 50.36, lng: 7.59 },  // Koblenz
  '57': { lat: 50.87, lng: 8.02 },  // Siegen
  '58': { lat: 51.36, lng: 7.47 },  // Hagen
  '59': { lat: 51.67, lng: 7.82 },  // Hamm
  '60': { lat: 50.11, lng: 8.68 },  // Frankfurt am Main
  '61': { lat: 50.22, lng: 8.62 },  // Bad Homburg
  '63': { lat: 50.00, lng: 8.98 },  // Offenbach
  '64': { lat: 49.87, lng: 8.65 },  // Darmstadt
  '65': { lat: 50.08, lng: 8.24 },  // Wiesbaden
  '66': { lat: 49.24, lng: 7.00 },  // Saarbrücken
  '67': { lat: 49.48, lng: 8.44 },  // Ludwigshafen
  '68': { lat: 49.49, lng: 8.47 },  // Mannheim
  '69': { lat: 49.41, lng: 8.69 },  // Heidelberg
  '70': { lat: 48.78, lng: 9.18 },  // Stuttgart
  '71': { lat: 48.73, lng: 9.12 },  // Böblingen
  '72': { lat: 48.52, lng: 9.06 },  // Tübingen
  '73': { lat: 48.69, lng: 9.41 },  // Esslingen
  '74': { lat: 49.14, lng: 9.22 },  // Heilbronn
  '75': { lat: 48.89, lng: 8.70 },  // Pforzheim
  '76': { lat: 49.01, lng: 8.40 },  // Karlsruhe
  '77': { lat: 48.47, lng: 7.94 },  // Offenburg
  '78': { lat: 48.06, lng: 8.53 },  // VS-Villingen
  '79': { lat: 47.99, lng: 7.85 },  // Freiburg
  '80': { lat: 48.14, lng: 11.58 }, // München
  '81': { lat: 48.12, lng: 11.60 }, // München Süd
  '82': { lat: 47.99, lng: 11.34 }, // Starnberg
  '83': { lat: 47.86, lng: 12.13 }, // Rosenheim
  '84': { lat: 48.54, lng: 12.15 }, // Landshut
  '85': { lat: 48.40, lng: 11.75 }, // Freising
  '86': { lat: 48.37, lng: 10.90 }, // Augsburg
  '87': { lat: 47.73, lng: 10.32 }, // Kempten
  '88': { lat: 47.65, lng: 9.48 },  // Friedrichshafen
  '89': { lat: 48.40, lng: 9.99 },  // Ulm
  '90': { lat: 49.45, lng: 11.08 }, // Nürnberg
  '91': { lat: 49.60, lng: 11.01 }, // Erlangen
  '92': { lat: 49.44, lng: 11.86 }, // Amberg
  '93': { lat: 49.01, lng: 12.10 }, // Regensburg
  '94': { lat: 48.57, lng: 13.43 }, // Passau
  '95': { lat: 49.95, lng: 11.58 }, // Bayreuth
  '96': { lat: 49.89, lng: 10.89 }, // Bamberg
  '97': { lat: 49.79, lng: 9.94 },  // Würzburg
  '98': { lat: 50.61, lng: 10.69 }, // Suhl
  '99': { lat: 50.98, lng: 11.03 }, // Erfurt
}

// In-memory cache for exact PLZ lookups
const plzCache = new Map<string, Coordinates>()

/**
 * Get coordinates for a German PLZ.
 * First checks static prefix map, then uses Nominatim API for exact lookup.
 */
export async function getCoordinatesForPLZ(plz: string): Promise<Coordinates | null> {
  if (!/^\d{5}$/.test(plz)) return null

  // Check cache
  if (plzCache.has(plz)) {
    return plzCache.get(plz)!
  }

  // Try Nominatim API for exact coordinates
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${plz}&country=Germany&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'CompliAI-SpritpreisTracker/1.0',
        },
      }
    )

    if (res.ok) {
      const data = await res.json()
      if (data.length > 0) {
        const coords: Coordinates = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        }
        plzCache.set(plz, coords)
        return coords
      }
    }
  } catch (err) {
    console.warn(`Nominatim lookup failed for PLZ ${plz}, using prefix fallback`)
  }

  // Fallback: use prefix map
  const prefix = plz.substring(0, 2)
  const coords = PLZ_PREFIX_MAP[prefix]
  if (coords) {
    plzCache.set(plz, coords)
    return coords
  }

  return null
}

/**
 * Validate a German PLZ
 */
export function isValidPLZ(plz: string): boolean {
  return /^\d{5}$/.test(plz)
}
