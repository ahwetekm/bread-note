import { NextAuthConfig } from 'next-auth';

// Edge-compatible auth config (no bcrypt, no db imports)
// This is used by middleware
export const authConfig: NextAuthConfig = {
  providers: [], // Providers are added in auth.ts (not edge-compatible)
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuthPage = nextUrl.pathname.startsWith('/login') ||
                          nextUrl.pathname.startsWith('/register');
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnMainApp = nextUrl.pathname.startsWith('/notes') ||
                          nextUrl.pathname.startsWith('/todos') ||
                          nextUrl.pathname.startsWith('/folders') ||
                          nextUrl.pathname.startsWith('/tags') ||
                          nextUrl.pathname.startsWith('/favorites') ||
                          nextUrl.pathname.startsWith('/trash') ||
                          nextUrl.pathname.startsWith('/search') ||
                          nextUrl.pathname.startsWith('/settings') ||
                          isOnDashboard;

      if (isOnAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }

      if (isOnMainApp) {
        if (!isLoggedIn) {
          return Response.redirect(new URL('/login', nextUrl));
        }
        return true;
      }

      return true;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
};
