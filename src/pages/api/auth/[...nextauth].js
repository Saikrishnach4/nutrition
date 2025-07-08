import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                });

                if (!user) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    subscription: user.subscription,
                    subscriptionStatus: user.subscriptionStatus
                };
            }
        })
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                token.subscription = user.subscription;
                token.subscriptionStatus = user.subscriptionStatus;
            }
            
            // Handle Google sign-in
            if (account?.provider === 'google') {
                const existingUser = await prisma.user.findUnique({
                    where: { email: token.email }
                });

                if (!existingUser) {
                    // Create new user for Google sign-in
                    const newUser = await prisma.user.create({
                        data: {
                            email: token.email,
                            name: token.name,
                            image: token.picture,
                            subscription: 'free',
                            subscriptionStatus: 'active',
                            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                        }
                    });
                    token.subscription = newUser.subscription;
                    token.subscriptionStatus = newUser.subscriptionStatus;
                } else {
                    token.subscription = existingUser.subscription;
                    token.subscriptionStatus = existingUser.subscriptionStatus;
                }
            }

            return token;
        },
        async session({ session, token }) {
            session.user.id = token.sub;
            session.user.subscription = token.subscription;
            session.user.subscriptionStatus = token.subscriptionStatus;
            return session;
        },
    },
    pages: {
        signIn: '/',
        error: '/',
    },
});