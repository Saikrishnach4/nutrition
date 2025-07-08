import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function UserDashboard() {
    const [analyses] = useState([]); // Mock empty analyses - replace with real data
    const { data: session, status } = useSession();
    
    if (status === 'loading') return <div>Loading...</div>;
    if (!session?.user) return <div className="p-8 text-center">Please log in to view your dashboard.</div>;
    
    const user = session.user;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome back, {user.name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-gray-600">
                        Track your nutrition journey and discover insights about your eating habits.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-3xl">📊</div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">{analyses.length}</div>
                                <div className="text-sm text-gray-600">Total Analyses</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-3xl">🔥</div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">
                                    {analyses.length > 0 ? '2,340' : '0'}
                                </div>
                                <div className="text-sm text-gray-600">Avg Calories</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-3xl">🎯</div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">
                                    {user.subscription === 'free' ? 'Free' : 'Premium'}
                                </div>
                                <div className="text-sm text-gray-600">Current Plan</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-3xl">📅</div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">0</div>
                                <div className="text-sm text-gray-600">Today</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => console.log('Analyze new food clicked')}
                                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300"
                            >
                                <div className="flex items-center">
                                    <span className="text-2xl mr-3">📸</span>
                                    <span className="font-semibold">Analyze New Food</span>
                                </div>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                            
                            <button
                                onClick={() => console.log('Update profile clicked')}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <div className="flex items-center">
                                    <span className="text-2xl mr-3">⚙️</span>
                                    <span className="font-semibold text-gray-700">Update Profile</span>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Subscription Status</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Current Plan:</span>
                                <span className="font-semibold text-gray-900 capitalize">
                                    {user.subscription || 'Free'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                    {user.subscriptionStatus || 'Active'}
                                </span>
                            </div>
                            {user.trialEndsAt && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Trial Ends:</span>
                                    <span className="font-semibold text-gray-900">
                                        {new Date(user.trialEndsAt).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                            {user.subscription === 'free' && (
                                <button
                                    onClick={() => console.log('Upgrade plan clicked')}
                                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                                >
                                    Upgrade Plan
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Analyses */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Recent Analyses</h3>
                        {analyses.length > 0 && (
                            <button className="text-emerald-600 hover:text-emerald-700 font-semibold">
                                View All
                            </button>
                        )}
                    </div>

                    {analyses.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🍽️</div>
                            <h4 className="text-xl font-semibold text-gray-900 mb-2">No analyses yet</h4>
                            <p className="text-gray-600 mb-6">
                                Upload your first food image to start tracking your nutrition!
                            </p>
                            <button
                                onClick={() => console.log('Get started clicked')}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300"
                            >
                                Get Started
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* This will show analyses when available */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}