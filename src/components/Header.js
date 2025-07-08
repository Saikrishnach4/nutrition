import { useState } from 'react';
import { useRouter } from 'next/router';
import AuthModal from './AuthModal';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authTab, setAuthTab] = useState('signin');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();
    const user = session?.user;

    const handleAuthClick = (tab) => {
        setAuthTab(tab);
        setShowAuthModal(true);
    };

    const handleSignOut = () => {
        signOut({ callbackUrl: '/' });
        setShowUserMenu(false);
    };

    return (
        <>
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div 
                            className="flex items-center cursor-pointer"
                            onClick={() => router.push('/')}
                        >
                            <div className="text-3xl mr-3">🍱</div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                    Dishalyze
                                </h1>
                                <p className="text-xs text-gray-500">Smart Food Analysis</p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center space-x-8">
                            <a 
                                href="#features" 
                                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                Features
                            </a>
                            <a 
                                href="#pricing" 
                                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                Pricing
                            </a>
                            <a 
                                href="#about" 
                                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                About
                            </a>
                        </nav>

                        {/* Auth Section */}
                        <div className="flex items-center space-x-4">
                            {user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 rounded-full px-4 py-2 transition-all duration-300"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                                            {user.name?.charAt(0) || user.email?.charAt(0)}
                                        </div>
                                        <span className="hidden md:block text-gray-700 font-medium">
                                            {user.name || user.email}
                                        </span>
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* User Dropdown */}
                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {user.email}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    console.log('Dashboard clicked');
                                                    setShowUserMenu(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                📊 Dashboard
                                            </button>
                                            <button
                                                onClick={() => {
                                                    console.log('Profile clicked');
                                                    setShowUserMenu(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                ⚙️ Settings
                                            </button>
                                            <button
                                                onClick={() => {
                                                    console.log('Subscription clicked');
                                                    setShowUserMenu(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                💳 Subscription
                                            </button>
                                            <hr className="my-2" />
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                🚪 Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => handleAuthClick('signin')}
                                        className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        onClick={() => handleAuthClick('signup')}
                                        className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105"
                                    >
                                        Get Started
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Auth Modal */}
            <AuthModal 
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                defaultTab={authTab}
            />
        </>
    );
}