import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { allowedUsers } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'email',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your-email@example.com' }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        try {
          // Check if user email is in allowed users table
          const allowedUser = await db
            .select()
            .from(allowedUsers)
            .where(eq(allowedUsers.email, credentials.email.toLowerCase()))
            .limit(1);

          if (allowedUser.length === 0 || !allowedUser[0].isActive) {
            console.log(`Access denied for email: ${credentials.email}`);
            return null;
          }

          // Update last login
          await db
            .update(allowedUsers)
            .set({ lastLogin: new Date() })
            .where(eq(allowedUsers.email, credentials.email.toLowerCase()));

          return {
            id: allowedUser[0].id.toString(),
            email: credentials.email,
            name: allowedUser[0].name || credentials.email,
          };
        } catch (error) {
          console.error('Error checking user access:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };