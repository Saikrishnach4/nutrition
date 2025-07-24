import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { parseStructuredResponse, getNutritionTotals } from '../utils/parseNutrition';

export default function UserDashboard() {
    const { data: session, status } = useSession();
    const [analyses, setAnalyses] = useState([]);
    const [loadingAnalyses, setLoadingAnalyses] = useState(true);
    const [dailySummary, setDailySummary] = useState([]);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: user.name || '',
        height: user.height || '',
        weight: user.weight || '',
        age: user.age || '',
        gender: user.gender || '',
        activityLevel: user.activityLevel || '',
        dietaryPreference: user.dietaryPreference || '',
        healthGoal: user.healthGoal || '',
    });
    const [profileMessage, setProfileMessage] = useState('');
    
    useEffect(() => {
        async function fetchAnalyses() {
            if (!session?.user) return;
            setLoadingAnalyses(true);
            const res = await fetch('/api/analyses');
            if (res.ok) {
                const data = await res.json();
                setAnalyses(data.analyses || []);
            }
            setLoadingAnalyses(false);
        }
        async function fetchSummary() {
            if (!session?.user) return;
            setLoadingSummary(true);
            const res = await fetch('/api/analyses?summary=daily');
            if (res.ok) {
                const data = await res.json();
                setDailySummary(data.daily || []);
            }
            setLoadingSummary(false);
        }
        fetchAnalyses();
        fetchSummary();
    }, [session?.user]);

    if (status === 'loading') return <div>Loading...</div>;
    if (!session?.user) return <div className="p-8 text-center">Please log in to view your dashboard.</div>;
    
    const user = session.user;

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }

    // Helper to compute daily summary using robust parsing
    function computeDailySummary(analyses) {
        const dayMap = {};
        analyses.forEach(a => {
            const date = a.createdAt.slice(0, 10); // YYYY-MM-DD
            let macros = { calories: a.calories, protein: a.protein, carbs: a.carbs, fat: a.fat };
            if (macros.calories === undefined || macros.protein === undefined || macros.carbs === undefined || macros.fat === undefined) {
                try {
                    const sections = parseStructuredResponse(a.result);
                    macros = getNutritionTotals(sections);
                } catch {}
            }
            if (!dayMap[date]) {
                dayMap[date] = { date, calories: 0, protein: 0, carbs: 0, fat: 0 };
            }
            dayMap[date].calories += macros.calories || 0;
            dayMap[date].protein += macros.protein || 0;
            dayMap[date].carbs += macros.carbs || 0;
            dayMap[date].fat += macros.fat || 0;
        });
        // Sort by date descending
        return Object.values(dayMap).sort((a, b) => b.date.localeCompare(a.date));
    }

    // Use computed summary instead of API summary
    const computedDailySummary = computeDailySummary(analyses);

    const handleProfileChange = (e) => {
        setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileMessage('');
        const res = await fetch('/api/auth/[...nextauth]', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileForm),
        });
        const data = await res.json();
        if (res.ok) {
            setProfileMessage('Profile updated successfully!');
            setShowProfileModal(false);
            // Optionally, refresh the page or session
        } else {
            setProfileMessage(data.message || 'Failed to update profile.');
        }
    };

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
                                onClick={() => setShowProfileModal(true)}
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
                            {user.createdAt && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Created At:</span>
                                    <span className="font-semibold text-gray-900">
                                        {formatDate(user.createdAt)}
                                    </span>
                                </div>
                            )}
                            {user.trialEndsAt && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Trial Ends:</span>
                                    <span className="font-semibold text-gray-900">
                                        {formatDate(user.trialEndsAt)}
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

                {/* Daily Nutrition Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Daily Nutrition Summary</h3>
                    {loadingAnalyses ? (
                        <div className="text-center py-8 text-gray-500">Loading summary...</div>
                    ) : computedDailySummary.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No data yet. Upload food to see your daily nutrition!</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-gray-800">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="px-4 py-2 text-left">Date</th>
                                        <th className="px-4 py-2">Calories</th>
                                        <th className="px-4 py-2">Protein (g)</th>
                                        <th className="px-4 py-2">Carbs (g)</th>
                                        <th className="px-4 py-2">Fat (g)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {computedDailySummary.map((row) => (
                                        <tr key={row.date} className="border-b">
                                            <td className="px-4 py-2">{formatDate(row.date)}</td>
                                            <td className="px-4 py-2">{row.calories}</td>
                                            <td className="px-4 py-2">{row.protein}</td>
                                            <td className="px-4 py-2">{row.carbs}</td>
                                            <td className="px-4 py-2">{row.fat}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
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
                    {loadingAnalyses ? (
                        <div className="text-center py-8 text-gray-500">Loading analyses...</div>
                    ) : analyses.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🍽️</div>
                            <h4 className="text-xl font-semibold text-gray-900 mb-2">No analyses yet</h4>
                            <p className="text-gray-600 mb-6">
                                Upload your first food image to start tracking your nutrition!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {analyses.slice(0, 5).map((a) => {
                                let macros = { calories: a.calories, protein: a.protein, carbs: a.carbs, fat: a.fat };
                                if (macros.calories === undefined || macros.protein === undefined || macros.carbs === undefined || macros.fat === undefined) {
                                    // Fallback: parse from result
                                    try {
                                        const sections = parseStructuredResponse(a.result);
                                        macros = getNutritionTotals(sections);
                                    } catch {}
                                }
                                return (
                                    <div key={a._id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <div>
                                            <div className="font-semibold text-gray-900">{a.foodDescription || 'Food Analysis'}</div>
                                            <div className="text-sm text-gray-500">{formatDate(a.createdAt)}</div>
                                        </div>
                                        <div className="flex gap-4 text-sm">
                                            <span>🔥 {macros.calories} kcal</span>
                                            <span>🥩 {macros.protein}g protein</span>
                                            <span>🍚 {macros.carbs}g carbs</span>
                                            <span>🧈 {macros.fat}g fat</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            {showProfileModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                    <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
                        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowProfileModal(false)}>&times;</button>
                        <h2 className="text-xl font-bold mb-4">Update Profile</h2>
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div>
                                <label className="block font-semibold mb-1">Name</label>
                                <input type="text" name="name" value={profileForm.name} onChange={handleProfileChange} className="w-full border rounded px-3 py-2" />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">Height (ft)</label>
                                <input type="text" name="height" value={profileForm.height} onChange={handleProfileChange} className="w-full border rounded px-3 py-2" />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">Weight (kg)</label>
                                <input type="text" name="weight" value={profileForm.weight} onChange={handleProfileChange} className="w-full border rounded px-3 py-2" />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">Age</label>
                                <input type="number" name="age" value={profileForm.age} onChange={handleProfileChange} className="w-full border rounded px-3 py-2" />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">Gender</label>
                                <select name="gender" value={profileForm.gender} onChange={handleProfileChange} className="w-full border rounded px-3 py-2">
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">Activity Level</label>
                                <select name="activityLevel" value={profileForm.activityLevel} onChange={handleProfileChange} className="w-full border rounded px-3 py-2">
                                    <option value="">Select</option>
                                    <option value="Sedentary">Sedentary</option>
                                    <option value="Lightly Active">Lightly Active</option>
                                    <option value="Active">Active</option>
                                    <option value="Very Active">Very Active</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">Dietary Preference</label>
                                <select name="dietaryPreference" value={profileForm.dietaryPreference} onChange={handleProfileChange} className="w-full border rounded px-3 py-2">
                                    <option value="">Select</option>
                                    <option value="Vegetarian">Vegetarian</option>
                                    <option value="Vegan">Vegan</option>
                                    <option value="Mixed">Mixed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">Health Goal</label>
                                <select name="healthGoal" value={profileForm.healthGoal} onChange={handleProfileChange} className="w-full border rounded px-3 py-2">
                                    <option value="">Select</option>
                                    <option value="Lose Weight">Lose Weight</option>
                                    <option value="Maintain Weight">Maintain Weight</option>
                                    <option value="Gain Weight">Gain Weight</option>
                                </select>
                            </div>
                            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded">Update Profile</button>
                            {profileMessage && <div className="text-center text-sm text-gray-600 mt-2">{profileMessage}</div>}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}