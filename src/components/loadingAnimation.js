export default function LoadingAnimation() {
    return (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8 animate-fadeIn">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white">
                <h2 className="text-2xl font-bold mb-2">🤖 AI Analysis in Progress</h2>
                <p className="text-indigo-100">Our AI is analyzing your food image...</p>
            </div>
            
            <div className="p-8">
                <div className="space-y-6">
                    {/* Progress Steps */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span className="text-gray-700 font-medium">Image uploaded successfully</span>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-spin">
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                            </div>
                            <span className="text-gray-700 font-medium">Analyzing food composition...</span>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                            </div>
                            <span className="text-gray-400">Calculating nutrition values...</span>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                            </div>
                            <span className="text-gray-400">Generating personalized recommendations...</span>
                        </div>
                    </div>

                    {/* Animated Food Icons */}
                    <div className="flex justify-center space-x-4 py-8">
                        <div className="text-4xl animate-bounce" style={{ animationDelay: '0s' }}>🍎</div>
                        <div className="text-4xl animate-bounce" style={{ animationDelay: '0.1s' }}>🥗</div>
                        <div className="text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>🍊</div>
                        <div className="text-4xl animate-bounce" style={{ animationDelay: '0.3s' }}>🥑</div>
                        <div className="text-4xl animate-bounce" style={{ animationDelay: '0.4s' }}>🍇</div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>

                    <div className="text-center">
                        <p className="text-gray-600 font-medium">This usually takes 10-15 seconds</p>
                        <p className="text-sm text-gray-500 mt-1">Please wait while we process your image...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}