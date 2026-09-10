import crypto from 'crypto';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { users, sessions, User } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';

const COOKIE_NAME = 'optom_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Hash password securely using Node.js crypto scrypt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify password against stored hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(':');
  if (!salt || !storedHash) return false;
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(
    Buffer.from(storedHash, 'hex'),
    derivedKey
  );
}

/**
 * Create a new user session and set HttpOnly cookie
 */
export async function createSession(
  userId: number,
  rememberMe: boolean = false
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const durationMs = rememberMe
    ? 365 * 24 * 60 * 60 * 1000 // 1 Year (Stay Logged In)
    : 7 * 24 * 60 * 60 * 1000;   // 7 Days standard
  const expiresAt = new Date(Date.now() + durationMs);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return sessionId;
}

/**
 * Get current logged-in user from request session cookie
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionId) return null;

    const result = await db
      .select({
        user: users,
        session: sessions,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.id, sessionId),
          gte(sessions.expiresAt, new Date())
        )
      );

    if (result.length === 0) return null;

    return result[0].user;
  } catch (error) {
    console.error('Failed to get authenticated user:', error);
    return null;
  }
}

/**
 * Destroy current session and clear cookie
 */
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(COOKIE_NAME)?.value;

    if (sessionId) {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
      cookieStore.delete(COOKIE_NAME);
    }
  } catch (error) {
    console.error('Failed to destroy session:', error);
  }
}
