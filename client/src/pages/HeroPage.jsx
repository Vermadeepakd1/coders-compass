import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Terminal, Code, TrendingUp, Brain, Zap, ChevronRight, Globe, Shield, Target } from 'lucide-react'

const HeroPage = () => {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-[#0c1618] text-gray-100 overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#4ecdc4] rounded-full mix-blend-screen filter blur-[128px] opacity-10"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#0075a2] rounded-full mix-blend-screen filter blur-[128px] opacity-10"></div>
                <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-[#e9b44c] rounded-full mix-blend-screen filter blur-[128px] opacity-5"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <div className="pt-20 pb-16 lg:pt-32 lg:pb-24 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4ecdc4]/10 border border-[#4ecdc4]/20 text-[#4ecdc4] text-sm font-medium mb-8 animate-fade-in-up">
                        <Zap size={16} />
                        <span>AI-Powered Coding Assistant v1.0</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
                        Navigate Your Path to <br />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-[#4ecdc4] to-[#0075a2]">Coding Mastery</span>
                    </h1>

                    <p className="mt-4 text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                        Unify your profiles from LeetCode, Codeforces, and CodeChef. Get personalized AI recommendations and track your growth in one place.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={() => navigate('/register')}
                            className="px-8 py-4 rounded-xl bg-[#4ecdc4] text-[#0c1618] font-bold text-lg hover:bg-[#4ecdc4]/90 shadow-[0_0_20px_-5px_rgba(78,205,196,0.4)] transition-all hover:scale-105 flex items-center gap-2"
                        >
                            Start Your Journey <ChevronRight size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 rounded-xl border border-gray-700 bg-[#111f22]/50 text-white font-medium text-lg hover:bg-[#111f22] hover:border-[#4ecdc4]/50 transition-all flex items-center gap-2 backdrop-blur-sm"
                        >
                            Existing User? Login
                        </button>
                    </div>
                </div>

                {/* Platform Integration Banner */}
                <div className="py-10 border-y border-gray-800/50 bg-[#111f22]/30 backdrop-blur-sm mb-20">
                    <p className="text-center text-gray-500 text-sm font-medium uppercase tracking-wider mb-6">Seamlessly Integrates With</p>
                    <div className="flex justify-center items-center gap-8 md:gap-16 flex-wrap opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2 text-xl font-bold text-white"><Terminal className="text-yellow-500" /> LeetCode</div>
                        <div className="flex items-center gap-2 text-xl font-bold text-white"><Code className="text-blue-500" /> Codeforces</div>
                        <div className="flex items-center gap-2 text-xl font-bold text-white"><Globe className="text-orange-500" /> CodeChef</div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    <div className="p-8 rounded-2xl bg-[#111f22] border border-gray-800 hover:border-[#4ecdc4]/30 transition-all group">
                        <div className="w-12 h-12 rounded-lg bg-[#4ecdc4]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Target className="text-[#4ecdc4]" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Unified Profile</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Stop switching tabs. View your ratings, submission history, and problem streaks from all major platforms in a single, beautiful dashboard.
                        </p>
                    </div>

                    <div className="p-8 rounded-2xl bg-[#111f22] border border-gray-800 hover:border-[#4ecdc4]/30 transition-all group">
                        <div className="w-12 h-12 rounded-lg bg-[#0075a2]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Brain className="text-[#0075a2]" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">AI Coach</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Get personalized problem recommendations based on your weak areas. Our AI analyzes your solving patterns to suggest the perfect next challenge.
                        </p>
                    </div>

                    <div className="p-8 rounded-2xl bg-[#111f22] border border-gray-800 hover:border-[#4ecdc4]/30 transition-all group">
                        <div className="w-12 h-12 rounded-lg bg-[#e9b44c]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <TrendingUp className="text-[#e9b44c]" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Skill Analytics</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Visualize your progress with detailed heatmaps and skill graphs. Identify if you're weak in DP or Graphs and track your improvement over time.
                        </p>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="relative rounded-3xl overflow-hidden bg-linear-to-r from-[#0075a2] to-[#0c1618] border border-[#4ecdc4]/20 p-12 md:p-20 text-center mb-20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#4ecdc4] rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>

                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 relative z-10">Ready to level up your coding skills?</h2>
                    <p className="text-gray-300 max-w-2xl mx-auto mb-8 text-lg relative z-10">
                        Join thousands of developers who are using Coder's Compass to structure their learning and achieve their dream roles.
                    </p>
                    <button
                        onClick={() => navigate('/register')}
                        className="relative z-10 px-8 py-3 rounded-xl bg-white text-[#0c1618] font-bold hover:bg-gray-100 transition-colors shadow-lg"
                    >
                        Get Started for Free
                    </button>
                </div>

                {/* Footer */}
                <footer className="border-t border-gray-800 py-12 text-center text-gray-500 text-sm">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Shield size={16} />
                        <span>Secure & Open Source</span>
                    </div>
                    <p>&copy; {new Date().getFullYear()} Coder's Compass. Built for developers, by developers.</p>
                </footer>
            </div>
        </div>
    )
}

export default HeroPage
