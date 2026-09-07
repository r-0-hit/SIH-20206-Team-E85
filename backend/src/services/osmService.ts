/**
 * THERMOSAFE — OpenStreetMap (OSM) Industrial Facility Enrichment Service
 * Queries the Overpass API to dynamically discover industrial facilities
 * near thermal anomaly hotspots, enriching the geo_catalog beyond the
 * hardcoded seed list.
 */

export interface OSMFacility {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  tags: Record<string, string>;
  source: 'OSM';
  region?: string;
}

// Industrial facility OSM tags to query
const INDUSTRIAL_TAGS = [
  'industrial',
  'factory',
  'refinery',
  'chemical',
  'power',
  'fuel',
  'storage',
  'steel',
  'cement',
  'mine',
  'quarry',
  'petroleum',
  'gas',
  'warehouse',
];

// Simple in-memory cache: bbox string → {facilities, fetchedAt}
const cache = new Map<string, { facilities: OSMFacility[]; fetchedAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export class OSMService {
  private overpassUrl = 'https://overpass-api.de/api/interpreter';

  /**
   * Queries OSM for industrial facilities within a bounding box.
   * Results are cached for 24 hours to avoid hammering the Overpass API.
   *
   * @param south - Southern latitude boundary
   * @param west  - Western longitude boundary
   * @param north - Northern latitude boundary
   * @param east  - Eastern longitude boundary
   */
  async getFacilitiesInBbox(
    south: number,
    west: number,
    north: number,
    east: number
  ): Promise<OSMFacility[]> {
    const bboxKey = `${south.toFixed(2)},${west.toFixed(2)},${north.toFixed(2)},${east.toFixed(2)}`;

    // Cache hit
    const cached = cache.get(bboxKey);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.facilities;
    }

    try {
      const facilities = await this.queryOverpass(south, west, north, east, bboxKey);
      cache.set(bboxKey, { facilities, fetchedAt: Date.now() });
      return facilities;
    } catch (err: any) {
      console.warn(`OSM Overpass query failed: ${err.message}. Returning empty facility list.`);
      return [];
    }
  }

  /**
   * Convenience: find industrial facilities within `radiusKm` of a lat/lon point.
   */
  async getFacilitiesNear(lat: number, lon: number, radiusKm: number = 10): Promise<OSMFacility[]> {
    // Approximate degree offsets for the radius
    const latDelta = radiusKm / 111.0;
    const lonDelta = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));
    return this.getFacilitiesInBbox(
      lat - latDelta,
      lon - lonDelta,
      lat + latDelta,
      lon + lonDelta
    );
  }

  /** Sends the Overpass QL query and parses the GeoJSON-like response. */
  private async queryOverpass(
    south: number,
    west: number,
    north: number,
    east: number,
    bboxKey: string
  ): Promise<OSMFacility[]> {
    // Build QL query: fetch nodes + ways with relevant landuse/man_made/industrial tags
    const tagFilters = INDUSTRIAL_TAGS.map(
      (t) =>
        `node["industrial"="${t}"](${south},${west},${north},${east});\n` +
        `way["industrial"="${t}"](${south},${west},${north},${east});`
    ).join('\n');

    const query = `
[out:json][timeout:25];
(
  ${tagFilters}
  node["landuse"="industrial"](${south},${west},${north},${east});
  way["landuse"="industrial"](${south},${west},${north},${east});
  node["man_made"="petroleum_well"](${south},${west},${north},${east});
  node["man_made"="storage_tank"](${south},${west},${north},${east});
  node["power"="plant"](${south},${west},${north},${east});
);
out center;
    `.trim();

    const response = await fetch(this.overpassUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Overpass API returned ${response.status}`);
    }

    const data: any = await response.json();
    const elements: any[] = data.elements || [];

    const facilities: OSMFacility[] = [];

    for (const el of elements) {
      // Nodes have direct lat/lon; ways have a center object
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (!lat || !lon) continue;

      const tags: Record<string, string> = el.tags || {};
      const name = tags['name'] || tags['operator'] || 'Industrial Facility';
      const type = tags['industrial'] || tags['landuse'] || tags['man_made'] || tags['power'] || 'industrial';

      facilities.push({
        id: `OSM-${el.id}`,
        name,
        type,
        lat,
        lon,
        tags,
        source: 'OSM',
      });
    }

    return facilities;
  }

  /** Returns the cached entries count (useful for health checks). */
  getCacheStats() {
    return {
      cachedBboxes: cache.size,
      totalCachedFacilities: Array.from(cache.values()).reduce(
        (sum, v) => sum + v.facilities.length,
        0
      ),
    };
  }
}

export const osmService = new OSMService();
