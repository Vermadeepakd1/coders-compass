import React, { useContext, useEffect, useState, useCallback } from 'react'
import { AuthContext } from '../context/AuthContext'
import { Activity, Zap, Terminal, Code, Hash, TrendingUp, Cpu } from 'lucide-react'
import { getCodeforcesStats, getLeetCodeStats, getRecommendations } from '../services/platformApi';
import ActivityGraph from '../components/ActivityGraph';
import AiCoach from '../components/AiCoach';
import ProblemList from '../components/ProblemList';
import LeetCodeExplorer from '../components/LeetCodeExplorer';

// --- Mock Data ---
const MOCK_STATS = [
    { platform: 'CodeChef', rating: 1600, label: '3 Star', icon: Hash, color: 'text-orange-500' },
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
    const [recommendations, setRecommendations] = useState([]);
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
            const promises = [
                cfHandle ? getCodeforcesStats(cfHandle) : Promise.resolve(null),
                lcHandle ? getLeetCodeStats(lcHandle) : Promise.resolve(null),
                fetchHistory() // Add history to the promise chain
            ];

            // Add recommendations fetch if CF handle exists
            if (cfHandle) {
                promises.push(getRecommendations(cfHandle).catch(err => {
                    console.error("Rec Error:", err);
                    return { recommendations: [] };
                }));
            }

            const results = await Promise.allSettled(promises);

            // Handle Stats Results
            const cfRes = results[0];
            const lcRes = results[1];
            // History is handled inside fetchHistory, but we awaited it here

            // Handle Recommendations Result (index 3 if it exists)
            const recRes = results.length > 3 ? results[3] : null;

            if (cfRes.status === 'fulfilled') setCfData(cfRes.value);
            if (lcRes.status === 'fulfilled') setLcData(lcRes.value);

            if (recRes && recRes.status === 'fulfilled' && recRes.value) {
                setRecommendations(recRes.value.recommendations || []);
            } else {
                setRecommendations([]);
            }

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
        <div className="min-h-screen bg-[#0c1618] pb-12 relative">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">

                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-white">Welcome, {user?.username || 'Developer'}</h1>
                    <button
                        onClick={refreshData}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10 text-sm h-9 ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        <Activity size={16} className={isLoading ? "animate-spin" : ""} />
                        {isLoading ? "Syncing..." : "Refresh Stats"}
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* --- Codeforces Card (Real Data) --- */}
                    {isLoading && !cfData ? (
                        <div className="bg-[#111f22] border border-gray-800/50 rounded-xl p-6 shadow-xl flex items-center justify-center min-h-[140px]">
                            <span className="text-gray-400 animate-pulse">Loading stats...</span>
                        </div>
                    ) : error && !cfData ? (
                        <div className="bg-[#111f22] border border-red-900/30 rounded-xl p-6 shadow-xl flex items-center justify-center min-h-[140px]">
                            <span className="text-red-400">{error}</span>
                        </div>
                    ) : cfData ? (
                        <div className="bg-[#111f22] p-6 rounded-xl shadow-xl border-l-4 border-blue-500 relative overflow-hidden group hover:border-blue-400 transition-colors">
                            <h3 className="text-xl font-bold text-white">Codeforces</h3>
                            <div className="flex items-center mt-4 relative z-10">
                                <img src={cfData.titlePhoto} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-gray-700 object-cover" />
                                <div className="ml-4">
                                    <p className="text-gray-400 text-sm">Rating</p>
                                    <span className={`text-2xl font-bold ${cfData.rating > 1200 ? 'text-green-400' : 'text-gray-400'}`}>{cfData.rating}</span>
                                    <span className="text-sm text-gray-500 ml-2">({cfData.rank})</span>
                                </div>
                            </div>
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
                                <div className="w-16 h-16 rounded-full border-2 border-gray-700 bg-gray-800 flex items-center justify-center text-yellow-500">
                                    <Code size={32} />
                                </div>
                                <div className="ml-4">
                                    <p className="text-gray-400 text-sm">Total Solved</p>
                                    <span className="text-2xl font-bold text-yellow-400">{lcData.totalSolved}</span>
                                    <span className="text-sm text-gray-500 ml-2">(Easy: {lcData.easy}, Med: {lcData.medium}, Hard: {lcData.hard})</span>
                                </div>
                            </div>
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
                        <ProblemList problems={recommendations} />
                    </div>

                    {/* Right Column - LeetCode Explorer */}
                    <div className="space-y-6 h-[600px]">
                        <LeetCodeExplorer />
                    </div>
                </div>

            </main>

            {/* Floating AI Coach - Placed outside the main grid flow */}
            <AiCoach />
        </div>
    )
}

export default Dashboard
