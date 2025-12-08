export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">SamvadSetu - Hand Gesture Recognition</h1>
        <p className="text-lg text-gray-600 mb-8">
          ✅ Model trained successfully
        </p>
        <p className="text-lg text-gray-600 mb-4">
          ✅ API configured
        </p>
        <p className="text-lg text-gray-600 mb-8">
          ✅ Ready for real-time gesture recognition
        </p>
        <a 
          href="/recognize"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to Gesture Recognizer
        </a>
      </div>
    </main>
  );
}
