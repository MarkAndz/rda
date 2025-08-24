import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';

// For debugging purposes
console.log('Auth config loaded');
console.log('Environment:', {
  githubId: process.env.GITHUB_ID ? 'Set' : 'Not set',
  githubSecret: process.env.GITHUB_SECRET ? 'Set' : 'Not set',
  googleId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
  googleSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
  authSecret: process.env.AUTH_SECRET ? 'Set' : 'Not set',
  nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
  nextAuthUrl: process.env.NEXTAUTH_URL,
});

// Define custom session and user types to include our additional properties
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      accounts?: {
        provider: string;
        providerAccountId: string;
      }[];
    };
  }
}

/**
 * Auth.js configuration for our app.
 * Uses Prisma adapter to link OAuth accounts to our User model.
 */
export const authConfig: NextAuthConfig = {
  // Adapter for Prisma integration
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },

  // Configure OAuth providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  // Customize Auth.js pages (we'll create these later)
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  // Callbacks for customizing session and JWT behavior
  callbacks: {
    // Include user info in session for client-side access
    session: async ({ session, token, user }) => {
      if (session?.user) {
        session.user.id = token?.sub || user?.id;

        // Only fetch accounts if we have a user ID
        if (session.user.id) {
          try {
            const accounts = await prisma.account.findMany({
              where: { userId: session.user.id },
              select: { provider: true, providerAccountId: true },
            });
            session.user.accounts = accounts;
          } catch (error) {
            console.error('Error fetching accounts:', error);
          }
        }
      }

      return session;
    },

    // Add user ID to JWT token
    jwt: ({ token, user }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },

    // Additional authorize callback to customize auth behavior
    authorized({ auth, request: { nextUrl } }) {
      // Public routes are accessible by everyone
      const isOnPublicRoute =
        !nextUrl.pathname.startsWith('/dashboard') &&
        !nextUrl.pathname.startsWith('/profile') &&
        !nextUrl.pathname.includes('/edit') &&
        !nextUrl.pathname.includes('/create');

      const isLoggedIn = !!auth?.user;

      // Allow public routes; require auth for private routes
      if (isOnPublicRoute) return true;

      return isLoggedIn;
    },
  },
};

/**
 * Auth.js handler with our configuration
 */
export const { auth, signIn, signOut, handlers } = NextAuth(authConfig);
