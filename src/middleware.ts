import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isGamePage = request.nextUrl.pathname.startsWith('/game');

  // If trying to access game pages without token, redirect to login
  if (isGamePage && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // If trying to access auth pages with token, redirect to game
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/game', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/game/:path*', '/auth/:path*'],
};
