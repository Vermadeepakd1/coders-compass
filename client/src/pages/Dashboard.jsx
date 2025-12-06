import React, { useContext, useEffect, useState, useCallback } from 'react'
import { AuthContext } from '../context/AuthContext'
import { Activity, TrendingUp, Terminal, Code } from 'lucide-react'
import { getCombinedStats, getRecommendations, getRatingHistory } from '../services/platformApi';
import ActivityGraph from '../components/ActivityGraph';
import AiCoach from '../components/AiCoach';
import ProblemList from '../components/ProblemList';
import LeetCodeExplorer from '../components/LeetCodeExplorer';
import SubmissionHeatmap from '../components/SubmissionHeatmap';

const Dashboard = () => {
    const { user } = useContext(AuthContext);

    // State
    const [combinedData, setCombinedData] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ratingHistory, setRatingHistory] = useState({ codeforces: [], leetcode: [] });

    // Main refresh function
    const refreshData = useCallback(async () => {
        const cfHandle = user?.handles?.codeforces;
        const lcHandle = user?.handles?.leetcode;

        if (!cfHandle && !lcHandle) {
            setIsLoading(false);
            setError("Link your account");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Fetch Combined Stats
            const stats = await getCombinedStats(cfHandle, lcHandle);
            setCombinedData(stats);

            // 2. Fetch Recommendations (if CF handle exists)
            if (cfHandle) {
                const recs = await getRecommendations(cfHandle);
                setRecommendations(recs.recommendations || []);
            }

            // 3. Fetch Rating History
            const history = await getRatingHistory(cfHandle, lcHandle);
            setRatingHistory(history);

        } catch (error) {
            console.log("failed to load data", error);
            setError("Failed to load some data");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

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

                {/* --- STATS GRID (Replaces Hero Section) --- */}
                {combinedData && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* 1. TOTAL SOLVED CARD */}
                        <div className="bg-[#111f22] border border-gray-800/50 rounded-xl p-6 shadow-xl relative overflow-hidden group hover:border-[#4ecdc4]/50 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                <Activity size={100} className="text-white" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-gray-400 font-medium mb-2">Total Problems Solved</h3>
                                <div className="text-5xl font-extrabold text-white mb-4 tracking-tight">
                                    {combinedData.totalSolved}
                                </div>
                                <div className="flex flex-col gap-2 text-sm">
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span className="text-gray-300">CF: <span className="font-bold text-white">{combinedData.codeforces.solved}</span></span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                        <span className="text-gray-300">LC: <span className="font-bold text-white">{combinedData.leetcode.solved}</span></span>
                                        <span className="text-xs text-gray-500 ml-2 flex gap-1 bg-black/20 px-2 py-0.5 rounded border border-gray-800">
                                            <span className="text-green-400">{combinedData.leetcode.easy} E</span>
                                            <span className="text-yellow-400">{combinedData.leetcode.medium} M</span>
                                            <span className="text-red-400">{combinedData.leetcode.hard} H</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. CODEFORCES CARD */}
                        <div className="bg-[#111f22] border border-gray-800/50 rounded-xl p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                <Terminal size={100} className="text-white" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    {combinedData.codeforces.titlePhoto ? (
                                        <img src={combinedData.codeforces.titlePhoto} alt="CF" className="w-10 h-10 rounded-full border border-gray-700" />
                                    ) : (
                                        <Terminal className="text-blue-500" size={32} />
                                    )}
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Codeforces</h3>
                                        <p className="text-xs text-gray-500 uppercase">{combinedData.codeforces.rank || 'Unrated'}</p>
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <p className="text-gray-400 text-sm mb-1">Current Rating</p>
                                    <div className={`text-4xl font-bold ${combinedData.codeforces.rating >= 1200 ? 'text-green-400' : 'text-gray-300'}`}>
                                        {combinedData.codeforces.rating !== "N/A" ? combinedData.codeforces.rating : "Unrated"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. LEETCODE CARD */}
                        <div className="bg-[#111f22] border border-gray-800/50 rounded-xl p-6 shadow-xl relative overflow-hidden group hover:border-yellow-500/50 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                <Code size={100} className="text-white" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-yellow-500 border border-gray-700">
                                        <Code size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">LeetCode</h3>
                                        <p className="text-xs text-gray-500 uppercase">Global Ranking: Hidden</p>
                                    </div>
                                </div>

                                {combinedData.leetcode.rating !== "N/A" ? (
                                    <div className="mt-2">
                                        <p className="text-gray-400 text-sm mb-1">Contest Rating</p>
                                        <div className="text-4xl font-bold text-yellow-400">
                                            {combinedData.leetcode.rating}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-2">
                                        <p className="text-gray-400 text-sm mb-2">Problems Breakdown</p>
                                        <div className="flex gap-3 text-xs">
                                            <div className="text-center">
                                                <div className="text-green-400 font-bold text-lg">{combinedData.leetcode.easy}</div>
                                                <div className="text-gray-500">Easy</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-yellow-400 font-bold text-lg">{combinedData.leetcode.medium}</div>
                                                <div className="text-gray-500">Med</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-red-400 font-bold text-lg">{combinedData.leetcode.hard}</div>
                                                <div className="text-gray-500">Hard</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State for Hero Card */}
                {isLoading && !combinedData && (
                    <div className="bg-[#111f22] border border-gray-800/50 rounded-xl p-8 shadow-xl flex items-center justify-center min-h-[200px]">
                        <span className="text-gray-400 animate-pulse">Loading combined stats...</span>
                    </div>
                )}

                {/* Error State */}
                {!isLoading && error && !combinedData && (
                    <div className="bg-[#111f22] border border-red-900/30 rounded-xl p-8 shadow-xl flex items-center justify-center min-h-[200px]">
                        <span className="text-red-400">{error}</span>
                    </div>
                )}


                {/* Heatmap Section */}
                {combinedData && combinedData.heatmap && (
                    <SubmissionHeatmap data={combinedData.heatmap} />
                )}

                {/* Render Activity Graph section  */}
                <div className="bg-[#111f22] border border-gray-800/50 rounded-xl p-6 shadow-xl backdrop-blur-sm w-full">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-[#4ecdc4]" />
                        Rating History
                    </h3>
                    {(ratingHistory.codeforces.length > 0 || ratingHistory.leetcode.length > 0) ? (
                        <div className={`grid grid-cols-1 ${ratingHistory.leetcode.length > 0 ? 'md:grid-cols-2' : ''} gap-6`}>
                            {ratingHistory.codeforces.length > 0 && (
                                <ActivityGraph
                                    data={ratingHistory.codeforces}
                                    platform="rating"
                                    color="#4ecdc4"
                                    title="Codeforces"
                                />
                            )}
                            {ratingHistory.leetcode.length > 0 && (
                                <ActivityGraph
                                    data={ratingHistory.leetcode}
                                    platform="rating"
                                    color="#ffa116"
                                    title="LeetCode"
                                />
                            )}
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                            <Activity size={48} className="mb-2 opacity-20" />
                            <p>No history data available yet.</p>
                            <p className="text-xs mt-1">Participate in contests to build your graph!</p>
                        </div>
                    )}
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
