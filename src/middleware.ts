import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (icons, manifest, etc.)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|icons|manifest.json).*)',
  ],
};
