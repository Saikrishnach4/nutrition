import { useState, useRef } from 'react';
import Image from 'next/image';
import NutritionResult from './nutritionResult';
import LoadingAnimation from './loadingAnimation';

export default function UploadForm() {
    const [file, setFile] = useState(null);
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        setFile(selectedFile);
        
        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target.result);
            reader.readAsDataURL(selectedFile);
        } else {
            setPreview(null);
        }
    };

    const handleTakePhotoClick = async () => {
        setShowCamera(true);
        setCapturing(true);
        setPreview(null);
        setFile(null);
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        }
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (blob) {
                    const capturedFile = new File([blob], 'captured.jpg', { type: 'image/jpeg' });
                    setFile(capturedFile);
                    setPreview(URL.createObjectURL(blob));
                }
            }, 'image/jpeg');
            // Stop camera
            const stream = video.srcObject;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            setShowCamera(false);
            setCapturing(false);
        }
    };

    const handleCancelCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject;
            stream.getTracks().forEach(track => track.stop());
        }
        setShowCamera(false);
        setCapturing(false);
    };

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

    const resetForm = () => {
        setFile(null);
        setPreview(null);
        setWeight('');
        setHeight('');
        setResult(null);
        setError('');
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Camera Modal */}
            {showCamera && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 flex flex-col items-center">
                        <video ref={videoRef} className="rounded-xl mb-4" autoPlay playsInline width={400} height={300} />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        <div className="flex gap-4">
                            <button onClick={handleCapture} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-emerald-600">Capture</button>
                            <button onClick={handleCancelCamera} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-xl font-semibold hover:bg-gray-400">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Upload Section */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white">
                    <h2 className="text-2xl font-bold mb-2">📸 Upload Your Food</h2>
                    <p className="text-emerald-100">Get instant nutrition analysis and personalized recommendations</p>
                </div>
                <div className="p-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Image Upload */}
                        <div className="space-y-6">
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label
                                    htmlFor="image-upload"
                                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all duration-300 hover:border-emerald-400 group"
                                >
                                    {preview ? (
                                        <div className="relative w-full h-full">
                                            <Image 
                                                width={300}
                                                height={200}
                                                src={preview}
                                                alt="Preview"
                                                className="w-full h-full object-cover rounded-2xl"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <span className="text-white font-medium">Click to change image</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="w-16 h-16 mx-auto mb-4 text-gray-400 group-hover:text-emerald-500 transition-colors duration-300">
                                                <svg fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <p className="text-lg font-medium text-gray-700 mb-2">Upload or capture food image</p>
                                            <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                                        </div>
                                    )}
                                </label>
                                <button
                                    type="button"
                                    onClick={handleTakePhotoClick}
                                    className="absolute bottom-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-xl font-semibold shadow hover:bg-emerald-600 transition-all duration-300"
                                >
                                    📷 Take Photo
                                </button>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    ⚖️ Weight (kg)
                                </label>
                                <input
                                    type="number"
                                    placeholder="Enter your weight"
                                    value={weight}
                                    onChange={(e) => setWeight(parseFloat(e.target.value))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 text-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    📏 Height (feet)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="Enter your height"
                                    value={height}
                                    onChange={(e) => setHeight(parseFloat(e.target.value))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 text-lg"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleUpload}
                                    disabled={loading || !file || !weight || !height}
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-4 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Analyzing...
                                        </span>
                                    ) : (
                                        '🔍 Analyze Nutrition'
                                    )}
                                </button>
                                
                                {(file || result) && (
                                    <button
                                        onClick={resetForm}
                                        className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-center">
                                <div className="text-red-400 mr-3">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="text-red-800 font-medium">{error}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Loading Animation */}
            {loading && <LoadingAnimation />}

            {/* Results */}
            {result && <NutritionResult result={result} weight={weight} height={height} />}

        </div>
    );
}