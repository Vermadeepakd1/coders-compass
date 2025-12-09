import React, { useContext, useEffect, useState, useCallback } from 'react'
import { AuthContext } from '../context/AuthContext'
import { Activity, TrendingUp, Terminal, Code, RefreshCw } from 'lucide-react'
import { getCombinedStats, getRecommendations, getRatingHistory } from '../services/platformApi';
import ActivityGraph from '../components/ActivityGraph';
import AiCoach from '../components/AiCoach';
import ProblemList from '../components/ProblemList';
import LeetCodeExplorer from '../components/LeetCodeExplorer';
import SubmissionHeatmap from '../components/SubmissionHeatmap';
import Skeleton from '../components/Skeleton';
import EditProfileModal from '../components/EditProfileModal';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const { user, updateUser } = useContext(AuthContext);

    // State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [combinedData, setCombinedData] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ratingHistory, setRatingHistory] = useState({ codeforces: [], leetcode: [] });

    // Main refresh function
    const refreshData = useCallback(async (cfHandle, lcHandle, isManual = false) => {
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
            if (stats) {
                setCombinedData(stats);
            } else {
                setError("Failed to load combined stats");
            }

            // 2. Fetch Recommendations (if CF handle exists)
            if (cfHandle) {
                const recs = await getRecommendations(cfHandle);
                setRecommendations(recs?.recommendations || null);
            } else {
                setRecommendations([]);
            }

            // 3. Fetch Rating History
            const history = await getRatingHistory(cfHandle, lcHandle);
            setRatingHistory(history);

            if (isManual) {
                toast.success("Stats updated successfully!");
            }

        } catch (error) {
            console.error("failed to load data", error);

            let errorMessage = "Failed to load data";

            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                errorMessage = "External APIs are experiencing high latency. Please try again in a moment.";
                toast.error("Network timeout: External platforms are slow to respond.", {
                    duration: 5000,
                    icon: '⚠️'
                });
            } else {
                if (isManual) {
                    toast.error("Failed to refresh stats");
                }
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const cfHandle = user?.handles?.codeforces;
    const lcHandle = user?.handles?.leetcode;

    // Initial load
    useEffect(() => {
        refreshData(cfHandle, lcHandle, false);
    }, [cfHandle, lcHandle, refreshData]);

    if (error && !combinedData && !isLoading) {
        return (
            <div className="min-h-screen bg-[#0c1618] flex items-center justify-center">
                <div className="text-center p-8 max-w-md bg-[#111f22] rounded-xl border border-gray-800 shadow-2xl">
                    <div className="text-yellow-500 text-5xl mb-4 mx-auto">⚠️</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Connection Issue</h2>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={() => refreshData(cfHandle, lcHandle, true)}
                        className="bg-[#4ecdc4] text-[#0c1618] px-6 py-2 rounded-lg font-bold hover:bg-[#3dbdb4] transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        <RefreshCw size={18} />
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    if (isLoading && !combinedData) {
        return (
            <div className="min-h-screen bg-[#0c1618] pb-12 relative">
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
                    {/* Header Skeleton */}
                    <div className="flex justify-between items-center mb-6">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-10 w-32" />
                    </div>

                    {/* Hero Card Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Skeleton className="h-40 w-full rounded-xl" />
                        <Skeleton className="h-40 w-full rounded-xl" />
                        <Skeleton className="h-40 w-full rounded-xl" />
                    </div>

                    {/* Heatmap Skeleton */}
                    <Skeleton className="h-48 w-full rounded-xl" />

                    {/* Graph Skeleton */}
                    <Skeleton className="h-[300px] w-full rounded-xl" />

                    {/* Grid Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Col */}
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-24 w-full rounded-xl" />
                            <Skeleton className="h-24 w-full rounded-xl" />
                            <Skeleton className="h-24 w-full rounded-xl" />
                        </div>
                        {/* Right Col */}
                        <div className="space-y-6">
                            <Skeleton className="h-[600px] w-full rounded-xl" />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0c1618] pb-12 relative">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">

                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white">Welcome, {user?.username || 'Developer'}</h1>
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="text-gray-500 hover:text-[#4ecdc4] transition-colors p-1 rounded-full hover:bg-[#4ecdc4]/10"
                            title="Edit Handles"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                            </svg>
                        </button>
                    </div>
                    <button
                        onClick={() => refreshData(cfHandle, lcHandle, true)}
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
                        <ProblemList problems={recommendations} cfHandle={user?.handles?.codeforces} />
                    </div>

                    {/* Right Column - LeetCode Explorer */}
                    <div className="space-y-6 h-[600px]">
                        <LeetCodeExplorer />
                    </div>
                </div>

            </main>

            {/* Floating AI Coach - Placed outside the main grid flow */}
            <AiCoach />

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <EditProfileModal
                    user={user}
                    updateUser={updateUser}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}
        </div>
    )
}

export default Dashboard
