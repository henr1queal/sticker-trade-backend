import { isValidShortId } from './short-id.js';

const UUID_V7_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertValidUserId(userId: string): void {
  if (!UUID_V7_PATTERN.test(userId)) {
    throw new Error('Invalid user ID format');
  }
}

export function assertValidShortId(shortId: string): void {
  if (!isValidShortId(shortId)) {
    throw new Error('Invalid short ID format');
  }
}

export function userNeedsKey(userId: string): string {
  assertValidUserId(userId);
  return `user:${userId}:needs`;
}

export function userDupesKey(userId: string): string {
  assertValidUserId(userId);
  return `user:${userId}:dupes`;
}

export function userPastedKey(userId: string): string {
  assertValidUserId(userId);
  return `user:${userId}:pasted`;
}

export const POI_GEO_KEY = 'poi:locations';

export function poiMetaKey(poiId: string): string {
  assertValidUserId(poiId);
  return `poi:${poiId}:meta`;
}

export function userAlbumKeys(userId: string): string[] {
  return [userNeedsKey(userId), userDupesKey(userId), userPastedKey(userId)];
}
