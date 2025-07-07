import { useState } from 'react';

export default function NutritionResult({ result }) {
    const [activeTab, setActiveTab] = useState('overview');

    // Parse the result to extract nutrition data and create structured information
    const parseNutritionData = (text) => {
        // Extract nutrition values using regex patterns
        const caloriesMatch = text.match(/(\d+)\s*(?:calories|kcal|cal)/i);
        const proteinMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*(?:of\s+)?protein/i);
        const carbsMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*(?:of\s+)?(?:carb|carbohydrate)/i);
        const fatMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*(?:of\s+)?fat/i);
        const fiberMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*(?:of\s+)?fiber/i);
        const sugarMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*(?:of\s+)?sugar/i);
        const sodiumMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:mg|milligrams?)\s*(?:of\s+)?sodium/i);

        return {
            calories: caloriesMatch ? parseInt(caloriesMatch[1]) : 0,
            protein: proteinMatch ? parseFloat(proteinMatch[1]) : 0,
            carbs: carbsMatch ? parseFloat(carbsMatch[1]) : 0,
            fat: fatMatch ? parseFloat(fatMatch[1]) : 0,
            fiber: fiberMatch ? parseFloat(fiberMatch[1]) : 0,
            sugar: sugarMatch ? parseFloat(sugarMatch[1]) : 0,
            sodium: sodiumMatch ? parseFloat(sodiumMatch[1]) : 0,
        };
    };

    // Parse the result to extract different sections
    const parseResult = (text) => {
        const sections = {
            overview: '',
            nutrition: '',
            recommendations: '',
            mealPlan: '',
            tips: ''
        };

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
    const nutritionData = parseNutritionData(result);

    // Calculate daily value percentages (based on 2000 calorie diet)
    const calculateDV = (nutrient, value) => {
        const dailyValues = {
            calories: 2000,
            protein: 50,
            carbs: 300,
            fat: 65,
            fiber: 25,
            sodium: 2300
        };
        return dailyValues[nutrient] ? Math.round((value / dailyValues[nutrient]) * 100) : 0;
    };

    const nutritionTableData = [
        {
            nutrient: 'Calories',
            amount: nutritionData.calories,
            unit: 'kcal',
            dailyValue: calculateDV('calories', nutritionData.calories),
            icon: '🔥',
            color: 'from-red-500 to-orange-500',
            bgColor: 'from-red-50 to-orange-50',
            borderColor: 'border-red-200'
        },
        {
            nutrient: 'Protein',
            amount: nutritionData.protein,
            unit: 'g',
            dailyValue: calculateDV('protein', nutritionData.protein),
            icon: '💪',
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'from-blue-50 to-cyan-50',
            borderColor: 'border-blue-200'
        },
        {
            nutrient: 'Carbohydrates',
            amount: nutritionData.carbs,
            unit: 'g',
            dailyValue: calculateDV('carbs', nutritionData.carbs),
            icon: '⚡',
            color: 'from-yellow-500 to-amber-500',
            bgColor: 'from-yellow-50 to-amber-50',
            borderColor: 'border-yellow-200'
        },
        {
            nutrient: 'Total Fat',
            amount: nutritionData.fat,
            unit: 'g',
            dailyValue: calculateDV('fat', nutritionData.fat),
            icon: '🥑',
            color: 'from-green-500 to-emerald-500',
            bgColor: 'from-green-50 to-emerald-50',
            borderColor: 'border-green-200'
        },
        {
            nutrient: 'Fiber',
            amount: nutritionData.fiber,
            unit: 'g',
            dailyValue: calculateDV('fiber', nutritionData.fiber),
            icon: '🌾',
            color: 'from-amber-500 to-orange-500',
            bgColor: 'from-amber-50 to-orange-50',
            borderColor: 'border-amber-200'
        },
        {
            nutrient: 'Sugar',
            amount: nutritionData.sugar,
            unit: 'g',
            dailyValue: 0, // No established DV for sugar
            icon: '🍯',
            color: 'from-pink-500 to-rose-500',
            bgColor: 'from-pink-50 to-rose-50',
            borderColor: 'border-pink-200'
        },
        {
            nutrient: 'Sodium',
            amount: nutritionData.sodium,
            unit: 'mg',
            dailyValue: calculateDV('sodium', nutritionData.sodium),
            icon: '🧂',
            color: 'from-gray-500 to-slate-500',
            bgColor: 'from-gray-50 to-slate-50',
            borderColor: 'border-gray-200'
        }
    ];

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
                        <div className="space-y-8 animate-slideIn">
                            {/* Quick Stats Cards */}
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl border border-red-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl">🔥</span>
                                        <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                            {calculateDV('calories', nutritionData.calories)}% DV
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-red-800 text-lg">{nutritionData.calories}</h3>
                                    <p className="text-red-600 text-sm">Calories</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl">💪</span>
                                        <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                            {calculateDV('protein', nutritionData.protein)}% DV
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-blue-800 text-lg">{nutritionData.protein}g</h3>
                                    <p className="text-blue-600 text-sm">Protein</p>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-2xl border border-yellow-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl">⚡</span>
                                        <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                                            {calculateDV('carbs', nutritionData.carbs)}% DV
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-yellow-800 text-lg">{nutritionData.carbs}g</h3>
                                    <p className="text-yellow-600 text-sm">Carbs</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl">🥑</span>
                                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                            {calculateDV('fat', nutritionData.fat)}% DV
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-green-800 text-lg">{nutritionData.fat}g</h3>
                                    <p className="text-green-600 text-sm">Fat</p>
                                </div>
                            </div>

                            {/* Overview Text */}
                            <div className="bg-gray-50 p-6 rounded-2xl">
                                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                    <span className="mr-2">📋</span>
                                    Food Analysis Summary
                                </h3>
                                <pre className="text-gray-800 whitespace-pre-wrap font-medium leading-relaxed">
                                    {sections.overview || result}
                                </pre>
                            </div>
                        </div>
                    )}

                    {activeTab === 'nutrition' && (
                        <div className="animate-slideIn space-y-6">
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                                <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center">
                                    <span className="mr-3">🍎</span>
                                    Detailed Nutritional Breakdown
                                </h3>
                                
                                {/* Nutrition Facts Table */}
                                <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                                    <div className="bg-gray-900 text-white p-4">
                                        <h4 className="text-xl font-bold">Nutrition Facts</h4>
                                        <p className="text-gray-300 text-sm">Per serving</p>
                                    </div>
                                    
                                    <div className="divide-y divide-gray-200">
                                        {nutritionTableData.map((item, index) => (
                                            <div key={index} className={`p-4 bg-gradient-to-r ${item.bgColor} border-l-4 ${item.borderColor} hover:shadow-md transition-all duration-300`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <span className="text-2xl">{item.icon}</span>
                                                        <div>
                                                            <h5 className="font-semibold text-gray-800">{item.nutrient}</h5>
                                                            <p className="text-sm text-gray-600">Essential nutrient</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center space-x-4">
                                                            <div>
                                                                <span className="text-2xl font-bold text-gray-800">
                                                                    {item.amount}
                                                                </span>
                                                                <span className="text-sm text-gray-600 ml-1">
                                                                    {item.unit}
                                                                </span>
                                                            </div>
                                                            {item.dailyValue > 0 && (
                                                                <div className="text-right">
                                                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${item.color} text-white`}>
                                                                        {item.dailyValue}% DV
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 mt-1">Daily Value</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Progress Bar */}
                                                {item.dailyValue > 0 && (
                                                    <div className="mt-3">
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                className={`h-2 rounded-full bg-gradient-to-r ${item.color} transition-all duration-1000 ease-out`}
                                                                style={{ width: `${Math.min(item.dailyValue, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 text-center">
                                        <p className="text-xs text-gray-600">
                                            * Percent Daily Values are based on a 2,000 calorie diet
                                        </p>
                                    </div>
                                </div>

                                {/* Additional Nutrition Info */}
                                <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200">
                                    <pre className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                                        {sections.nutrition || 'Additional nutritional information and analysis...'}
                                    </pre>
                                </div>
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