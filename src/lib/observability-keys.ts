export const OBS_RECENT_LOGS_KEY = 'obs:logs:recent';

export const OBS_METRICS_PREFIX = 'obs:metrics:';

export function obsMetricsKey(routeKey: string): string {
  return `${OBS_METRICS_PREFIX}${routeKey}`;
}

export const OBS_LOG_MAX = 500;

export const OBS_LOG_TTL_SECONDS = 60 * 60 * 24 * 7;
