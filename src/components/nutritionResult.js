import { useState } from 'react';

export default function NutritionResult({ result, weight, height }){
    const [activeTab, setActiveTab] = useState('overview');

    // Parse the structured response from the API
    const parseStructuredResponse = (text) => {
        const sections = {
            foodDescription: '',
            nutritionTable: [],
            userDetails: '',
            suitability: '',
            weightRecommendation: '',
            mealPlan: '',
            eatMore: '',
            avoid: '',
            healthTips: '',
            bmi: null,
            bmiRange: ''
        };

        // Split the response into sections
        const lines = text.split('\n');
        let currentSection = '';
        let tableRows = [];
        let isInTable = false;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            // Detect section headers
            if (trimmedLine.includes("What's on the Plate?") || trimmedLine.includes('🍱')) {
                currentSection = 'foodDescription';
                isInTable = false;
            } else if (trimmedLine.includes('Nutrition Estimate') || trimmedLine.includes('📊')) {
                currentSection = 'nutritionTable';
                isInTable = false;
            } else if (trimmedLine.includes('User Details') || trimmedLine.includes('📏')) {
                currentSection = 'userDetails';
                isInTable = false;
            } else if (trimmedLine.includes('Suitability') || trimmedLine.includes('🎯')) {
                currentSection = 'suitability';
                isInTable = false;
            } else if (trimmedLine.includes('Should They Lose or Gain Weight') || trimmedLine.includes('⚖️')) {
                currentSection = 'weightRecommendation';
                isInTable = false;
            } else if (trimmedLine.includes('1-Day Meal Plan') || trimmedLine.includes('🥗')) {
                currentSection = 'mealPlan';
                isInTable = false;
            } else if (trimmedLine.includes('Eat More') || trimmedLine.includes('✅')) {
                currentSection = 'eatMore';
                isInTable = false;
            } else if (trimmedLine.includes('Avoid/Reduce') || trimmedLine.includes('🚫')) {
                currentSection = 'avoid';
                isInTable = false;
            } else if (trimmedLine.includes('Health Tips') || trimmedLine.includes('💡')) {
                currentSection = 'healthTips';
                isInTable = false;
            }

            // Handle table parsing for nutrition data
            if (currentSection === 'nutritionTable') {
                if (trimmedLine.includes('|') && !trimmedLine.includes('---')) {
                    const cells = trimmedLine.split('|').map(cell => cell.trim()).filter(cell => cell);
                    if (cells.length >= 5) {
                        tableRows.push(cells);
                    }
                    isInTable = true;
                } else if (isInTable && trimmedLine === '') {
                    sections.nutritionTable = tableRows;
                    isInTable = false;
                }
            } else if (currentSection && trimmedLine && !trimmedLine.includes('|') && !trimmedLine.includes('---')) {
                // Add content to current section
                if (sections[currentSection]) {
                    sections[currentSection] += trimmedLine + '\n';
                } else {
                    sections[currentSection] = trimmedLine + '\n';
                }

                // Extract BMI if in user details
                if (currentSection === 'userDetails') {
                    const bmiMatch = trimmedLine.match(/BMI:\s*(\d+(?:\.\d+)?)\s*\(([^)]+)\)/i);
                    if (bmiMatch) {
                        sections.bmi = parseFloat(bmiMatch[1]);
                        sections.bmiRange = bmiMatch[2];
                    }
                }
            }
        });

        // If table wasn't closed, add it
        if (tableRows.length > 0) {
            sections.nutritionTable = tableRows;
        }

        return sections;
    };

    const sections = parseStructuredResponse(result);

    // Extract nutrition totals from table
    const getNutritionTotals = () => {
        if (sections.nutritionTable.length === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
        
        // Find the total row (usually the last row or one with "Total")
        const totalRow = sections.nutritionTable.find(row => 
            row[0] && row[0].toLowerCase().includes('total')
        ) || sections.nutritionTable[sections.nutritionTable.length - 1];

        if (!totalRow || totalRow.length < 5) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

        return {
            calories: parseInt(totalRow[1]?.replace(/[^\d]/g, '') || '0'),
            protein: parseFloat(totalRow[2]?.replace(/[^\d.]/g, '') || '0'),
            carbs: parseFloat(totalRow[3]?.replace(/[^\d.]/g, '') || '0'),
            fat: parseFloat(totalRow[4]?.replace(/[^\d.]/g, '') || '0')
        };
    };

    const nutritionTotals = getNutritionTotals();

    // Calculate daily value percentages
    const calculateDV = (nutrient, value) => {
        // const defaultWeight = 70;
        // const defaultHeight = 5.8;
    
        const weightValue = weight ;
        const heightValue = height ;
    
        const dailyValues = calculateDailyValues(weightValue, heightValue);
        return dailyValues[nutrient] ? Math.round((value / dailyValues[nutrient]) * 100) : 0;
    };
    
    
    const calculateDailyValues = (weightKg, heightFeet) => {
        const heightCm = heightFeet * 30.48;
        const age = 25; // You can later make this dynamic
        const genderConstant = 5; // 5 for male, -161 for female (if you want gender-based)
    
        const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + genderConstant;
        const totalCalories = bmr * 1.4; // light activity multiplier
    
        const proteinGrams = weightKg * 1.6;
        const proteinCalories = proteinGrams * 4;
    
        const fatCalories = totalCalories * 0.3;
        const fatGrams = fatCalories / 9;
    
        const carbCalories = totalCalories - (proteinCalories + fatCalories);
        const carbGrams = carbCalories / 4;
    
        return {
            calories: Math.round(totalCalories),
            protein: Math.round(proteinGrams),
            carbs: Math.round(carbGrams),
            fat: Math.round(fatGrams),
        };
    };
    
    // Get BMI status color
    const getBMIStatus = (bmi) => {
        if (bmi < 18.5) return { color: 'text-blue-600', bg: 'bg-blue-100', status: 'Underweight' };
        if (bmi < 25) return { color: 'text-green-600', bg: 'bg-green-100', status: 'Normal' };
        if (bmi < 30) return { color: 'text-yellow-600', bg: 'bg-yellow-100', status: 'Overweight' };
        return { color: 'text-red-600', bg: 'bg-red-100', status: 'Obese' };
    };

    const bmiStatus = sections.bmi ? getBMIStatus(sections.bmi) : null;

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
                            {/* Food Description */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-200">
                            <h3 className="text-xl font-bold text-emerald-800 mb-4 flex items-center">
    <span className="mr-2">🍱</span>
    What&apos;s on the Plate?
</h3>

                                <p className="text-emerald-700 leading-relaxed">
                                    {sections.foodDescription || 'Food analysis will appear here...'}
                                </p>
                            </div>

                            {/* Quick Stats Cards */}
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl border border-red-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl">🔥</span>
                                        <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                            {calculateDV('calories', nutritionTotals.calories)}% DV
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-red-800 text-lg">{nutritionTotals.calories}</h3>
                                    <p className="text-red-600 text-sm">Calories</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl">💪</span>
                                        <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                            {calculateDV('protein', nutritionTotals.protein)}% DV
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-blue-800 text-lg">{nutritionTotals.protein}g</h3>
                                    <p className="text-blue-600 text-sm">Protein</p>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-2xl border border-yellow-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl">⚡</span>
                                        <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                                            {calculateDV('carbs', nutritionTotals.carbs)}% DV
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-yellow-800 text-lg">{nutritionTotals.carbs}g</h3>
                                    <p className="text-yellow-600 text-sm">Carbs</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl">🥑</span>
                                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                            {calculateDV('fat', nutritionTotals.fat)}% DV
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-green-800 text-lg">{nutritionTotals.fat}g</h3>
                                    <p className="text-green-600 text-sm">Fat</p>
                                </div>
                            </div>

                            {/* User Details & BMI */}
                            {sections.bmi && (
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200">
                                    <h3 className="text-xl font-bold text-indigo-800 mb-4 flex items-center">
                                        <span className="mr-2">📏</span>
                                        Your Health Profile
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <pre className="text-indigo-700 whitespace-pre-wrap leading-relaxed">
                                                {sections.userDetails}
                                            </pre>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <div className={`${bmiStatus.bg} p-6 rounded-2xl text-center`}>
                                                <div className="text-3xl mb-2">⚖️</div>
                                                <div className={`text-2xl font-bold ${bmiStatus.color} mb-1`}>
                                                    {sections.bmi}
                                                </div>
                                                <div className={`text-sm font-semibold ${bmiStatus.color}`}>
                                                    {bmiStatus.status}
                                                </div>
                                                <div className="text-xs text-gray-600 mt-1">
                                                    {sections.bmiRange}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Suitability */}
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
                                <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
                                    <span className="mr-2">🎯</span>
                                    Food Suitability
                                </h3>
                                <pre className="text-purple-700 whitespace-pre-wrap leading-relaxed">
                                    {sections.suitability}
                                </pre>
                            </div>
                        </div>
                    )}

                    {activeTab === 'nutrition' && (
                        <div className="animate-slideIn space-y-6">
                            {/* Nutrition Table */}
                            {sections.nutritionTable.length > 0 && (
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                                    <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center">
                                        <span className="mr-3">📊</span>
                                        Nutritional Breakdown
                                    </h3>
                                    
                                    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-900 text-white">
                                                    <tr>
                                                        {sections.nutritionTable[0]?.map((header, index) => (
                                                            <th key={index} className="px-6 py-4 text-left font-semibold">
                                                                {header}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {sections.nutritionTable.slice(1).map((row, index) => (
                                                        <tr key={index} className={`hover:bg-gray-50 transition-colors duration-200 ${
                                                            row[0]?.toLowerCase().includes('total') 
                                                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 font-bold border-t-2 border-blue-200' 
                                                                : ''
                                                        }`}>
                                                            {row.map((cell, cellIndex) => (
                                                                <td key={cellIndex} className="px-6 py-4 text-gray-800">
                                                                    {cellIndex === 0 ? (
                                                                        <div className="flex items-center space-x-2">
                                                                            <span className="text-lg">
                                                                                {row[0]?.toLowerCase().includes('total') ? '🍽️' : '🥘'}
                                                                            </span>
                                                                            <span>{cell}</span>
                                                                        </div>
                                                                    ) : (
                                                                        cell
                                                                    )}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Nutrition Facts Panel */}
                            <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                                <div className="bg-gray-900 text-white p-4">
                                    <h4 className="text-xl font-bold">Nutrition Facts</h4>
                                    <p className="text-gray-300 text-sm">Per total serving</p>
                                </div>
                                
                                <div className="p-6 space-y-4">
                                    {[
                                        { label: 'Calories', value: nutritionTotals.calories, unit: 'kcal', icon: '🔥', color: 'red' },
                                        { label: 'Protein', value: nutritionTotals.protein, unit: 'g', icon: '💪', color: 'blue' },
                                        { label: 'Carbohydrates', value: nutritionTotals.carbs, unit: 'g', icon: '⚡', color: 'yellow' },
                                        { label: 'Total Fat', value: nutritionTotals.fat, unit: 'g', icon: '🥑', color: 'green' }
                                    ].map((nutrient, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-2xl">{nutrient.icon}</span>
                                                <span className="font-semibold text-gray-800">{nutrient.label}</span>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <span className="text-xl font-bold text-gray-800">
                                                    {nutrient.value}{nutrient.unit}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${nutrient.color}-100 text-${nutrient.color}-600`}>
                                                    {calculateDV(nutrient.label.toLowerCase().replace('total ', '').replace('carbohydrates', 'carbs'), nutrient.value)}% DV
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'recommendations' && (
                        <div className="animate-slideIn space-y-6">
                            {/* Weight Recommendation */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200">
                                <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
                                    <span className="mr-2">⚖️</span>
                                    Weight Management
                                </h3>
                                <pre className="text-amber-700 whitespace-pre-wrap leading-relaxed">
                                    {sections.weightRecommendation}
                                </pre>
                            </div>

                            {/* Foods to Eat More */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                                <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                                    <span className="mr-2">✅</span>
                                    Foods to Eat More
                                </h3>
                                <pre className="text-green-700 whitespace-pre-wrap leading-relaxed">
                                    {sections.eatMore}
                                </pre>
                            </div>

                            {/* Foods to Avoid */}
                            <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-2xl border border-red-200">
                                <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center">
                                    <span className="mr-2">🚫</span>
                                    Foods to Avoid/Reduce
                                </h3>
                                <pre className="text-red-700 whitespace-pre-wrap leading-relaxed">
                                    {sections.avoid}
                                </pre>
                            </div>
                        </div>
                    )}

                    {activeTab === 'mealPlan' && (
                        <div className="animate-slideIn">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                                <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
                                    <span className="mr-2">📅</span>
                                    Your 1-Day Meal Plan
                                </h3>
                                <pre className="text-blue-700 whitespace-pre-wrap leading-relaxed">
                                    {sections.mealPlan}
                                </pre>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tips' && (
                        <div className="animate-slideIn">
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-200">
                                <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
                                    <span className="mr-2">💡</span>
                                    Personalized Health Tips
                                </h3>
                                <pre className="text-purple-700 whitespace-pre-wrap leading-relaxed">
                                    {sections.healthTips}
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