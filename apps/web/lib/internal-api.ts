export function internalApiBase(): string {
  return process.env.API_INTERNAL_URL ?? 'http://localhost:3001';
}

export const ACCESS_TOKEN_COOKIE = 'access_token';

export function cookieMaxAgeSeconds(): number {
  const days = parseInt(process.env.JWT_EXPIRES_DAYS ?? '7', 10);
  return 86400 * (Number.isFinite(days) ? days : 7);
}
