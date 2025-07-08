import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const session = await getSession({ req });
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Update user's trial status
        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                subscription: 'free',
                subscriptionStatus: 'active',
                trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                updatedAt: new Date()
            }
        });

        res.status(200).json({ 
            message: 'Trial activated successfully',
            trialEndsAt: user.trialEndsAt
        });
    } catch (error) {
        console.error('Trial activation error:', error);
        res.status(500).json({ error: 'Failed to activate trial' });
    }
}