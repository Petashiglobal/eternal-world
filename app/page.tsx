export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="text-2xl font-bold text-gray-800">EternalVault</div>
        <div className="space-x-4">
          <button className="text-gray-600 hover:text-gray-900">Login</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Your Story Deserves to 
          <span className="text-blue-600"> Live Forever</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Preserve your memories, wisdom, and legacy in a secure digital vault. 
          Share your authentic self with future generations, only when the time is right.
        </p>
        <div className="space-x-4">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
            Create Your Legacy
          </button>
          <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors">
            Learn More
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8 text-center text-gray-600">
        <p>© 2024 EternalVault. Your legacy, preserved forever.</p>
      </footer>
    </div>
  );
}