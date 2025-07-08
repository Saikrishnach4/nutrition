import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Checkout() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { plan, cycle } = router.query;
    
    const [loading, setLoading] = useState(false);
    const [planDetails, setPlanDetails] = useState(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
            return;
        }

        // Set plan details based on query params
        const plans = {
            'free trial': {
                name: 'Free Trial',
                price: { monthly: 0, yearly: 0 },
                features: [
                    '10 food analyses per month',
                    'Basic nutrition insights',
                    'Standard meal recommendations',
                    'Email support',
                    'Mobile app access'
                ]
            },
            'premium': {
                name: 'Premium',
                price: { monthly: 9.99, yearly: 99.99 },
                features: [
                    'Unlimited food analyses',
                    'Advanced nutrition insights',
                    'Personalized meal plans',
                    'BMI tracking & goals',
                    'Priority support',
                    'Export reports (PDF)',
                    'Custom dietary preferences',
                    'Progress tracking'
                ]
            },
            'pro': {
                name: 'Pro',
                price: { monthly: 19.99, yearly: 199.99 },
                features: [
                    'Everything in Premium',
                    'AI nutritionist chat',
                    'Custom workout plans',
                    'Macro tracking',
                    'Recipe suggestions',
                    'Health goal automation',
                    'API access',
                    'White-label options',
                    '24/7 phone support'
                ]
            }
        };

        if (plan && plans[plan]) {
            setPlanDetails(plans[plan]);
        }
    }, [plan, status, router]);

    const handleSubscribe = async () => {
        if (!planDetails) return;

        setLoading(true);

        try {
            if (planDetails.name === 'Free Trial') {
                // Handle free trial activation
                const response = await fetch('/api/subscription/activate-trial', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    router.push('/dashboard?welcome=true');
                } else {
                    throw new Error('Failed to activate trial');
                }
            } else {
                // Handle paid subscription with Stripe
                const response = await fetch('/api/subscription/create-checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        plan: plan,
                        cycle: cycle
                    }),
                });

                const data = await response.json();

                if (response.ok && data.url) {
                    window.location.href = data.url;
                } else {
                    throw new Error(data.error || 'Failed to create checkout session');
                }
            }
        } catch (error) {
            console.error('Subscription error:', error);
            alert('Something went wrong. Please try again.');
        }

        setLoading(false);
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full animate-pulse mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!planDetails) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Plan not found</h1>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const price = cycle === 'yearly' ? planDetails.price.yearly : planDetails.price.monthly;
    const billingText = cycle === 'yearly' ? 'per year' : 'per month';

    return (
        <>
            <Head>
                <title>Checkout - {planDetails.name} Plan | Dishalyze</title>
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Subscription</h1>
                        <p className="text-gray-600">You're one step away from unlocking your nutrition journey</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Plan Summary */}
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Plan Summary</h2>
                            
                            <div className="border-2 border-emerald-200 rounded-2xl p-6 bg-emerald-50 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-emerald-800">{planDetails.name}</h3>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-emerald-800">
                                            ${price}
                                        </div>
                                        <div className="text-sm text-emerald-600">{billingText}</div>
                                    </div>
                                </div>

                                {cycle === 'yearly' && price > 0 && (
                                    <div className="bg-green-100 border border-green-200 rounded-lg p-3 mb-4">
                                        <div className="flex items-center">
                                            <span className="text-green-600 mr-2">💰</span>
                                            <span className="text-green-800 font-semibold text-sm">
                                                Save ${(planDetails.price.monthly * 12 - planDetails.price.yearly).toFixed(2)} with yearly billing
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3">What's included:</h4>
                                <ul className="space-y-2">
                                    {planDetails.features.map((feature, index) => (
                                        <li key={index} className="flex items-start">
                                            <div className="flex-shrink-0 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <span className="text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Account & Payment */}
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Details</h2>
                            
                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                                        {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{session?.user?.name}</p>
                                        <p className="text-gray-600 text-sm">{session?.user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            {planDetails.name === 'Free Trial' ? (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <div className="flex items-center mb-2">
                                            <span className="text-blue-600 mr-2">🎉</span>
                                            <span className="font-semibold text-blue-800">30-Day Free Trial</span>
                                        </div>
                                        <p className="text-blue-700 text-sm">
                                            No payment required. Your trial will start immediately and you can upgrade anytime.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleSubscribe}
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
                                    >
                                        {loading ? 'Activating Trial...' : 'Start Free Trial'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                        <div className="flex items-center mb-2">
                                            <span className="text-yellow-600 mr-2">🔒</span>
                                            <span className="font-semibold text-yellow-800">Secure Payment</span>
                                        </div>
                                        <p className="text-yellow-700 text-sm">
                                            You'll be redirected to Stripe for secure payment processing.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleSubscribe}
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
                                    >
                                        {loading ? 'Processing...' : `Subscribe for $${price}${billingText.replace('per ', '/')}`}
                                    </button>
                                </div>
                            )}

                            <div className="mt-6 text-center">
                                <p className="text-xs text-gray-500">
                                    By subscribing, you agree to our{' '}
                                    <a href="/terms" className="text-emerald-600 hover:text-emerald-700">Terms of Service</a>
                                    {' '}and{' '}
                                    <a href="/privacy" className="text-emerald-600 hover:text-emerald-700">Privacy Policy</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}