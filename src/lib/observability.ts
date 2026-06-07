export function normalizeRoutePath(rawUrl: string): string {
  const path = rawUrl.split('?')[0] ?? rawUrl;

  return path
    .replace(/\/api\/ops\/[^/]+/i, '/api/ops/:token')
    .replace(/\/[A-HJ-NP-Z]{2}[0-9]{7}/gi, '/:shortId')
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '/:id',
    );
}

export type RequestLogEntry = {
  id: string;
  at: string;
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
  userId?: string;
  error?: string;
};

export type EndpointMetric = {
  route: string;
  method: string;
  count: number;
  errorCount: number;
  totalDurationMs: number;
  avgDurationMs: number;
  maxDurationMs: number;
};
