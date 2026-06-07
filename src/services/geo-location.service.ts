import type Redis from 'ioredis';
import { generateUuidV7 } from '../lib/uuid.js';
import { POI_GEO_KEY, poiMetaKey } from '../lib/redis-keys.js';
import type { CreatePoiBody, NearbyPoiQuery, PoiResponse } from '../schemas/poi.schemas.js';

type GeoSearchMember = {
  member: string;
  distance?: string;
};

export class GeoLocationService {
  constructor(private readonly redis: Redis) {}

  async createPoi(input: CreatePoiBody): Promise<PoiResponse> {
    const poiId = generateUuidV7();

    const pipeline = this.redis.multi();

    pipeline.geoadd(POI_GEO_KEY, input.longitude, input.latitude, poiId);
    pipeline.hset(poiMetaKey(poiId), {
      name: input.name,
      latitude: input.latitude.toString(),
      longitude: input.longitude.toString(),
    });

    await pipeline.exec();

    return {
      id: poiId,
      name: input.name,
      latitude: input.latitude,
      longitude: input.longitude,
    };
  }

  async findNearby(input: NearbyPoiQuery): Promise<PoiResponse[]> {
    const radiusMeters = Math.round(input.radiusKm * 1000);

    const rawResults = (await this.redis.geosearch(
      POI_GEO_KEY,
      'FROMLONLAT',
      input.longitude,
      input.latitude,
      'BYRADIUS',
      radiusMeters,
      'm',
      'ASC',
      'WITHDIST',
    )) as Array<string | GeoSearchMember>;

    const members = normalizeGeoSearchResults(rawResults);

    if (members.length === 0) {
      return [];
    }

    const pipeline = this.redis.pipeline();

    for (const member of members) {
      pipeline.hgetall(poiMetaKey(member.member));
    }

    const metaResults = await pipeline.exec();

    if (!metaResults) {
      return [];
    }

    const pois: PoiResponse[] = [];

    members.forEach((member, index) => {
      const metaEntry = metaResults[index];

      if (!metaEntry || metaEntry[0]) {
        return;
      }

      const meta = metaEntry[1] as Record<string, string>;

      if (!meta.name || !meta.latitude || !meta.longitude) {
        return;
      }

      pois.push({
        id: member.member,
        name: meta.name,
        latitude: Number(meta.latitude),
        longitude: Number(meta.longitude),
        distanceKm: member.distanceMeters / 1000,
      });
    });

    return pois;
  }
}

function normalizeGeoSearchResults(
  rawResults: Array<string | GeoSearchMember>,
): Array<{ member: string; distanceMeters: number }> {
  if (rawResults.length === 0) {
    return [];
  }

  if (typeof rawResults[0] === 'string') {
    return (rawResults as string[]).map((member) => ({
      member,
      distanceMeters: 0,
    }));
  }

  return (rawResults as GeoSearchMember[]).map((entry) => ({
    member: entry.member,
    distanceMeters: entry.distance ? Number(entry.distance) : 0,
  }));
}
