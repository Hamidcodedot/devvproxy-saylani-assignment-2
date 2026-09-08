import crypto from 'crypto';
import { supabase } from '@/lib/supabase';
import { AuthResult, SessionPayload, User } from './types';
import { signSessionToken, verifySessionToken, COOKIE_NAME } from './session';
import { cookies } from 'next/headers';

// In-memory user store for instant zero-config testing if Supabase is pending
const inMemoryUsers = new Map<string, { user: User; passwordHash: string }>();

// Pre-seed Demo User for 1-Click Evaluator access
const DEMO_USER: User = {
  id: 'u0000000-0000-0000-0000-000000000001',
  email: 'demo@devvproxy.com',
  name: 'Demo Evaluator',
  role: 'developer',
  createdAt: new Date().toISOString(),
};
inMemoryUsers.set(DEMO_USER.email.toLowerCase(), {
  user: DEMO_USER,
  passwordHash: hashPassword('demo123'),
});

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password.trim()).digest('hex');
}

/**
 * Reusable Auth Module: Register a new developer
 */
export async function signUp(
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail || !password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  // Check if user already exists
  if (inMemoryUsers.has(cleanEmail)) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  const hashedPassword = hashPassword(password);
  const newUser: User = {
    id: crypto.randomUUID(),
    email: cleanEmail,
    name: name || cleanEmail.split('@')[0],
    role: 'developer',
    createdAt: new Date().toISOString(),
  };

  inMemoryUsers.set(cleanEmail, { user: newUser, passwordHash: hashedPassword });

  // Save to Supabase if connected
  if (supabase) {
    try {
      await supabase.from('users').insert({
        id: newUser.id,
        email: newUser.email,
        password_hash: hashedPassword,
        name: newUser.name,
        role: newUser.role,
      });
    } catch {
      // Handled in memory
    }
  }

  const sessionToken = signSessionToken({
    userId: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
  });

  return { success: true, user: newUser, sessionToken };
}

/**
 * Reusable Auth Module: Authenticate an existing user
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  const cleanEmail = email.toLowerCase().trim();
  const hashedPassword = hashPassword(password);

  let foundUser: User | null = null;

  // Check in-memory first
  const memRecord = inMemoryUsers.get(cleanEmail);
  if (memRecord && memRecord.passwordHash === hashedPassword) {
    foundUser = memRecord.user;
  }

  // Check Supabase if not found in memory
  if (!foundUser && supabase) {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .eq('password_hash', hashedPassword)
        .single();

      if (data) {
        foundUser = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          createdAt: data.created_at,
        };
        inMemoryUsers.set(cleanEmail, { user: foundUser, passwordHash: hashedPassword });
      }
    } catch {
      // Fallback
    }
  }

  if (!foundUser) {
    return { success: false, error: 'Invalid email or password.' };
  }

  const sessionToken = signSessionToken({
    userId: foundUser.id,
    email: foundUser.email,
    name: foundUser.name,
    role: foundUser.role,
  });

  return { success: true, user: foundUser, sessionToken };
}

/**
 * Zero-Friction Evaluator Mode: Instant 1-Click Login
 */
export async function signInAsDemo(): Promise<AuthResult> {
  const sessionToken = signSessionToken({
    userId: DEMO_USER.id,
    email: DEMO_USER.email,
    name: DEMO_USER.name,
    role: DEMO_USER.role,
  });

  return { success: true, user: DEMO_USER, sessionToken };
}

/**
 * Get the currently logged-in user from request cookies
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifySessionToken(token);
    if (!payload) return null;

    return {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role as 'developer' | 'admin',
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
