/**
 * Rate limiter for login attempts
 * Limits to 5 attempts per 15 minutes per IP/email
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (consider Redis for production multi-instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
  blocked: boolean;
}

/**
 * Check and update rate limit for a given key
 * @param key - Unique identifier (e.g., email or IP)
 * @returns Rate limit result
 */
export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const normalizedKey = key.toLowerCase();
  
  const entry = rateLimitStore.get(normalizedKey);
  
  // No existing entry or window expired
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(normalizedKey, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    
    return {
      success: true,
      remaining: MAX_ATTEMPTS - 1,
      resetAt: new Date(now + WINDOW_MS),
      blocked: false,
    };
  }
  
  // Window still active
  if (entry.count >= MAX_ATTEMPTS) {
    return {
      success: false,
      remaining: 0,
      resetAt: new Date(entry.resetAt),
      blocked: true,
    };
  }
  
  // Increment counter
  entry.count += 1;
  rateLimitStore.set(normalizedKey, entry);
  
  return {
    success: true,
    remaining: MAX_ATTEMPTS - entry.count,
    resetAt: new Date(entry.resetAt),
    blocked: false,
  };
}

/**
 * Reset rate limit for a key (e.g., after successful login)
 * @param key - Unique identifier
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key.toLowerCase());
}

/**
 * Get remaining time until rate limit resets
 * @param key - Unique identifier
 * @returns Remaining time in seconds, or 0 if not rate limited
 */
export function getRateLimitResetTime(key: string): number {
  const entry = rateLimitStore.get(key.toLowerCase());
  if (!entry) return 0;
  
  const remaining = entry.resetAt - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

// Cleanup expired entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
