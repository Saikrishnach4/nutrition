import Head from 'next/head';
import UploadForm from '../components/uploadform';

export default function Home() {
  return (
    <>
      <Head>
        <title>NutriVision AI - Smart Food Analysis</title>
        <meta name="description" content="Get instant nutrition analysis and personalized recommendations with AI-powered food recognition" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10"></div>
          <div className="relative max-w-7xl mx-auto px-6 py-16">
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-md border border-gray-200 mb-8">
                <span className="text-2xl mr-2">🤖</span>
                <span className="text-sm font-semibold text-gray-700">Powered by Advanced AI</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  NutriVision
                </span>
                <br />
                <span className="text-gray-700">Smart Food Analysis</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Upload a photo of your meal and get instant nutrition analysis, personalized recommendations, 
                and custom meal plans tailored to your body type and health goals.
              </p>

              <div className="flex flex-wrap justify-center gap-6 mb-12">
                <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm font-medium text-gray-700">Instant Analysis</span>
                </div>
                <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm font-medium text-gray-700">Personalized Tips</span>
                </div>
                <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm font-medium text-gray-700">Custom Meal Plans</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative">
          <UploadForm />
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose NutriVision?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform provides comprehensive nutrition analysis and personalized health insights
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Advanced Recognition</h3>
              <p className="text-gray-600 leading-relaxed">
                Our AI accurately identifies food items and estimates portion sizes from your photos
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Detailed Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Get comprehensive nutrition breakdowns including calories, macros, and micronutrients
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Personal Recommendations</h3>
              <p className="text-gray-600 leading-relaxed">
                Receive tailored advice based on your body metrics and health goals
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="text-center">
              <p className="text-gray-600">
                © 2025 NutriVision AI. Made with ❤️ for healthier living.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Always consult with healthcare professionals for medical advice.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}