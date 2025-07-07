import { useState } from 'react';
import NutritionResult from './nutritionResult';

export default function UploadForm() {
    const [file, setFile] = useState(null);
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleUpload = async () => {
        if (!file || !weight || !height) {
            setError('Please provide image, weight, and height');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('weight', weight);
            formData.append('height', height);

            const res = await fetch('/api/analyze', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setResult(data.result);
            } else {
                setError(data.error || 'Something went wrong');
            }
        } catch (err) {
            setError('Failed to analyze image');
        }

        setLoading(false);
    };

    return (
        <div className="max-w-xl mx-auto p-4 mt-10 text-center space-y-4">
            <label className="block text-lg font-semibold">Upload or Capture Food Image:</label>

            <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setFile(e.target.files?.[0])}
                className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />

            <input
                type="number"
                placeholder="Weight (kg)"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full border p-2 rounded"
            />

            <input
                type="number"
                placeholder="Height (feet)"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full border p-2 rounded"
            />

            <button
                onClick={handleUpload}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
                {loading ? 'Analyzing...' : 'Upload & Analyze'}
            </button>

            {error && <p className="text-red-600 font-medium mt-4">{error}</p>}
            {result && <NutritionResult result={result} />}
        </div>
    );
}
