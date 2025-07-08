import Stripe from 'stripe';
import { getSession } from 'next-auth/react';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const session = await getSession({ req });
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { plan, cycle } = req.body;

    try {
        const prices = {
            premium: {
                monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
                yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID
            },
            pro: {
                monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
                yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID
            }
        };

        const priceId = prices[plan]?.[cycle];
        if (!priceId) {
            return res.status(400).json({ error: 'Invalid plan or cycle' });
        }

        const checkoutSession = await stripe.checkout.sessions.create({
            customer_email: session.user.email,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
            cancel_url: `${process.env.NEXTAUTH_URL}/checkout?plan=${plan}&cycle=${cycle}`,
            metadata: {
                userId: session.user.id,
                plan: plan,
                cycle: cycle
            }
        });

        res.status(200).json({ url: checkoutSession.url });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
}