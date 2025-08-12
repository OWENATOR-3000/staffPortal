// lib/session.ts
import { cookies } from 'next/headers';
import { verifyJwt, JwtPayload } from '@/lib/auth';

// THIS IS THE DEFINITIVE, SYNCHRONOUS VERSION.
export async function getSessionUser(): Promise<JwtPayload | null> {
  try {
    // The 'cookies()' function from 'next/headers' is a special function
    // that can be called directly without 'await' in Server Components and Route Handlers.
    const cookieStore = cookies();
    const token = (await cookieStore).get('authToken')?.value;

    if (!token) {
      return null;
    }

    // verifyJwt is also synchronous.
    return verifyJwt(token);
  } catch (error) {
    console.error("Error accessing cookies in getSessionUser. This function can only be used in a server-side context (Server Component, Route Handler, Middleware).", error);
    return null;
  }
}