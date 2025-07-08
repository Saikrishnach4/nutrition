import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function PricingSection() {
    const [billingCycle, setBillingCycle] = useState('monthly');
    const { data: session } = useSession();
    const router = useRouter();

    const plans = [
        {
            name: 'Free Trial',
            price: { monthly: 0, yearly: 0 },
            duration: '30 days',
            features: [
                '10 food analyses per month',
                'Basic nutrition insights',
                'Standard meal recommendations',
                'Email support',
                'Mobile app access'
            ],
            popular: false,
            cta: 'Start Free Trial',
            color: 'gray'
        },
        {
            name: 'Premium',
            price: { monthly: 9.99, yearly: 99.99 },
            duration: billingCycle === 'monthly' ? 'per month' : 'per year',
            features: [
                'Unlimited food analyses',
                'Advanced nutrition insights',
                'Personalized meal plans',
                'BMI tracking & goals',
                'Priority support',
                'Export reports (PDF)',
                'Custom dietary preferences',
                'Progress tracking'
            ],
            popular: true,
            cta: 'Get Premium',
            color: 'blue'
        },
        {
            name: 'Pro',
            price: { monthly: 19.99, yearly: 199.99 },
            duration: billingCycle === 'monthly' ? 'per month' : 'per year',
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
            ],
            popular: false,
            cta: 'Go Pro',
            color: 'purple'
        }
    ];

    const handleSubscribe = async (plan) => {
        if (!session) {
            signIn();
            return;
        }

        // Redirect to checkout
        router.push(`/checkout?plan=${plan.name.toLowerCase()}&cycle=${billingCycle}`);
    };

    const getColorClasses = (color, type = 'bg') => {
        const colors = {
            gray: {
                bg: 'bg-gray-500',
                border: 'border-gray-200',
                text: 'text-gray-600',
                button: 'bg-gray-600 hover:bg-gray-700'
            },
            blue: {
                bg: 'bg-blue-500',
                border: 'border-blue-200',
                text: 'text-blue-600',
                button: 'bg-blue-600 hover:bg-blue-700'
            },
            purple: {
                bg: 'bg-purple-500',
                border: 'border-purple-200',
                text: 'text-purple-600',
                button: 'bg-purple-600 hover:bg-purple-700'
            }
        };
        return colors[color][type];
    };

    return (
        <div className="py-16 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Choose Your <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Nutrition Journey</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                        Start with our free trial and upgrade when you're ready for advanced features
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center bg-white rounded-full p-1 shadow-lg border border-gray-200">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                                billingCycle === 'monthly'
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 relative ${
                                billingCycle === 'yearly'
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            Yearly
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                Save 17%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`relative bg-white rounded-3xl shadow-xl border-2 overflow-hidden transform hover:scale-105 transition-all duration-300 ${
                                plan.popular 
                                    ? 'border-emerald-500 shadow-emerald-200' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-center py-2 font-semibold text-sm">
                                    🌟 Most Popular
                                </div>
                            )}

                            <div className={`p-8 ${plan.popular ? 'pt-12' : ''}`}>
                                {/* Plan Header */}
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                    <div className="mb-4">
                                        <span className="text-5xl font-bold text-gray-900">
                                            ${plan.price[billingCycle]}
                                        </span>
                                        <span className="text-gray-600 ml-2">{plan.duration}</span>
                                    </div>
                                    {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                                        <div className="text-sm text-green-600 font-semibold">
                                            Save ${(plan.price.monthly * 12 - plan.price.yearly).toFixed(2)} per year
                                        </div>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, featureIndex) => (
                                        <li key={featureIndex} className="flex items-start">
                                            <div className="flex-shrink-0 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <span className="text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA Button */}
                                <button
                                    onClick={() => handleSubscribe(plan)}
                                    className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                                        plan.popular
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                                            : 'bg-gray-600 hover:bg-gray-700'
                                    }`}
                                >
                                    {plan.cta}
                                </button>

                                {plan.name === 'Free Trial' && (
                                    <p className="text-center text-sm text-gray-500 mt-3">
                                        No credit card required
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="mt-16 max-w-4xl mx-auto">
                    <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">Frequently Asked Questions</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                q: "Can I cancel anytime?",
                                a: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period."
                            },
                            {
                                q: "What happens after the free trial?",
                                a: "After 30 days, you can choose to upgrade to a paid plan or continue with limited free features."
                            },
                            {
                                q: "Do you offer refunds?",
                                a: "We offer a 14-day money-back guarantee for all paid plans if you're not satisfied."
                            },
                            {
                                q: "Can I change plans later?",
                                a: "Absolutely! You can upgrade or downgrade your plan at any time from your account settings."
                            }
                        ].map((faq, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                                <h4 className="font-semibold text-gray-900 mb-2">{faq.q}</h4>
                                <p className="text-gray-600">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}