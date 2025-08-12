// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the auth token cookie
  const authToken = request.cookies.get('authToken')?.value;

  // If the user is trying to access the dashboard and there's no token,
  // redirect them to the login page.
  if (request.nextUrl.pathname.startsWith('/dashboard') && !authToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If the user is logged in and tries to go to the login page,
  // redirect them to the dashboard.
  if (request.nextUrl.pathname.startsWith('/login') && authToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};