/**
 * PyroGuard AI — Reverse Geocoding Service
 * Resolves lat/lon coordinates to human-readable addresses using OpenStreetMap Nominatim.
 * Provides a multi-level fallback cascade to ensure SMS never contains raw coordinates.
 *
 * Fallback order:
 *   1. Nominatim reverse geocoding (OSM, free, no API key)
 *   2. Nearest facility name (from ML result)
 *   3. Regional description (approximate from coordinates)
 *   4. NEVER raw lat/lon
 */

// ── In-memory geocoding cache ────────────────────────────────────────────────
interface CachedAddress {
  address: string;
  fetchedAt: number;
}

const geocodeCache = new Map<string, CachedAddress>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting: max 1 request per second (Nominatim usage policy)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 1100; // slightly over 1s for safety

/**
 * Generates a cache key from coordinates, rounded to ~111m precision.
 * This ensures nearby detections at the same location reuse cached results.
 */
function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

/**
 * Resolves coordinates to a human-readable address string.
 *
 * @param lat - Latitude in decimal degrees
 * @param lon - Longitude in decimal degrees
 * @param nearestFacilityName - Fallback facility name from ML result (optional)
 * @returns Human-readable address string (never raw coordinates)
 */
export async function resolveAddress(
  lat: number,
  lon: number,
  nearestFacilityName?: string
): Promise<string> {
  const key = cacheKey(lat, lon);

  // 1. Check cache
  const cached = geocodeCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.address;
  }

  // 2. Attempt Nominatim reverse geocoding
  try {
    const address = await reverseGeocodeNominatim(lat, lon);
    if (address) {
      geocodeCache.set(key, { address, fetchedAt: Date.now() });
      return address;
    }
  } catch (err: any) {
    console.warn(`[Geocoding] Nominatim reverse geocode failed: ${err.message}`);
  }

  // 3. Fallback: nearest facility name
  if (nearestFacilityName) {
    const fallback = nearestFacilityName;
    geocodeCache.set(key, { address: fallback, fetchedAt: Date.now() });
    return fallback;
  }

  // 4. Fallback: approximate regional description from coordinates
  const regional = approximateRegion(lat, lon);
  geocodeCache.set(key, { address: regional, fetchedAt: Date.now() });
  return regional;
}

/**
 * Calls the Nominatim reverse geocoding API and formats the response
 * into a concise human-readable address.
 */
async function reverseGeocodeNominatim(lat: number, lon: number): Promise<string | null> {
  // Rate limiting
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=14`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'PyroGuardAI/1.0 (SIH2026 Thermal Detection Platform)',
      'Accept-Language': 'en',
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Nominatim returned HTTP ${response.status}`);
  }

  const data: any = await response.json();

  if (!data || data.error) {
    return null;
  }

  // Extract address components
  const addr = data.address || {};
  const components: string[] = [];

  // Pick the most specific identifiable component
  const specificName =
    addr.road ||
    addr.neighbourhood ||
    addr.suburb ||
    addr.hamlet ||
    addr.village ||
    addr.industrial ||
    addr.aeroway;

  if (specificName) {
    components.push(specificName);
  }

  // City-level
  const city =
    addr.city ||
    addr.town ||
    addr.municipality ||
    addr.county ||
    addr.district;

  if (city && city !== specificName) {
    components.push(city);
  }

  // State / region
  const state = addr.state || addr.region;
  if (state && state !== city) {
    components.push(state);
  }

  // Country (only if non-obvious or international)
  if (addr.country && components.length < 2) {
    components.push(addr.country);
  }

  if (components.length === 0) {
    // Use Nominatim's display_name as last resort (trim it)
    if (data.display_name) {
      const parts = data.display_name.split(',').map((p: string) => p.trim());
      return parts.slice(0, 3).join(', ');
    }
    return null;
  }

  return components.join(', ');
}

/**
 * Generates an approximate regional description from raw coordinates.
 * Used as the last-resort fallback when Nominatim and facility name are unavailable.
 * This NEVER returns raw lat/lon — always a human-readable region.
 */
function approximateRegion(lat: number, lon: number): string {
  // India regions
  if (lat >= 6 && lat <= 37 && lon >= 68 && lon <= 97) {
    if (lat >= 28) return 'Northern India';
    if (lat >= 20 && lon < 78) return 'Western India';
    if (lat >= 20 && lon >= 78) return 'Eastern India';
    if (lat >= 12) return 'Southern India';
    return 'India';
  }
  // Middle East
  if (lat >= 10 && lat <= 40 && lon >= 30 && lon <= 65) return 'Middle East';
  // Southeast Asia
  if (lat >= -10 && lat <= 25 && lon >= 90 && lon <= 145) return 'Southeast Asia';
  // North America
  if (lat >= 15 && lat <= 60 && lon >= -140 && lon <= -50) return 'North America';
  // South America
  if (lat >= -60 && lat <= 15 && lon >= -90 && lon <= -30) return 'South America';
  // Africa
  if (lat >= -40 && lat <= 40 && lon >= -20 && lon <= 55) return 'Africa';
  // Europe
  if (lat >= 35 && lat <= 70 && lon >= -15 && lon <= 45) return 'Europe';

  return 'Remote Region';
}

/** Returns geocode cache stats for health checks. */
export function getGeocodeStats() {
  return {
    cachedLocations: geocodeCache.size,
  };
}
