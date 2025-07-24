import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '../../../utils/mongodb';
import User from '../../../models/userModel';
import GoogleUser from '../../../models/googleUserModel';
import bcrypt from 'bcryptjs';
import { getToken } from 'next-auth/jwt';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await dbConnect();
        const user = await User.findOne({ email: credentials.email });
        if (!user || !user.password) return null;
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          subscription: user.subscription,
          subscriptionStatus: user.subscriptionStatus,
          trialEndsAt: user.trialEndsAt,
          createdAt: user.createdAt
        };
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      await dbConnect();

      if (user) {
        token.subscription = user.subscription;
        token.subscriptionStatus = user.subscriptionStatus;
        token.trialEndsAt = user.trialEndsAt;
        token.createdAt = user.createdAt;
      }

      if (account?.provider === 'google') {
        const email = user?.email || profile?.email || token.email;
        const name = user?.name || profile?.name || token.name;
        // Check for manual user with same email
        const manualUser = await User.findOne({ email });
        if (manualUser) {
          // Log in as manual user
          token.id = manualUser._id.toString();
          token.email = manualUser.email;
          token.name = manualUser.name;
          token.subscription = manualUser.subscription;
          token.subscriptionStatus = manualUser.subscriptionStatus;
          token.trialEndsAt = manualUser.trialEndsAt;
          token.createdAt = manualUser.createdAt;
          return token;
        }
        let dbUser = await GoogleUser.findOne({ email });
        if (!dbUser) {
          const createdAt = new Date();
          const trialEndsAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
          console.log("trialendsat",trialEndsAt);
          dbUser = await GoogleUser.create({
            name,
            email,
            subscription: 'free',
            subscriptionStatus: 'active',
            trialEndsAt,
            createdAt
          });
        }
        token.subscription = dbUser.subscription;
        token.subscriptionStatus = dbUser.subscriptionStatus;
        token.trialEndsAt = dbUser.trialEndsAt;
        token.createdAt = dbUser.createdAt;
        token.id = dbUser._id.toString();
        token.email = dbUser.email;
        token.name = dbUser.name;
      }

      return token;
    },

    async session({ session, token }) {
      if (token?.error) {
        session.user = undefined;
        session.error = token.error;
      } else {
        if (token?.sub || token?.id) session.user.id = token.sub || token.id;
        session.user.subscription = token.subscription || 'free';
        session.user.subscriptionStatus = token.subscriptionStatus || 'active';
        session.user.trialEndsAt = token.trialEndsAt;
        session.user.createdAt = token.createdAt;
        session.user.email = token.email;
        session.user.name = token.name;
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
    error: '/auth/error'
  },
  secret: process.env.NEXTAUTH_SECRET
});

export async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.email) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  await dbConnect();
  const { name, height, weight, age, gender, activityLevel, dietaryPreference, healthGoal } = req.body;
  const update = { name, height, weight, age, gender, activityLevel, dietaryPreference, healthGoal };
  // Remove undefined fields
  Object.keys(update).forEach(key => update[key] === undefined && delete update[key]);
  let user = await User.findOneAndUpdate(
    { email: token.email },
    { $set: update },
    { new: true }
  );
  if (!user) {
    user = await GoogleUser.findOneAndUpdate(
      { email: token.email },
      { $set: update },
      { new: true }
    );
  }
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  return res.status(200).json({ message: 'Profile updated', user });
}
