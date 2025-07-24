import { useState, useEffect } from 'react';
import { useSession, signIn, signOut, update } from 'next-auth/react';
import { parseStructuredResponse, getNutritionTotals } from '../utils/parseNutrition';
import { Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import AuthModal from '../components/AuthModal';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

export default function UserDashboard() {
    const { data: session, status, update: updateSession } = useSession();
    const [analyses, setAnalyses] = useState([]);
    const [loadingAnalyses, setLoadingAnalyses] = useState(true);
    const [dailySummary, setDailySummary] = useState([]);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [profileModalOpen, setProfileModalOpen] = useState(false);

    // Profile form state with proper initialization
    const [profileForm, setProfileForm] = useState({
        name: '',
        height: '',
        weight: '',
        age: '',
        gender: '',
        activityLevel: '',
        dietaryPreference: '',
        healthGoal: ''
    });

    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

    // Initialize profile form when session or modal opens
    useEffect(() => {
        if (session?.user && profileModalOpen) {
            setProfileForm({
                name: session.user.name || '',
                height: session.user.height?.toString() || '',
                weight: session.user.weight?.toString() || '',
                age: session.user.age?.toString() || '',
                gender: session.user.gender || '',
                activityLevel: session.user.activityLevel || '',
                dietaryPreference: session.user.dietaryPreference || '',
                healthGoal: session.user.healthGoal || '',
            });
            // Clear any previous messages when modal opens
            setProfileError('');
            setProfileSuccess('');
        }
    }, [session?.user, profileModalOpen]);

    // Fetch analyses and summary
    useEffect(() => {
        async function fetchAnalyses() {
            if (!session?.user) return;
            setLoadingAnalyses(true);
            try {
                const res = await fetch('/api/analyses');
                if (res.ok) {
                    const data = await res.json();
                    setAnalyses(data.analyses || []);
                } else {
                    console.error('Failed to fetch analyses');
                }
            } catch (error) {
                console.error('Error fetching analyses:', error);
            } finally {
                setLoadingAnalyses(false);
            }
        }

        async function fetchSummary() {
            if (!session?.user) return;
            setLoadingSummary(true);
            try {
                const res = await fetch('/api/analyses?summary=daily');
                if (res.ok) {
                    const data = await res.json();
                    setDailySummary(data.daily || []);
                } else {
                    console.error('Failed to fetch summary');
                }
            } catch (error) {
                console.error('Error fetching summary:', error);
            } finally {
                setLoadingSummary(false);
            }
        }

        fetchAnalyses();
        fetchSummary();
    }, [session?.user]);

    // Handle profile form submission
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileError('');
        setProfileSuccess('');

        try {
            const updateData = {
                name: profileForm.name.trim(),
                height: profileForm.height ? parseFloat(profileForm.height) : undefined,
                weight: profileForm.weight ? parseFloat(profileForm.weight) : undefined,
                age: profileForm.age ? parseInt(profileForm.age) : undefined,
                gender: profileForm.gender || undefined,
                activityLevel: profileForm.activityLevel || undefined,
                dietaryPreference: profileForm.dietaryPreference || undefined,
                healthGoal: profileForm.healthGoal || undefined,
            };

            const res = await fetch('/api/auth/updateProfile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || `HTTP error! status: ${res.status}`);
            }

            setProfileSuccess('Profile updated successfully!');

            // Update the session with new user data
            if (updateSession) {
                await updateSession({
                    ...session,
                    user: {
                        ...session.user,
                        ...data.user
                    }
                });
            }

            // Close modal after a brief delay
            setTimeout(() => {
                setProfileModalOpen(false);
                setProfileSuccess('');
            }, 1500);

        } catch (error) {
            console.error('Error updating profile:', error);
            setProfileError(error.message || 'Failed to update profile. Please try again.');
        } finally {
            setProfileLoading(false);
        }
    };

    // Handle form input changes
    const handleInputChange = (field, value) => {
        setProfileForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Reset profile modal state when closing
    const handleCloseModal = () => {
        setProfileModalOpen(false);
        setProfileError('');
        setProfileSuccess('');
        // Reset form to current session data
        if (session?.user) {
            setProfileForm({
                name: session.user.name || '',
                height: session.user.height?.toString() || '',
                weight: session.user.weight?.toString() || '',
                age: session.user.age?.toString() || '',
                gender: session.user.gender || '',
                activityLevel: session.user.activityLevel || '',
                dietaryPreference: session.user.dietaryPreference || '',
                healthGoal: session.user.healthGoal || '',
            });
        }
    };

    if (status === 'loading') return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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
                } catch { }
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

    // Helper to infer meal type from time (always use this for grouping)
    function inferMealTypeFromTime(dateStr) {
        const d = new Date(dateStr);
        const hour = d.getHours();
        if (hour >= 5 && hour < 10) return 'Breakfast';
        if (hour >= 10 && hour < 12) return 'Brunch';
        if (hour >= 12 && hour < 15) return 'Lunch';
        if (hour >= 15 && hour < 18) return 'Snacks';
        if (hour >= 18 && hour < 21) return 'Dinner';
        return 'Other';
    }

    function formatTime(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Helper to extract meal type, foodName, and nutrition from structuredNutrition or fallback
    function getMealsFromAnalysis(a) {
        // Always group by upload time
        const meal = inferMealTypeFromTime(a.createdAt);
        let foods = [];
        if (Array.isArray(a.structuredNutrition) && a.structuredNutrition.length > 0) {
            foods = a.structuredNutrition.map(item => ({
                name: item.foodName || 'Unknown',
                calories: Number(item.calories) || 0,
                protein: Number(item.protein) || 0,
                carbs: Number(item.carbs) || 0,
                fat: Number(item.fat) || 0,
                time: formatTime(a.createdAt)
            }));
        } else {
            foods = [{
                name: a.foodDescription || 'Unknown',
                calories: a.calories || 0,
                protein: a.protein || 0,
                carbs: a.carbs || 0,
                fat: a.fat || 0,
                time: formatTime(a.createdAt)
            }];
        }
        // Aggregate nutrition for the meal
        const mealInfo = {
            foods,
            calories: foods.reduce((sum, f) => sum + f.calories, 0),
            protein: foods.reduce((sum, f) => sum + f.protein, 0),
            carbs: foods.reduce((sum, f) => sum + f.carbs, 0),
            fat: foods.reduce((sum, f) => sum + f.fat, 0),
        };
        return { [meal]: mealInfo };
    }

    // Helper to calculate longest streak
    function getLongestStreak(dates) {
        if (!dates.length) return 0;
        const sorted = [...dates].sort();
        let maxStreak = 1, streak = 1;
        for (let i = 1; i < sorted.length; i++) {
            const prev = new Date(sorted[i - 1]);
            const curr = new Date(sorted[i]);
            const diff = (curr - prev) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
                streak++;
                maxStreak = Math.max(maxStreak, streak);
            } else if (diff > 1) {
                streak = 1;
            }
        }
        return maxStreak;
    }

    // Use computed summary instead of API summary
    const computedDailySummary = computeDailySummary(analyses);

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

                {/* Profile Details */}
                <div className="mb-8">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 max-w-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Profile Details</h2>
                            <button
                                onClick={() => setProfileModalOpen(true)}
                                className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                            <div><span className="font-semibold">Name:</span> {user.name || '-'}</div>
                            <div><span className="font-semibold">Height:</span> {user.height ? user.height + ' ft' : '-'}</div>
                            <div><span className="font-semibold">Weight:</span> {user.weight ? user.weight + ' kg' : '-'}</div>
                            <div><span className="font-semibold">Age:</span> {user.age || '-'}</div>
                            <div><span className="font-semibold">Gender:</span> {user.gender || '-'}</div>
                            <div><span className="font-semibold">Activity Level:</span> {user.activityLevel || '-'}</div>
                            <div><span className="font-semibold">Dietary Preference:</span> {user.dietaryPreference || '-'}</div>
                            <div><span className="font-semibold">Health Goal:</span> {user.healthGoal || '-'}</div>
                        </div>
                    </div>
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
                                    {(() => {
                                        // Calculate recommended daily calories based on user profile
                                        if (!user.weight || !user.height || !user.age || !user.gender || !user.activityLevel) {
                                            // Fallback to average if profile incomplete
                                            return computedDailySummary.length > 0 ?
                                                Math.round(computedDailySummary.reduce((acc, day) => acc + day.calories, 0) / computedDailySummary.length) :
                                                0;
                                        }

                                        // Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
                                        const weight = parseFloat(user.weight); // kg
                                        const height = parseFloat(user.height) * 30.48; // convert feet to cm
                                        const age = parseInt(user.age);

                                        let bmr;
                                        if (user.gender.toLowerCase() === 'male') {
                                            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
                                        } else {
                                            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
                                        }

                                        // Apply activity level multiplier
                                        let activityMultiplier;
                                        switch (user.activityLevel.toLowerCase()) {
                                            case 'sedentary':
                                                activityMultiplier = 1.2;
                                                break;
                                            case 'lightly active':
                                                activityMultiplier = 1.375;
                                                break;
                                            case 'moderately active':
                                                activityMultiplier = 1.55;
                                                break;
                                            case 'very active':
                                                activityMultiplier = 1.725;
                                                break;
                                            case 'extremely active':
                                                activityMultiplier = 1.9;
                                                break;
                                            default:
                                                activityMultiplier = 1.2;
                                        }

                                        const maintenanceCalories = bmr * activityMultiplier;

                                        // Adjust based on health goal
                                        let recommendedCalories;
                                        switch (user.healthGoal) {
                                            case 'Lose Weight':
                                                recommendedCalories = maintenanceCalories - 500; // 500 cal deficit
                                                break;
                                            case 'Gain Muscle':
                                                recommendedCalories = maintenanceCalories + 300; // 300 cal surplus
                                                break;
                                            case 'Maintain Weight':
                                                recommendedCalories = maintenanceCalories;
                                                break;
                                            default:
                                                recommendedCalories = maintenanceCalories;
                                        }

                                        return Math.round(recommendedCalories);
                                    })()}
                                </div>
                            </div>
                            
                        </div>

                        <div className="text-sm text-gray-600">Recommended Calories</div>
                        
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
                                <div className="text-2xl font-bold text-gray-900">
                                    {(() => {
                                        const today = new Date().toISOString().slice(0, 10);
                                        const todayAnalyses = analyses.filter(a => a.createdAt.slice(0, 10) === today);
                                        return todayAnalyses.length;
                                    })()}
                                </div>
                                <div className="text-sm text-gray-600">Today</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions & Subscription Status */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Quick Actions */}
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
                                onClick={() => setProfileModalOpen(true)}
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

                    {/* Subscription Status */}
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

                {/* Analytics Section */}
                <div className="mb-12">
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {/* Nutrition Trends Chart */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Nutrition Trends (Last 7 Days)</h3>
                            {computedDailySummary.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No data yet.</div>
                            ) : (
                                <Line
                                    data={{
                                        labels: computedDailySummary.slice(0, 7).map(row => formatDate(row.date)).reverse(),
                                        datasets: [
                                            {
                                                label: 'Calories',
                                                data: computedDailySummary.slice(0, 7).map(row => row.calories).reverse(),
                                                borderColor: 'rgba(99, 102, 241, 1)',
                                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                                tension: 0.4,
                                            },
                                            {
                                                label: 'Protein (g)',
                                                data: computedDailySummary.slice(0, 7).map(row => row.protein).reverse(),
                                                borderColor: 'rgba(16, 185, 129, 1)',
                                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                tension: 0.4,
                                            },
                                            {
                                                label: 'Carbs (g)',
                                                data: computedDailySummary.slice(0, 7).map(row => row.carbs).reverse(),
                                                borderColor: 'rgba(251, 191, 36, 1)',
                                                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                                                tension: 0.4,
                                            },
                                            {
                                                label: 'Fat (g)',
                                                data: computedDailySummary.slice(0, 7).map(row => row.fat).reverse(),
                                                borderColor: 'rgba(239, 68, 68, 1)',
                                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                tension: 0.4,
                                            },
                                        ],
                                    }}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: { position: 'top' },
                                            title: { display: false },
                                        },
                                    }}
                                />
                            )}
                        </div>

                        {/* Macro Distribution Pie Chart */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Macro Distribution (Last Day)</h3>
                            {computedDailySummary.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No data yet.</div>
                            ) : (
                                <Pie
                                    data={{
                                        labels: ['Protein', 'Carbs', 'Fat'],
                                        datasets: [
                                            {
                                                data: [
                                                    computedDailySummary[0].protein,
                                                    computedDailySummary[0].carbs,
                                                    computedDailySummary[0].fat,
                                                ],
                                                backgroundColor: [
                                                    'rgba(16, 185, 129, 0.7)',
                                                    'rgba(251, 191, 36, 0.7)',
                                                    'rgba(239, 68, 68, 0.7)',
                                                ],
                                                borderColor: [
                                                    'rgba(16, 185, 129, 1)',
                                                    'rgba(251, 191, 36, 1)',
                                                    'rgba(239, 68, 68, 1)',
                                                ],
                                                borderWidth: 1,
                                            },
                                        ],
                                    }}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: { position: 'bottom' },
                                            title: { display: false },
                                        },
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {/* Engagement Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                Engagement
                                <span title="Your usage and consistency stats" className="text-gray-400 cursor-help">ℹ️</span>
                            </h3>
                            {computedDailySummary.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No data yet.</div>
                            ) : (
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">Current Streak:</span>
                                        <span>{(() => {
                                            let streak = 0;
                                            let prevDate = null;
                                            for (let i = 0; i < computedDailySummary.length; i++) {
                                                const date = new Date(computedDailySummary[i].date);
                                                if (i === 0) {
                                                    streak = 1;
                                                    prevDate = date;
                                                } else {
                                                    const diff = (prevDate - date) / (1000 * 60 * 60 * 24);
                                                    if (diff === 1) {
                                                        streak++;
                                                        prevDate = date;
                                                    } else {
                                                        break;
                                                    }
                                                }
                                            }
                                            return streak;
                                        })()} days</span>
                                        <span title="Number of consecutive days you have uploaded at least one analysis (up to today)." className="text-gray-400 cursor-help">ℹ️</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">Longest Streak:</span>
                                        <span>{(() => {
                                            const allDates = analyses.map(a => a.createdAt.slice(0, 10));
                                            return getLongestStreak([...new Set(allDates)]);
                                        })()} days</span>
                                        <span title="Your longest run of consecutive days with at least one analysis." className="text-gray-400 cursor-help">ℹ️</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">Avg Analyses/Week (All Time):</span>
                                        <span>{(() => {
                                            if (analyses.length === 0) return 0;
                                            const first = new Date(analyses[analyses.length - 1]?.createdAt);
                                            const last = new Date(analyses[0]?.createdAt);
                                            const weeks = Math.max(1, (last - first) / (1000 * 60 * 60 * 24 * 7));
                                            return (analyses.length / weeks).toFixed(1);
                                        })()}</span>
                                        <span title="Average number of analyses per week since you started using the app." className="text-gray-400 cursor-help">ℹ️</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">Avg Analyses/Week (Last 4 Weeks):</span>
                                        <span>{(() => {
                                            if (analyses.length === 0) return 0;
                                            const now = new Date();
                                            const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
                                            const recent = analyses.filter(a => new Date(a.createdAt) >= fourWeeksAgo);
                                            const weeks = 4;
                                            return (recent.length / weeks).toFixed(1);
                                        })()}</span>
                                        <span title="Average number of analyses per week over the last 4 weeks." className="text-gray-400 cursor-help">ℹ️</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Weekly Summary Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Weekly Summary</h3>
                            {computedDailySummary.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No data yet.</div>
                            ) : (
                                (() => {
                                    const week = computedDailySummary.slice(0, 7);
                                    const total = week.reduce((acc, row) => ({
                                        calories: acc.calories + row.calories,
                                        protein: acc.protein + row.protein,
                                        carbs: acc.carbs + row.carbs,
                                        fat: acc.fat + row.fat,
                                    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
                                    return (
                                        <div className="space-y-2">
                                            <div><span className="font-semibold">Total Calories:</span> {total.calories}</div>
                                            <div><span className="font-semibold">Avg Calories/Day:</span> {(total.calories / week.length).toFixed(0)}</div>
                                            <div><span className="font-semibold">Avg Protein/Day:</span> {(total.protein / week.length).toFixed(1)}g</div>
                                            <div><span className="font-semibold">Avg Carbs/Day:</span> {(total.carbs / week.length).toFixed(1)}g</div>
                                            <div><span className="font-semibold">Avg Fat/Day:</span> {(total.fat / week.length).toFixed(1)}g</div>
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {/* Best/Worst Days Cards */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Best Day (Lowest Calories)</h3>
                            {computedDailySummary.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No data yet.</div>
                            ) : (
                                (() => {
                                    const best = [...computedDailySummary].sort((a, b) => a.calories - b.calories)[0];
                                    return (
                                        <div>
                                            <div className="font-semibold">{formatDate(best.date)}</div>
                                            <div>Calories: {best.calories}</div>
                                            <div>Protein: {best.protein}g</div>
                                            <div>Carbs: {best.carbs}g</div>
                                            <div>Fat: {best.fat}g</div>
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Highest Calorie Day</h3>
                            {computedDailySummary.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No data yet.</div>
                            ) : (
                                (() => {
                                    const worst = [...computedDailySummary].sort((a, b) => b.calories - a.calories)[0];
                                    return (
                                        <div>
                                            <div className="font-semibold">{formatDate(worst.date)}</div>
                                            <div>Calories: {worst.calories}</div>
                                            <div>Protein: {worst.protein}g</div>
                                            <div>Carbs: {worst.carbs}g</div>
                                            <div>Fat: {worst.fat}g</div>
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    </div>
                </div>

                {/* Nutrition History */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Nutrition History</h2>
                    {/* Daily Breakdown */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Daily Log</h3>
                        {analyses.length === 0 ? (
                            <div className="text-gray-500">No data yet.</div>
                        ) : (
                            <div className="max-h-[500px] overflow-y-auto pr-2">
                                <div className="grid md:grid-cols-2 gap-6">
                                    {(() => {
                                        // Group analyses by day and meal type using upload time only
                                        const dayMap = {};
                                        analyses.forEach(a => {
                                            const date = a.createdAt.slice(0, 10);
                                            const meals = getMealsFromAnalysis(a);
                                            if (!dayMap[date]) dayMap[date] = {};
                                            Object.entries(meals).forEach(([meal, info]) => {
                                                if (!dayMap[date][meal]) dayMap[date][meal] = { foods: [], calories: 0, protein: 0, carbs: 0, fat: 0 };
                                                dayMap[date][meal].foods.push(...info.foods);
                                                dayMap[date][meal].calories += info.calories;
                                                dayMap[date][meal].protein += info.protein;
                                                dayMap[date][meal].carbs += info.carbs;
                                                dayMap[date][meal].fat += info.fat;
                                            });
                                        });
                                        return Object.entries(dayMap).sort((a, b) => b[0].localeCompare(a[0])).map(([date, meals]) => (
                                            <div key={date} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 flex flex-col gap-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-lg font-bold text-indigo-600">📅</span>
                                                    <span className="text-lg font-semibold text-gray-900">{formatDate(date)}</span>
                                                </div>
                                                {['Breakfast', 'Brunch', 'Lunch', 'Snacks', 'Dinner', 'Other'].map(meal =>
                                                    meals[meal] ? (
                                                        <div key={meal} className="mb-2">
                                                            <div className="font-semibold text-emerald-700 mb-1">{meal}</div>
                                                            <ul className="list-disc list-inside mt-1 text-gray-800 text-sm space-y-1">
                                                                {meals[meal].foods.map((food, idx) => (
                                                                    <li key={idx} className="mb-2">
                                                                        <div className="flex items-center gap-2">
                                                                            {/* Find the source for this food by matching the parent analysis */}
                                                                            <span className="font-semibold">
                                                                                {(() => {
                                                                                    // Find the parent analysis for this food (by date and food name)
                                                                                    const parentAnalysis = analyses.find(a => {
                                                                                        // Check if this analysis is for this day and contains this food
                                                                                        const analysisDate = a.createdAt.slice(0, 10);
                                                                                        return analysisDate === date && (
                                                                                            (Array.isArray(a.structuredNutrition) && a.structuredNutrition.some(item => item.foodName === food.name)) ||
                                                                                            (a.foodDescription === food.name)
                                                                                        );
                                                                                    });
                                                                                    if (parentAnalysis?.source === 'manual') return <span title="Manual Entry">✍️</span>;
                                                                                    if (parentAnalysis?.imageData) return <span title="Photo Upload">📷</span>;
                                                                                    return null;
                                                                                })()} {food.name}
                                                                            </span>
                                                                            <span className="ml-2 text-gray-500">({food.time})</span>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2 mt-1 ml-4">
                                                                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1">🔥 {food.calories} kcal</span>
                                                                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1">🥩 {food.protein}g</span>
                                                                            <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1">🍚 {food.carbs}g</span>
                                                                            <span className="bg-pink-50 text-pink-700 px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1">🧈 {food.fat}g</span>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ) : null
                                                )}
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Weekly Breakdown */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Weekly Log</h3>
                        {analyses.length === 0 ? (
                            <div className="text-gray-500">No data yet.</div>
                        ) : (
                            <div className="max-h-[500px] overflow-y-auto pr-2">
                                <div className="grid md:grid-cols-2 gap-6">
                                    {(() => {
                                        // Group analyses by week and meal type using upload time only
                                        const weekMap = {};
                                        analyses.forEach(a => {
                                            const d = new Date(a.createdAt);
                                            // Get Monday of the week
                                            const monday = new Date(d);
                                            monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
                                            const weekKey = monday.toISOString().slice(0, 10);
                                            const meals = getMealsFromAnalysis(a);
                                            if (!weekMap[weekKey]) weekMap[weekKey] = {};
                                            Object.entries(meals).forEach(([meal, info]) => {
                                                if (!weekMap[weekKey][meal]) weekMap[weekKey][meal] = { foods: [], calories: 0, protein: 0, carbs: 0, fat: 0, dates: [] };
                                                weekMap[weekKey][meal].foods.push(...info.foods);
                                                weekMap[weekKey][meal].calories += info.calories;
                                                weekMap[weekKey][meal].protein += info.protein;
                                                weekMap[weekKey][meal].carbs += info.carbs;
                                                weekMap[weekKey][meal].fat += info.fat;
                                                weekMap[weekKey][meal].dates.push(a.createdAt.slice(0, 10));
                                            });
                                        });
                                        return Object.entries(weekMap).sort((a, b) => b[0].localeCompare(a[0])).map(([weekStart, meals]) => {
                                            // Find week end
                                            let allDates = [];
                                            Object.values(meals).forEach(m => allDates.push(...(m.dates || [])));
                                            allDates = allDates.sort();
                                            const weekEnd = allDates[allDates.length - 1];
                                            return (
                                                <div key={weekStart} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 flex flex-col gap-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-lg font-bold text-indigo-600">📆</span>
                                                        <span className="text-lg font-semibold text-gray-900">{formatDate(weekStart)} - {formatDate(weekEnd)}</span>
                                                    </div>
                                                    {['Breakfast', 'Brunch', 'Lunch', 'Snacks', 'Dinner', 'Other'].map(meal =>
                                                        meals[meal] ? (
                                                            <div key={meal} className="mb-2">
                                                                <div className="font-semibold text-emerald-700 mb-1">{meal}</div>
                                                                <ul className="list-disc list-inside mt-1 text-gray-800 text-sm space-y-1">
                                                                    {meals[meal].foods.map((food, idx) => (
                                                                        <li key={idx} className="mb-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-semibold">
                                                                                    {(() => {
                                                                                        const parentAnalysis = analyses.find(a => {
                                                                                            const analysisDate = a.createdAt.slice(0, 10);
                                                                                            return (
                                                                                                (Array.isArray(a.structuredNutrition) && a.structuredNutrition.some(item => item.foodName === food.name)) ||
                                                                                                (a.foodDescription === food.name)
                                                                                            );
                                                                                        });
                                                                                        if (parentAnalysis?.source === 'manual') return <span title="Manual Entry">✍️</span>;
                                                                                        if (parentAnalysis?.imageData) return <span title="Photo Upload">📷</span>;
                                                                                        return null;
                                                                                    })()} {food.name}
                                                                                </span>
                                                                                <span className="ml-2 text-gray-500">({food.time})</span>
                                                                            </div>
                                                                            <div className="flex flex-wrap gap-2 mt-1 ml-4">
                                                                                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1">🔥 {food.calories} kcal</span>
                                                                                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1">🥩 {food.protein}g</span>
                                                                                <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1">🍚 {food.carbs}g</span>
                                                                                <span className="bg-pink-50 text-pink-700 px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1">🧈 {food.fat}g</span>
                                                                            </div>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ) : null
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        )}
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
                                    } catch { }
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

                {/* Profile Update Modal */}
                {/* Profile Update Modal */}
                {profileModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Update Profile</h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-1">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={profileForm.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        required
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-700 font-semibold mb-1">
                                            Height (feet)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. 5.7"
                                            value={profileForm.height}
                                            onChange={(e) => handleInputChange('height', e.target.value)}
                                            min="0"
                                            max="10"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 font-semibold mb-1">
                                            Weight (kg)
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. 70"
                                            value={profileForm.weight}
                                            onChange={(e) => handleInputChange('weight', e.target.value)}
                                            min="0"
                                            max="500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-700 font-semibold mb-1">Age</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. 25"
                                            value={profileForm.age}
                                            onChange={(e) => handleInputChange('age', e.target.value)}
                                            min="0"
                                            max="120"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 font-semibold mb-1">Gender</label>
                                        <select
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={profileForm.gender}
                                            onChange={(e) => handleInputChange('gender', e.target.value)}
                                        >
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-semibold mb-1">Activity Level</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={profileForm.activityLevel}
                                        onChange={(e) => handleInputChange('activityLevel', e.target.value)}
                                    >
                                        <option value="">Select</option>
                                        <option value="Sedentary">Sedentary (little/no exercise)</option>
                                        <option value="Lightly Active">Lightly Active (light exercise 1-3 days/week)</option>
                                        <option value="Moderately Active">Moderately Active (moderate exercise 3-5 days/week)</option>
                                        <option value="Very Active">Very Active (hard exercise 6-7 days/week)</option>
                                        <option value="Extremely Active">Extremely Active (very hard exercise, physical job)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-semibold mb-1">Dietary Preference</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={profileForm.dietaryPreference}
                                        onChange={(e) => handleInputChange('dietaryPreference', e.target.value)}
                                    >
                                        <option value="">No specific preference</option>
                                        <option value="Vegetarian">Vegetarian</option>
                                        <option value="Vegan">Vegan</option>
                                        <option value="Gluten-Free">Gluten-Free</option>
                                        <option value="Keto">Keto</option>
                                        <option value="Paleo">Paleo</option>
                                        <option value="Mixed">Mixed (Veg & Non-Veg)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-semibold mb-1">Health Goal</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={profileForm.healthGoal}
                                        onChange={(e) => handleInputChange('healthGoal', e.target.value)}
                                    >
                                        <option value="">Select your goal</option>
                                        <option value="Lose Weight">Lose Weight</option>
                                        <option value="Gain Muscle">Gain Muscle</option>
                                        <option value="Maintain Weight">Maintain Weight</option>
                                        <option value="Improve Health">Improve Overall Health</option>
                                    </select>
                                </div>

                                {profileError && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                        {profileError}
                                    </div>
                                )}

                                {profileSuccess && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                                        {profileSuccess}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                                        disabled={profileLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={profileLoading || !profileForm.name.trim()}
                                    >
                                        {profileLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Updating...
                                            </span>
                                        ) : (
                                            'Update Profile'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}