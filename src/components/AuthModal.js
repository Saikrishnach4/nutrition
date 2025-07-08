import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';

export default function AuthModal({ isOpen, onClose, defaultTab = 'signin' }) {
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { data: session, status } = useSession();

    useEffect(() => {
        if (session?.error) {
            setError(session.error);
        }
    }, [session]);

    useEffect(() => {
        setError('');
    }, [activeTab, isOpen]);

    if (!isOpen || status === 'loading') return null;

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const res = await signIn('credentials', {
            redirect: false,
            email: formData.email,
            password: formData.password
        });
        setLoading(false);
        if (res.error) {
            setError('Invalid email or password');
        } else {
            onClose();
            window.location.reload();
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password
                })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || 'Signup failed');
                setLoading(false);
                return;
            }
            const loginRes = await signIn('credentials', {
                redirect: false,
                email: formData.email,
                password: formData.password
            });
            setLoading(false);
            if (loginRes.error) {
                setError('Account created, but login failed. Please try signing in.');
            } else {
                onClose();
                window.location.reload();
            }
        } catch (err) {
            setError('Signup failed');
            setLoading(false);
        }
    };

    const handleGoogleSignUp = () => {
        signIn('google', { callbackUrl: '/', state: 'signup' });
    };
    const handleGoogleLogin = () => {
        signIn('google', { callbackUrl: '/', state: 'login' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <h2 className="text-2xl font-bold text-center">
                        {activeTab === 'signin' ? 'Welcome Back!' : 'Join Dishalyze'}
                    </h2>
                    <p className="text-emerald-100 text-center mt-2">
                        {activeTab === 'signin'
                            ? 'Sign in to continue your nutrition journey'
                            : 'Start your personalized nutrition journey'}
                    </p>
                </div>

                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('signin')}
                        className={`flex-1 py-4 px-6 font-semibold transition-all duration-300 ${activeTab === 'signin'
                                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => setActiveTab('signup')}
                        className={`flex-1 py-4 px-6 font-semibold transition-all duration-300 ${activeTab === 'signup'
                                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        Sign Up
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Google Buttons: Show only one depending on activeTab */}
                    {activeTab === 'signup' ? (
                        <button
                            onClick={handleGoogleSignUp}
                            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white text-gray-700 hover:bg-gray-50 transition-all duration-300 mb-3"
                        >
                            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Sign Up with Google
                        </button>
                    ) : (
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white text-gray-700 hover:bg-gray-50 transition-all duration-300 mb-6"
                        >
                            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Log In with Google
                        </button>
                    )}

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                        </div>
                    </div>

                    {activeTab === 'signin' ? (
                        <form onSubmit={handleSignIn} className="space-y-4">
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 bg-white"
                                placeholder="Email"
                                required
                            />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 bg-white"
                                placeholder="Password"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-4 rounded-xl"
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSignUp} className="space-y-4">
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 bg-white"
                                placeholder="Full Name"
                                required
                            />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 bg-white"
                                placeholder="Email"
                                required
                            />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 bg-white"
                                placeholder="Password"
                                required
                            />
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 bg-white"
                                placeholder="Confirm Password"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-4 rounded-xl"
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center text-sm text-gray-600">
                        By continuing, you agree to our{' '}
                        <a href="/terms" className="text-emerald-600 hover:underline">Terms</a> and{' '}
                        <a href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
