/**
 * THERMOSAFE — OpenStreetMap (OSM) Industrial Facility Enrichment Service
 * Queries the Overpass API to dynamically discover industrial facilities
 * near thermal anomaly hotspots, enriching the geo_catalog beyond the
 * hardcoded seed list.
 */

import { run } from '../config/database.js';
import { MLClientService } from './mlClient.js';

const mlClient = new MLClientService();

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
  async getFacilitiesNear(lat: number, lon: number, radiusKm: number = 15): Promise<OSMFacility[]> {
    const latDelta = radiusKm / 111.0;
    const lonDelta = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));
    return this.getFacilitiesInBbox(
      lat - latDelta,
      lon - lonDelta,
      lat + latDelta,
      lon + lonDelta
    );
  }

  /**
   * Formats OSM facilities into the schema expected by the ML geo_catalog and database.
   */
  formatForMLCatalog(facilities: OSMFacility[]) {
    return facilities.map((f) => {
      const typeLower = (f.type || '').toLowerCase();
      const nameLower = (f.name || '').toLowerCase();

      const isFlaring = ['refinery', 'petroleum', 'gas', 'chemical'].some(
        (t) => typeLower.includes(t) || nameLower.includes(t)
      );

      let riskCategory = 'HIGH';
      if (typeLower.includes('warehouse') || typeLower.includes('storage')) {
        riskCategory = 'MEDIUM';
      } else if (isFlaring || typeLower.includes('refinery') || nameLower.includes('refinery')) {
        riskCategory = 'CRITICAL';
      }

      return {
        id: f.id,
        name: f.name || 'Industrial Facility',
        type: f.type || 'industrial',
        lat: f.lat,
        lon: f.lon,
        country: 'India',
        risk_category: riskCategory,
        operational_flaring: isFlaring,
        buffer_km: isFlaring ? 4.0 : 3.0,
      };
    });
  }

  /**
   * Dynamic Pipeline: Queries OSM Overpass near (lat, lon), saves discovered facilities
   * to the local SQLite database, and pushes them into the ML microservice's active catalog.
   */
  async syncAndRegisterNear(lat: number, lon: number, radiusKm: number = 25): Promise<{
    fetched: number;
    addedToML: number;
    totalCataloged: number;
    facilities: any[];
  }> {
    const osmFacilities = await this.getFacilitiesNear(lat, lon, radiusKm);
    if (!osmFacilities || osmFacilities.length === 0) {
      return { fetched: 0, addedToML: 0, totalCataloged: 0, facilities: [] };
    }

    const mlFormatted = this.formatForMLCatalog(osmFacilities);

    // 1. Persist to SQLite facilities table
    for (const fac of mlFormatted) {
      try {
        await run(
          `INSERT OR IGNORE INTO facilities (
            id, name, type, lat, lon, country, risk_category, operational_flaring, buffer_km
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            fac.id,
            fac.name,
            fac.type,
            fac.lat,
            fac.lon,
            fac.country,
            fac.risk_category,
            fac.operational_flaring ? 1 : 0,
            fac.buffer_km,
          ]
        );
      } catch (dbErr) {
        // Continue gracefully if row already exists
      }
    }

    // 2. Register with ML microservice
    const mlRes = await mlClient.bulkRegisterFacilities(mlFormatted);

    return {
      fetched: osmFacilities.length,
      addedToML: mlRes.added,
      totalCataloged: mlRes.total_cataloged,
      facilities: mlFormatted,
    };
  }

  /** Sends the Overpass QL query and parses the GeoJSON-like response. */
  private async queryOverpass(
    south: number,
    west: number,
    north: number,
    east: number,
    _bboxKey: string
  ): Promise<OSMFacility[]> {
    const query = `
[out:json][timeout:25];
(
  node["landuse"="industrial"](${south},${west},${north},${east});
  way["landuse"="industrial"](${south},${west},${north},${east});
  node["man_made"="works"](${south},${west},${north},${east});
  way["man_made"="works"](${south},${west},${north},${east});
  node["power"="plant"](${south},${west},${north},${east});
  way["power"="plant"](${south},${west},${north},${east});
  node["man_made"="petroleum_well"](${south},${west},${north},${east});
  node["man_made"="storage_tank"](${south},${west},${north},${east});
  way["building"="industrial"](${south},${west},${north},${east});
);
out center 25;
    `.trim();

    const response = await fetch(this.overpassUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'PyroGuard-SIH2026/1.0 (contact: info@pyroguard.ai)',
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Overpass API returned HTTP ${response.status}`);
    }

    const data: any = await response.json();
    const elements: any[] = data.elements || [];

    const facilities: OSMFacility[] = [];

    for (const el of elements) {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (!lat || !lon) continue;

      const tags: Record<string, string> = el.tags || {};
      const name =
        tags['name'] ||
        tags['operator'] ||
        tags['brand'] ||
        (tags['man_made'] === 'works' ? 'Industrial Works' : null) ||
        (tags['power'] === 'plant' ? 'Power Generating Station' : null) ||
        `Industrial Zone (${Number(lat).toFixed(2)}, ${Number(lon).toFixed(2)})`;

      const type =
        tags['industrial'] ||
        tags['power'] ||
        tags['man_made'] ||
        tags['landuse'] ||
        'industrial';

      facilities.push({
        id: `OSM-${el.id}`,
        name,
        type,
        lat: Number(lat),
        lon: Number(lon),
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
