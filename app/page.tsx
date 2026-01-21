export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-center text-white px-4">
        <h1 className="text-6xl font-bold mb-4">
          Welcome to LifeAligner
        </h1>
        <p className="text-xl mb-8">
          Align your career with your core values
        </p>
        <div className="flex gap-4 justify-center">
          <button className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition">
            Get Started
          </button>
          <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
