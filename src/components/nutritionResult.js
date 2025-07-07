export default function NutritionResult({ result }) {
    return (
        <div className="mt-6 p-6 bg-white border rounded shadow text-left whitespace-pre-wrap">
            <h2 className="font-bold text-xl mb-4 text-green-700">🍱 Nutrition Result:</h2>
            <pre className="text-gray-800 whitespace-pre-wrap">{result}</pre>
        </div>
    );
}
