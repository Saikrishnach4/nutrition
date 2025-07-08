// Utility to parse structured nutrition response and extract totals
export function parseStructuredResponse(text) {
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
    const lines = text.split('\n');
    let currentSection = '';
    let tableRows = [];
    let isInTable = false;
    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.includes("What's on the Plate?") || trimmedLine.includes('🍱')) {
            currentSection = 'foodDescription'; isInTable = false;
        } else if (trimmedLine.includes('Nutrition Estimate') || trimmedLine.includes('📊')) {
            currentSection = 'nutritionTable'; isInTable = false;
        } else if (trimmedLine.includes('User Details') || trimmedLine.includes('📏')) {
            currentSection = 'userDetails'; isInTable = false;
        } else if (trimmedLine.includes('Suitability') || trimmedLine.includes('🎯')) {
            currentSection = 'suitability'; isInTable = false;
        } else if (trimmedLine.includes('Should They Lose or Gain Weight') || trimmedLine.includes('⚖️')) {
            currentSection = 'weightRecommendation'; isInTable = false;
        } else if (trimmedLine.includes('1-Day Meal Plan') || trimmedLine.includes('🥗')) {
            currentSection = 'mealPlan'; isInTable = false;
        } else if (trimmedLine.includes('Eat More') || trimmedLine.includes('✅')) {
            currentSection = 'eatMore'; isInTable = false;
        } else if (trimmedLine.includes('Avoid/Reduce') || trimmedLine.includes('🚫')) {
            currentSection = 'avoid'; isInTable = false;
        } else if (trimmedLine.includes('Health Tips') || trimmedLine.includes('💡')) {
            currentSection = 'healthTips'; isInTable = false;
        }
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
            if (sections[currentSection]) {
                sections[currentSection] += trimmedLine + '\n';
            } else {
                sections[currentSection] = trimmedLine + '\n';
            }
            if (currentSection === 'userDetails') {
                const bmiMatch = trimmedLine.match(/BMI:\s*(\d+(?:\.\d+)?)\s*\(([^)]+)\)/i);
                if (bmiMatch) {
                    sections.bmi = parseFloat(bmiMatch[1]);
                    sections.bmiRange = bmiMatch[2];
                }
            }
        }
    });
    if (tableRows.length > 0) {
        sections.nutritionTable = tableRows;
    }
    return sections;
}

export function getNutritionTotals(sections) {
    if (!sections.nutritionTable || sections.nutritionTable.length === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const totalRow = sections.nutritionTable.find(row => row[0] && row[0].toLowerCase().includes('total')) || sections.nutritionTable[sections.nutritionTable.length - 1];
    if (!totalRow || totalRow.length < 5) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return {
        calories: parseInt(totalRow[1]?.replace(/[^\d]/g, '') || '0'),
        protein: parseFloat(totalRow[2]?.replace(/[^\d.]/g, '') || '0'),
        carbs: parseFloat(totalRow[3]?.replace(/[^\d.]/g, '') || '0'),
        fat: parseFloat(totalRow[4]?.replace(/[^\d.]/g, '') || '0')
    };
} 