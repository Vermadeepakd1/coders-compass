import React, { useContext, useEffect, useState, useCallback } from 'react'
import { AuthContext } from '../context/AuthContext'
import { Activity, Zap, Terminal, Code, Hash, TrendingUp, Cpu } from 'lucide-react'
import { getCodeforcesStats, getLeetCodeStats } from '../services/platformApi';
import ActivityGraph from '../components/ActivityGraph';


// --- Mock Data ---
const MOCK_STATS = [
    { platform: 'CodeChef', rating: 1600, label: '3 Star', icon: Hash, color: 'text-orange-500' },
];

const MOCK_RECOMMENDATIONS = [
    { id: 1, title: 'Longest Palindromic Substring', difficulty: 'Medium', tag: 'DP', time: '15 min' },
    { id: 2, title: 'Alien Dictionary', difficulty: 'Hard', tag: 'Graph', time: '45 min' },
    { id: 3, title: 'K-th Smallest Element in BST', difficulty: 'Medium', tag: 'Trees', time: '20 min' },
    { id: 4, title: 'Median of Two Sorted Arrays', difficulty: 'Hard', tag: 'Binary Search', time: '60 min' },
];

const MOCK_SKILLS = [
    { name: 'Dynamic Programming', score: 45, status: 'Weak' },
    { name: 'Graph Theory', score: 85, status: 'Strong' },
    { name: 'Greedy Algorithms', score: 60, status: 'Average' },
    { name: 'Bit Manipulation', score: 30, status: 'Critical' },
];

const Heatmap = () => {
    // Generate random activity data
    const weeks = 20;
    const days = 7;

    return (
        <div className="w-full overflow-hidden">
            <div className="flex gap-1">
                {Array.from({ length: weeks }).map((_, wIndex) => (
                    <div key={wIndex} className="flex flex-col gap-1">
                        {Array.from({ length: days }).map((_, dIndex) => {
                            // Random intensity: 0 to 4
                            const intensity = Math.random() > 0.7 ? Math.floor(Math.random() * 4) + 1 : 0;
                            const colors = [
                                'bg-gray-800/50', // 0
                                'bg-[#0075a2]/40', // 1
                                'bg-[#0075a2]/70', // 2
                                'bg-[#4ecdc4]/60', // 3
                                'bg-[#4ecdc4]',    // 4
                            ];
                            return (
                                <div
                                    key={dIndex}
                                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-sm ${colors[intensity]} transition-colors duration-500 hover:scale-125 cursor-pointer`}
                                    title={`${intensity} solves`}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [cfData, setCfData] = useState(null);
    const [lcData, setLcData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);

    const { user } = useContext(AuthContext);

    // Helper to fetch history
    const fetchHistory = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/platforms/history`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            const result = await response.json();
            if (result.data && Array.isArray(result.data)) {
                setHistory(result.data);
            } else {
                setHistory([]);
            }
        } catch (error) {
            console.error("error in getting history", error);
            setHistory([]);
        }
    }, []);

    // Main refresh function
    const refreshData = useCallback(async () => {
        const cfHandle = user?.handles?.codeforces;
        const lcHandle = user?.handles?.leetcode;

        // check if user exists and has handle
        if (!cfHandle && !lcHandle) {
            setIsLoading(false);
            setError("Link your account");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Run all fetches in parallel
            const [cfRes, lcRes] = await Promise.allSettled([
                cfHandle ? getCodeforcesStats(cfHandle) : Promise.resolve(null),
                lcHandle ? getLeetCodeStats(lcHandle) : Promise.resolve(null),
                fetchHistory() // Add history to the promise chain
            ]);

            if (cfRes.status === 'fulfilled') setCfData(cfRes.value);
            if (lcRes.status === 'fulfilled') setLcData(lcRes.value);

        } catch (error) {
            console.log("failed to load data", error);
            setError("Failed to load some data");
        } finally {
            setIsLoading(false);
        }
    }, [user, fetchHistory]);

    // Initial load
    useEffect(() => {
        if (user) {
            refreshData();
        }
    }, [user, refreshData]);


    return (
        <div className="min-h-screen bg-[#0c1618] pb-12">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">

                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Welcome back, {user?.username || 'Developer'}</h2>
                        <p className="text-gray-400 mt-1">Track your progress across all platforms.</p>
                    </div>
                    <div className="flex gap-2">
                        {/* Sync Stats Button */}
                        <button
                            onClick={refreshData}
                            disabled={isLoading}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10 text-sm h-9 ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            <Activity size={16} className={isLoading ? "animate-spin" : ""} />
                            {isLoading ? "Syncing..." : "Sync Stats"}
                        </button>

                        <button className="px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-[#4ecdc4] text-[#0c1618] hover:opacity-90 shadow-[0_0_15px_-3px_rgba(78,205,196,0.3)] text-sm h-9">
                            <Zap size={16} /> Daily Challenge
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* --- Codeforces Card (Real Data) --- */}
                    {isLoading && !cfData ? (
                        <div className="bg-[#111f22] border border-gray-800/50 rounded-xl p-6 shadow-xl flex items-center justify-center min-h-[140px]">
                            <span className="text-gray-400 animate-pulse">Loading stats...</span>
                        </div>
                    ) : error ? (
                        <div className="bg-[#111f22] border border-red-900/30 rounded-xl p-6 shadow-xl flex items-center justify-center min-h-[140px]">
                            <span className="text-red-400">{error}</span>
                        </div>
                    ) : cfData ? (
                        <div className="bg-[#111f22] p-6 rounded-xl shadow-xl border-l-4 border-blue-500 relative overflow-hidden group hover:border-blue-400 transition-colors">
                            <h3 className="text-xl font-bold text-white">Codeforces</h3>

                            <div className="flex items-center mt-4 relative z-10">
                                {/* Avatar Image */}
                                <img
                                    src={cfData.titlePhoto}
                                    alt="Avatar"
                                    className="w-16 h-16 rounded-full border-2 border-gray-700 object-cover"
                                />

                                <div className="ml-4">
                                    <p className="text-gray-400 text-sm">Rating</p>
                                    {/* Dynamic Color: Green if > 1200, else gray */}
                                    <span className={`text-2xl font-bold ${cfData.rating > 1200 ? 'text-green-400' : 'text-gray-400'}`}>
                                        {cfData.rating}
                                    </span>
                                    <span className="text-sm text-gray-500 ml-2">({cfData.rank})</span>
                                </div>
                            </div>

                            {/* Decorative Icon */}
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                <Terminal size={100} className="text-white" />
                            </div>
                        </div>
                    ) : null}

                    {/* --- LeetCode Card (Real Data) --- */}
                    {lcData ? (
                        <div className="bg-[#111f22] p-6 rounded-xl shadow-xl border-l-4 border-yellow-500 relative overflow-hidden group hover:border-yellow-400 transition-colors">
                            <h3 className="text-xl font-bold text-white">LeetCode</h3>

                            <div className="flex items-center mt-4 relative z-10">
                                {/* Avatar Image (LeetCode doesn't always give avatar, use fallback or icon) */}
                                <div className="w-16 h-16 rounded-full border-2 border-gray-700 bg-gray-800 flex items-center justify-center text-yellow-500">
                                    <Code size={32} />
                                </div>

                                <div className="ml-4">
                                    <p className="text-gray-400 text-sm">Total Solved</p>
                                    <span className="text-2xl font-bold text-yellow-400">
                                        {lcData.totalSolved}
                                    </span>
                                    <span className="text-sm text-gray-500 ml-2">
                                        (Easy: {lcData.easy}, Med: {lcData.medium}, Hard: {lcData.hard})
                                    </span>
                                </div>
                            </div>

                            {/* Decorative Icon */}
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                <Code size={100} className="text-white" />
                            </div>
                        </div>
                    ) : null}


                    {/* other platforms mock data */}
                    {MOCK_STATS.map((stat) => (
                        <div key={stat.platform} className="bg-[#111f22] border border-gray-800/50 rounded-xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden group hover:border-[#4ecdc4]/50 transition-colors">
                            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500`}>
                                <stat.icon size={100} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <stat.icon className={stat.color} size={20} />
                                    <span className="text-gray-400 font-medium">{stat.platform}</span>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">{stat.rating}</div>
                                <div className={`text-sm ${stat.color} font-mono`}>{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Render Activity Graph section  */}
                <div className="bg-[#111f22] border border-gray-800/50 rounded-xl p-6 shadow-xl backdrop-blur-sm w-full">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-[#4ecdc4]" />
                        Rating History
                    </h3>
                    {history.length > 0 ? (
                        <ActivityGraph data={history} />
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                            <Activity size={48} className="mb-2 opacity-20" />
                            <p>No history data available yet.</p>
                            <p className="text-xs mt-1">Solve problems to build your graph!</p>
                        </div>
                    )}
                </div>

                {/* Heatmap Section */}
                <div className="bg-[#111f22] border border-gray-800/50 rounded-xl p-6 shadow-xl backdrop-blur-sm flex flex-col gap-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <TrendingUp size={18} className="text-[#4ecdc4]" />
                            Consistency Graph
                        </h3>
                        <div className="flex gap-2 text-xs text-gray-500">
                            <span>Less</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 bg-gray-800/50 rounded-sm"></div>
                                <div className="w-3 h-3 bg-[#0075a2]/40 rounded-sm"></div>
                                <div className="w-3 h-3 bg-[#4ecdc4] rounded-sm"></div>
                            </div>
                            <span>More</span>
                        </div>
                    </div>
                    <Heatmap />
                </div>

                {/* Main Content Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Recommendations (Left - 2 Cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">AI Recommended Problems</h3>
                            <button className="text-[#4ecdc4] text-sm hover:underline">View All</button>
                        </div>

                        <div className="space-y-4">
                            {MOCK_RECOMMENDATIONS.map((prob) => (
                                <div
                                    key={prob.id}
                                    className={`group flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-[#111f22] hover:bg-[#16292d] hover:border-[#4ecdc4]/30 transition-all duration-300`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${prob.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400' :
                                            prob.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                                'bg-red-500/10 text-red-400'
                                            }`}>
                                            <Code size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-200 group-hover:text-[#4ecdc4] transition-colors">{prob.title}</h4>
                                            <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                                <span className={`px-1.5 py-0.5 rounded ${prob.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                                                    }`}>{prob.difficulty}</span>
                                                <span className="flex items-center gap-1"><Hash size={12} /> {prob.tag}</span>
                                                <span className="flex items-center gap-1"><Activity size={12} /> ~{prob.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-white hover:bg-white/5 border border-gray-700 group-hover:bg-[#4ecdc4] group-hover:text-black group-hover:border-transparent px-4 py-2 rounded-lg font-medium transition-all duration-200">
                                        Solve
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weak Areas / Skills (Right - 1 Col) */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-white">Skill Analysis</h3>
                        <div className="bg-[#111f22] border border-gray-800/50 rounded-xl p-6 shadow-xl backdrop-blur-sm h-full">
                            <div className="space-y-6">
                                {MOCK_SKILLS.map((skill) => (
                                    <div key={skill.name}>
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-sm font-medium text-gray-300">{skill.name}</span>
                                            <span className={`text-xs font-bold ${skill.status === 'Strong' ? 'text-green-400' :
                                                skill.status === 'Weak' ? 'text-yellow-400' :
                                                    skill.status === 'Critical' ? 'text-red-400' : 'text-blue-400'
                                                }`}>{skill.status}</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${skill.status === 'Strong' ? 'bg-green-500' :
                                                    skill.status === 'Weak' ? 'bg-yellow-500' :
                                                        skill.status === 'Critical' ? 'bg-red-500' : 'bg-blue-500'
                                                    }`}
                                                style={{ width: `${skill.score}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-800">
                                <div className="bg-[#4ecdc4]/10 rounded-lg p-4 border border-[#4ecdc4]/20">
                                    <div className="flex items-start gap-3">
                                        <Zap className="text-[#4ecdc4] shrink-0 mt-1" size={18} />
                                        <div>
                                            <h5 className="text-sm font-bold text-[#4ecdc4] mb-1">Focus Area</h5>
                                            <p className="text-xs text-gray-400 leading-relaxed">
                                                Your Graph Theory solves have dropped this week. Try solving 2 Graph Hard problems to maintain your streak.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}

export default Dashboard
