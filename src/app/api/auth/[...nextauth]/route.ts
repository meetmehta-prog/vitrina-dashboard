import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db } from '@/lib/db';
import { allowedUsers } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const ADMIN_EMAIL = 'mehtameet005@gmail.com';

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        const email = user.email?.toLowerCase();

        if (!email) {
          console.log('No email provided');
          return false;
        }

        // Check if email is from Gmail or G-Suite
        const emailDomain = email.split('@')[1];
        const isGoogleAccount = account?.provider === 'google';

        if (!isGoogleAccount) {
          console.log(`Non-Google account attempted: ${email}`);
          return false;
        }

        // For admin email, auto-create/activate if not exists
        if (email === ADMIN_EMAIL) {
          const existingUser = await db
            .select()
            .from(allowedUsers)
            .where(eq(allowedUsers.email, email))
            .limit(1);

          if (existingUser.length === 0) {
            // Create admin user
            await db.insert(allowedUsers).values({
              email,
              name: user.name || email,
              isActive: true,
              isAdmin: true,
              lastLogin: new Date(),
            });
          } else {
            // Update admin user
            await db
              .update(allowedUsers)
              .set({
                lastLogin: new Date(),
                isActive: true,
                isAdmin: true,
                name: user.name || existingUser[0].name,
              })
              .where(eq(allowedUsers.email, email));
          }
          return true;
        }

        // For other users, check if they're in allowed users table
        const allowedUser = await db
          .select()
          .from(allowedUsers)
          .where(eq(allowedUsers.email, email))
          .limit(1);

        if (allowedUser.length === 0 || !allowedUser[0].isActive) {
          console.log(`Access denied for email: ${email}`);
          return false;
        }

        // Update last login
        await db
          .update(allowedUsers)
          .set({
            lastLogin: new Date(),
            name: user.name || allowedUser[0].name,
          })
          .where(eq(allowedUsers.email, email));

        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        const email = user.email?.toLowerCase();
        if (email) {
          try {
            const dbUser = await db
              .select()
              .from(allowedUsers)
              .where(eq(allowedUsers.email, email))
              .limit(1);

            if (dbUser.length > 0) {
              token.id = dbUser[0].id.toString();
              token.isAdmin = dbUser[0].isAdmin || false;
            }
          } catch (error) {
            console.error('Error fetching user from DB:', error);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };