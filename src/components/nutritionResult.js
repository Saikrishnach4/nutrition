import { useState } from 'react';

export default function NutritionResult({ result }) {
    const [activeTab, setActiveTab] = useState('overview');

    // Parse the result to extract different sections
    const parseResult = (text) => {
        const sections = {
            overview: '',
            nutrition: '',
            recommendations: '',
            mealPlan: '',
            tips: ''
        };

        // Simple parsing - you can enhance this based on your AI response format
        const lines = text.split('\n');
        let currentSection = 'overview';
        
        lines.forEach(line => {
            const lowerLine = line.toLowerCase();
            if (lowerLine.includes('nutrition') || lowerLine.includes('calories') || lowerLine.includes('protein')) {
                currentSection = 'nutrition';
            } else if (lowerLine.includes('recommend') || lowerLine.includes('suitable')) {
                currentSection = 'recommendations';
            } else if (lowerLine.includes('meal plan') || lowerLine.includes('daily')) {
                currentSection = 'mealPlan';
            } else if (lowerLine.includes('tips') || lowerLine.includes('advice')) {
                currentSection = 'tips';
            }
            
            sections[currentSection] += line + '\n';
        });

        return sections;
    };

    const sections = parseResult(result);

    const tabs = [
        { id: 'overview', label: '📊 Overview', icon: '📊' },
        { id: 'nutrition', label: '🍎 Nutrition', icon: '🍎' },
        { id: 'recommendations', label: '💡 Recommendations', icon: '💡' },
        { id: 'mealPlan', label: '📅 Meal Plan', icon: '📅' },
        { id: 'tips', label: '✨ Tips', icon: '✨' }
    ];

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">🎯 Nutrition Analysis</h2>
                        <p className="text-blue-100">Your personalized food insights</p>
                    </div>
                    <div className="text-6xl opacity-20">🍱</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 px-6 py-4 text-sm font-semibold transition-all duration-300 border-b-2 ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                            }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-8">
                <div className="min-h-[300px]">
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-slideIn">
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl border border-green-200">
                                    <div className="text-3xl mb-2">🔥</div>
                                    <h3 className="font-bold text-green-800 mb-1">Calories</h3>
                                    <p className="text-green-600 text-sm">Estimated energy content</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 p-6 rounded-2xl border border-blue-200">
                                    <div className="text-3xl mb-2">💪</div>
                                    <h3 className="font-bold text-blue-800 mb-1">Protein</h3>
                                    <p className="text-blue-600 text-sm">Muscle building nutrients</p>
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-amber-100 p-6 rounded-2xl border border-orange-200">
                                    <div className="text-3xl mb-2">⚡</div>
                                    <h3 className="font-bold text-orange-800 mb-1">Carbs</h3>
                                    <p className="text-orange-600 text-sm">Energy source</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl">
                                <pre className="text-gray-800 whitespace-pre-wrap font-medium leading-relaxed">
                                    {sections.overview || result}
                                </pre>
                            </div>
                        </div>
                    )}

                    {activeTab === 'nutrition' && (
                        <div className="animate-slideIn">
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                                <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                                    <span className="mr-2">🍎</span>
                                    Nutritional Breakdown
                                </h3>
                                <pre className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                    {sections.nutrition || 'Detailed nutrition information will appear here...'}
                                </pre>
                            </div>
                        </div>
                    )}

                    {activeTab === 'recommendations' && (
                        <div className="animate-slideIn">
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-200">
                                <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
                                    <span className="mr-2">💡</span>
                                    Personalized Recommendations
                                </h3>
                                <pre className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                    {sections.recommendations || 'Personalized recommendations will appear here...'}
                                </pre>
                            </div>
                        </div>
                    )}

                    {activeTab === 'mealPlan' && (
                        <div className="animate-slideIn">
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200">
                                <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
                                    <span className="mr-2">📅</span>
                                    Daily Meal Plan
                                </h3>
                                <pre className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                    {sections.mealPlan || 'Your personalized meal plan will appear here...'}
                                </pre>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tips' && (
                        <div className="animate-slideIn">
                            <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-2xl border border-pink-200">
                                <h3 className="text-xl font-bold text-pink-800 mb-4 flex items-center">
                                    <span className="mr-2">✨</span>
                                    Health Tips
                                </h3>
                                <pre className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                    {sections.tips || 'Personalized health tips will appear here...'}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                    💡 This analysis is AI-generated and should not replace professional medical advice
                </p>
            </div>
        </div>
    );
}