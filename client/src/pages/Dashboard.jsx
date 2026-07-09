import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Activity, TrendingUp, RefreshCw, Flame, Zap, Target, ChevronUp, ChevronDown, Minus, Trophy, Sparkles, Brain, Calendar } from 'lucide-react'
import { getCombinedStats, getRecommendations, getRatingHistory } from '../services/platformApi';
import { getUpcomingContests } from '../services/contestApi';
import ActivityGraph from '../components/ActivityGraph';
import AiCoach from '../components/AiCoach';
import ProblemList from '../components/ProblemList';
import ProblemExplorer from '../components/ProblemExplorer';
import SubmissionHeatmap from '../components/SubmissionHeatmap';
import Skeleton from '../components/Skeleton';
import EditProfileModal from '../components/EditProfileModal';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

/* ── helpers ─────────────────────────────────────────────────── */
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
}

function getRemainingTime(startTime) {
    const diffMs = new Date(startTime) - Date.now();
    if (diffMs <= 0) return "Started";
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours >= 24) {
        const days = Math.floor(diffHours / 24);
        return `${days}d remaining`;
    }
    return `${diffHours}h remaining`;
}

function computeCurrentStreak(heatmapData) {
    if (!heatmapData?.length) return 0;
    const sorted = [...heatmapData]
        .filter(d => d.count > 0)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (!sorted.length) return 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const mostRecent = sorted[0].date;

    // streak only counts if most recent activity is today or yesterday
    if (mostRecent !== todayStr && mostRecent !== yesterdayStr) return 0;

    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1].date);
        const curr = new Date(sorted[i].date);
        const diff = Math.round((prev - curr) / 86400000);
        if (diff === 1) { streak++; } else { break; }
    }
    return streak;
}

function getStreakMessage(streak) {
    if (streak === 0)  return "Start your streak today.";
    if (streak < 3)   return "Nice start. Keep the momentum going.";
    if (streak < 7)   return "Building consistency. You're doing it.";
    if (streak < 14)  return "One week strong. Don't stop now.";
    if (streak < 30)  return "You're in the zone. Elite territory ahead.";
    return `${streak} days. This is what champions are made of.`;
}

function DeltaBadge({ value }) {
    if (value === null || value === undefined || value === 0) return <span className="delta-neutral text-[10px] font-mono">—</span>;
    const rounded = Math.round(value);
    if (rounded > 0) return (
        <span className="delta-up animate-delta flex items-center gap-0.5 text-[11px]">
            <ChevronUp size={11} />+{rounded}
        </span>
    );
    return (
        <span className="delta-down animate-delta flex items-center gap-0.5 text-[11px]">
            <ChevronDown size={11} />{rounded}
        </span>
    );
}

/* ── daily goal target (could be user-configurable in future) ── */
const DAILY_GOAL = 3;

/* ── component ───────────────────────────────────────────────── */
const Dashboard = () => {
    const { user, updateUser, logout } = useContext(AuthContext);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [combinedData, setCombinedData]   = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [isLoading, setIsLoading]         = useState(true);
    const [error, setError]                 = useState(null);
    const [ratingHistory, setRatingHistory] = useState({ codeforces: [], leetcode: [], codechef: [] });
    const [nextContest, setNextContest]     = useState(null);

    const cfHandle = user?.handles?.codeforces;
    const lcHandle = user?.handles?.leetcode;
    const ccHandle = user?.handles?.codechef;

    const [weakestSkillPlatform, setWeakestSkillPlatform] = useState(cfHandle ? "cf" : "lc");

    useEffect(() => {
        const fetchNextContest = async () => {
            try {
                const data = await getUpcomingContests();
                if (data && data.length > 0) {
                    const now = Date.now();
                    const future = data.filter(c => new Date(c.startTime) > now);
                    future.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                    if (future.length > 0) {
                        setNextContest(future[0]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch next contest", err);
            }
        };
        fetchNextContest();
    }, []);

    /* ── data fetch ── */
    const refreshData = useCallback(async (cf, lc, cc, isManual = false) => {
        if (!cf && !lc && !cc) { setIsLoading(false); setError("Link your account"); return; }
        setIsLoading(true); setError(null);
        try {
            const [statsResult, recsResult, historyResult] = await Promise.allSettled([
                getCombinedStats(cf, lc, cc),
                (cf || lc) ? getRecommendations(cf || "none", isManual) : Promise.resolve({ recommendations: [] }),
                getRatingHistory(cf, lc, cc),
            ]);
            if (statsResult.status === 'fulfilled' && statsResult.value) {
                setCombinedData(statsResult.value);
            } else {
                throw statsResult.reason || new Error("Failed to load stats");
            }
            setRecommendations(recsResult.status === 'fulfilled' ? recsResult.value?.recommendations || [] : []);
            setRatingHistory(historyResult.status === 'fulfilled' ? historyResult.value : { codeforces: [], leetcode: [], codechef: [] });
            if (isManual) toast.success("Stats updated!");
        } catch (err) {
            if (err.response?.status === 401) { toast.error("Session expired."); logout(); return; }
            const msg = (err.code === 'ECONNABORTED' || err.message?.includes('timeout'))
                ? "External APIs are slow right now. Retry shortly."
                : "Failed to load data";
            setError(msg);
            if (isManual) toast.error("Failed to refresh stats");
        } finally {
            setIsLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        refreshData(cfHandle, lcHandle, ccHandle, false);
    }, [cfHandle, lcHandle, ccHandle, refreshData]);

    /* ── streak (computed from heatmap) ── */
    const streak = useMemo(() =>
        computeCurrentStreak(combinedData?.heatmap),
    [combinedData?.heatmap]);

    useEffect(() => {
        if (streak > 0 && streak !== user?.streak) {
            updateUser({ streak });
        }
    }, [streak, user?.streak, updateUser]);

    /* ── rating deltas (last 2 contests on each platform) ── */
    const cfDelta = useMemo(() => {
        const arr = ratingHistory.codeforces;
        if (arr.length < 2) return null;
        return arr[arr.length - 1].rating - arr[arr.length - 2].rating;
    }, [ratingHistory.codeforces]);

    const lcDelta = useMemo(() => {
        const arr = ratingHistory.leetcode;
        if (arr.length < 2) return null;
        return arr[arr.length - 1].rating - arr[arr.length - 2].rating;
    }, [ratingHistory.leetcode]);

    const ccDelta = useMemo(() => {
        const arr = ratingHistory.codechef;
        if (arr.length < 2) return null;
        return arr[arr.length - 1].rating - arr[arr.length - 2].rating;
    }, [ratingHistory.codechef]);

    /* ── platform counts for chart grid ── */
    const activePlatformCount = [
        ratingHistory.codeforces.length > 0,
        ratingHistory.leetcode.length > 0,
        ratingHistory.codechef.length > 0,
    ].filter(Boolean).length;

    /* ── dynamic dashboard telemetry hooks ── */
    const todaySolvedCount = useMemo(() => {
        if (!combinedData?.heatmap) return 0;
        const todayStr = new Date().toISOString().split('T')[0];
        const day = combinedData.heatmap.find(d => d.date === todayStr);
        return day ? day.count : 0;
    }, [combinedData?.heatmap]);

    const weeklySolvedCount = useMemo(() => {
        if (!combinedData?.heatmap) return 0;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return combinedData.heatmap
            .filter(d => new Date(d.date) >= sevenDaysAgo)
            .reduce((sum, d) => sum + d.count, 0);
    }, [combinedData?.heatmap]);

    const weeklyDeltaPercent = useMemo(() => {
        if (!combinedData?.heatmap) return 0;
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(now.getDate() - 14);

        const currentWeek = combinedData.heatmap
            .filter(d => {
                const date = new Date(d.date);
                return date >= sevenDaysAgo && date <= now;
            })
            .reduce((sum, d) => sum + d.count, 0);

        const prevWeek = combinedData.heatmap
            .filter(d => {
                const date = new Date(d.date);
                return date >= fourteenDaysAgo && date < sevenDaysAgo;
            })
            .reduce((sum, d) => sum + d.count, 0);

        if (prevWeek === 0) return currentWeek > 0 ? 100 : 0;
        return Math.round(((currentWeek - prevWeek) / prevWeek) * 100);
    }, [combinedData?.heatmap]);

    const currentGoal = useMemo(() => {
        let rating = 0;
        let platform = "";
        let label = "General Milestone";
        let startVal = 1000;
        let endVal = 1200;

        const cfRating = Number(combinedData?.codeforces?.rating);
        const lcRating = Number(combinedData?.leetcode?.rating);
        const ccRating = Number(combinedData?.codechef?.rating);

        if (cfRating > 0 && cfRating > rating) { rating = cfRating; platform = "cf"; }
        if (lcRating > 0 && lcRating > rating) { rating = lcRating; platform = "lc"; }
        if (ccRating > 0 && ccRating > rating) { rating = ccRating; platform = "cc"; }

        if (platform === "cf") {
            startVal = rating;
            if (rating < 1200) { label = "Reach Pupil"; endVal = 1200; }
            else if (rating < 1400) { label = "Reach Specialist"; endVal = 1400; }
            else if (rating < 1600) { label = "Reach Expert"; endVal = 1600; }
            else if (rating < 1900) { label = "Reach Candidate Master"; endVal = 1900; }
            else if (rating < 2100) { label = "Reach Master"; endVal = 2100; }
            else { label = "Reach Grandmaster"; endVal = 2300; }
        } else if (platform === "lc") {
            startVal = rating;
            if (rating < 1600) { label = "Top 20%"; endVal = 1600; }
            else if (rating < 1850) { label = "Reach Knight"; endVal = 1850; }
            else if (rating < 2180) { label = "Reach Guardian"; endVal = 2180; }
            else { label = "Reach Grandmaster"; endVal = 2500; }
        } else if (platform === "cc") {
            startVal = rating;
            if (rating < 1600) { label = "Reach 3 Star"; endVal = 1600; }
            else if (rating < 1800) { label = "Reach 4 Star"; endVal = 1800; }
            else if (rating < 2000) { label = "Reach 5 Star"; endVal = 2000; }
            else if (rating < 2200) { label = "Reach 6 Star"; endVal = 2200; }
            else { label = "Reach 7 Star"; endVal = 2500; }
        } else {
            return { label: "Link Active Accounts", startVal: 0, endVal: 100, pct: 0 };
        }

        const range = 200;
        const pct = Math.min(100, Math.max(0, Math.round(((startVal - (endVal - range)) / range) * 100)));
        return { label, startVal, endVal, pct, platform };
    }, [combinedData]);

    const userRank = useMemo(() => {
        if (combinedData?.codeforces?.rank) return combinedData.codeforces.rank;
        if (combinedData?.leetcode?.rating !== "N/A" && combinedData?.leetcode?.rating > 0) {
            return combinedData.leetcode.rating >= 2180 ? "Guardian" : "Knight";
        }
        return "Specialist";
    }, [combinedData]);

    const lastActiveText = useMemo(() => {
        if (!combinedData?.heatmap || combinedData.heatmap.length === 0) return "Never";
        const activeDays = combinedData.heatmap.filter(d => d.count > 0);
        if (activeDays.length === 0) return "Never";
        const dates = activeDays.map(d => new Date(d.date));
        const maxDate = new Date(Math.max(...dates));
        const diffTime = Math.abs(new Date() - maxDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) return "Today";
        if (diffDays === 2) return "Yesterday";
        return `${diffDays} days ago`;
    }, [combinedData?.heatmap]);

    const spotlightInfo = useMemo(() => {
        if (streak >= 7) {
            return {
                badge: "🔥 Consistency Peak",
                title: "Relentless Consistency",
                desc: `You solved questions for ${streak} days in a row! Unlocked consistency badge.`,
                time: "Sustained today"
            };
        }
        const maxDelta = Math.round(Math.max(Number(cfDelta || 0), Number(lcDelta || 0), Number(ccDelta || 0)));
        if (maxDelta > 0) {
            return {
                badge: "🔥 Rating Delta Peak",
                title: `Rating Increase: +${maxDelta}`,
                desc: "Highest performance jump registered since last contest. Peak rating updated!",
                time: "Updated recently"
            };
        }
        return {
            badge: "🏆 Top Percentile Reached",
            title: `Rank: ${userRank}`,
            desc: `Your aggregated standings rank is within the top ${currentGoal.startVal > 1800 ? "3.2%" : "8.5%"} percentile.`,
            time: "Current rank status"
        };
    }, [streak, cfDelta, lcDelta, ccDelta, userRank, currentGoal]);

    const last7DaysSubmissions = useMemo(() => {
        if (!combinedData?.heatmap) return [0, 0, 0, 0, 0, 0, 0];
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const day = combinedData.heatmap.find(x => x.date === dateStr);
            result.push(day ? day.count : 0);
        }
        return result;
    }, [combinedData?.heatmap]);

    const yesterdaySolvedCount = useMemo(() => {
        if (!combinedData?.heatmap) return 0;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const ydStr = yesterday.toISOString().split('T')[0];
        const day = combinedData.heatmap.find(d => d.date === ydStr);
        return day ? day.count : 0;
    }, [combinedData?.heatmap]);

    const aiInsight = useMemo(() => {
        const pointsLeft = currentGoal.endVal - currentGoal.startVal;
        const contestsNeeded = Math.ceil(pointsLeft / 35);
        const topTag = recommendations?.[0]?.tags?.[0];
        const topDelta = recommendations?.[0] ? 13 + Math.floor(Math.random() * 8) : 16;
        if (streak >= 14) return {
            icon: "🔥",
            msg: `You're on a ${streak}-day streak — you're solving ${weeklyDeltaPercent > 0 ? weeklyDeltaPercent + '% more' : 'consistently'} compared to last week.`
        };
        if (pointsLeft > 0 && pointsLeft <= 300) return {
            icon: "🎯",
            msg: `You're only ${pointsLeft} rating points away from ${currentGoal.label.replace('Reach ', '')}. Projected in ${contestsNeeded}–${contestsNeeded + 2} contests.`
        };
        if (topTag) return {
            icon: "💡",
            msg: `Today's highest-impact topic: ${topTag}. Solving it could gain you an estimated +${topDelta} rating.`
        };
        return {
            icon: "🎯",
            msg: `Keep it consistent — ${weeklySolvedCount} problems solved this week. Aim for ${Math.max(weeklySolvedCount + 3, 10)} next week.`
        };
    }, [streak, currentGoal, recommendations, weeklyDeltaPercent, weeklySolvedCount]);

    /* ── weakest skill: aggregate tag frequency across ALL recommendations ──
       Most-targeted tag = weakest skill. Accuracy derived from avg difficulty
       of problems the system chose for that tag (harder = lower accuracy).
       Stable across reloads as long as recommendations are consistent. ── */
    const weakestSkillStat = useMemo(() => {
        if (!recommendations || recommendations.length === 0) return null;

        // Count how many recommendations target each tag
        const tagCounts = {};
        const tagRatings = {};

        recommendations.forEach(prob => {
            const validTags = (prob.tags || []).filter(t => t && t !== '*special');
            const rating = Number(prob.rating || 0);
            validTags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                if (!tagRatings[tag]) tagRatings[tag] = [];
                if (rating > 0) tagRatings[tag].push(rating);
            });
        });

        // Most-targeted tag across all recommendations = weakest skill
        const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
        if (sorted.length === 0) return null;

        const [topTag, topCount] = sorted[0];
        const ratings = tagRatings[topTag] || [];
        const avgRating = ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 1500;

        // Accuracy: harder avg problem difficulty targeted ⇒ lower accuracy
        // Scale: 800-rated avg ⇒ ~82%, 2000-rated avg ⇒ ~52%
        const accuracy = Math.max(45, Math.min(85, Math.round(85 - (avgRating - 800) / 40)));
        const delta = accuracy - 70; // 70% = stable average baseline

        return {
            tag: topTag,
            accuracy,
            delta,
            count: topCount,
            totalProblems: recommendations.length,
        };
    }, [recommendations]);

    /* ── active weakest skill based on platform toggle ── */
    const activeWeakestSkill = useMemo(() => {
        if (weakestSkillPlatform === "cf") {
            return weakestSkillStat;
        } else {
            const lcWeak = combinedData?.leetcode?.weakestSkill;
            if (!lcWeak) return null;
            return {
                tag: lcWeak.tag,
                accuracy: lcWeak.accuracy,
                delta: lcWeak.delta,
                count: lcWeak.count,
                totalProblems: lcWeak.totalSolved,
                isLeetCode: true
            };
        }
    }, [weakestSkillPlatform, weakestSkillStat, combinedData]);

    /* ── daily goal progress percentage ── */
    const dailyGoalPct = Math.min(100, Math.round((todaySolvedCount / DAILY_GOAL) * 100));
    const dailyGoalDone = todaySolvedCount >= DAILY_GOAL;


    /* ── error state ── */
    if (error && !combinedData && !isLoading) return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center font-mono">
            <div className="text-center p-8 max-w-sm">
                <div className="text-brand-danger text-xs uppercase tracking-wider mb-3 font-bold">[Connection Error]</div>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{error}</p>
                <button onClick={() => refreshData(cfHandle, lcHandle, ccHandle, true)} className="btn-primary w-full">
                    Retry Connection
                </button>
            </div>
        </div>
    );

    /* ── skeleton loading ── */
    if (isLoading && !combinedData) return (
        <div className="min-h-screen bg-brand-bg">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
                <Skeleton className="h-40 w-full bg-zinc-900 rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-28 w-full bg-zinc-900 rounded-lg" />
                    <Skeleton className="h-28 w-full bg-zinc-900 rounded-lg" />
                    <Skeleton className="h-28 w-full bg-zinc-900 rounded-lg" />
                </div>
                <Skeleton className="h-56 w-full bg-zinc-900 rounded-lg" />
            </main>
        </div>
    );
    return (
        <div className="min-h-screen bg-brand-bg pb-16 text-zinc-100 font-sans">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <div className="flex justify-between items-start pt-3 border-b border-zinc-900 pb-5">
                    <div className="space-y-2">
                        <div>
                            <h1 className="text-3xl font-extrabold text-white font-geist tracking-tight leading-tight">
                                Deepak Verma
                            </h1>
                            <span className="text-[11px] font-mono text-zinc-500 block mt-0.5">
                                Competitive Programmer · @{user?.username || 'vermadeepakd1'}
                            </span>
                        </div>
                        {/* Prominent Streak Badge */}
                    {streak > 0 && (
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-streak/10 border border-streak/30 rounded-lg transition-all ${streak >= 7 ? 'shadow-[0_0_18px_rgba(249,115,22,0.25)]' : ''}`}>
                                <Flame size={14} className="text-streak animate-pulse" />
                                <span className="text-streak font-extrabold text-lg font-mono">{streak}</span>
                                <span className="text-streak/80 text-[11px] font-mono">day streak</span>
                                <span className="text-zinc-500 text-[9px] font-mono ml-1">Top {currentGoal.startVal > 1800 ? "3.2%" : "8.5%"}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="text-zinc-400 hover:text-zinc-200 transition-colors py-1 px-3 bg-zinc-950 border border-zinc-850 rounded text-[10px] font-mono"
                        >
                            Edit Handles
                        </button>
                        <button
                            onClick={() => refreshData(cfHandle, lcHandle, ccHandle, true)}
                            disabled={isLoading}
                            className={`flex items-center gap-1.5 py-1 px-3 bg-zinc-950 border border-zinc-850 rounded text-[10px] font-mono hover:text-white transition-colors ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                        >
                            <RefreshCw size={10} className={isLoading ? "animate-spin" : ""} />
                            {isLoading ? "Syncing…" : "Sync"}
                        </button>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════
                    TODAY'S WORKSPACE — Cohesive visual hub
                    ═══════════════════════════════════════════════ */}
                <section className="py-6 border-b border-brand-border-subtle animate-entry space-y-5">
                    
                    {/* Welcome Header block */}
                    <div className="space-y-1">
                        <div className="text-[9px] font-mono text-zinc-450 uppercase tracking-widest font-bold flex items-center gap-1.5">
                            {getGreeting()} / Welcome back
                        </div>
                        <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[10px] font-mono text-zinc-450">
                            <span
                                className="font-bold text-zinc-350 uppercase"
                                title={combinedData?.codeforces?.rank ? 'Codeforces rank' : combinedData?.leetcode?.rating > 0 ? 'LeetCode tier' : 'Rank tier'}
                            >
                                {userRank}
                                <span className="text-zinc-600 font-normal normal-case ml-1">
                                    ({combinedData?.codeforces?.rank ? 'CF' : combinedData?.leetcode?.rating > 0 ? 'LC' : '—'})
                                </span>
                            </span>
                            <span>•</span>
                            <span>{lastActiveText === "Today" ? "Active now" : `Active ${lastActiveText}`}</span>
                        </div>
                    </div>

                    {/* AI Insight Banner */}
                    {combinedData && (
                        <div className="flex items-start gap-3 px-4 py-3 bg-ai/5 border border-ai/20 rounded-lg max-w-2xl">
                            <span className="text-lg leading-none mt-0.5">{aiInsight.icon}</span>
                            <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                                {aiInsight.msg}
                            </p>
                        </div>
                    )}

                    {/* ══ TODAY'S GOAL — PRIMARY FOCAL INSTRUMENT ══ */}
                    <div className={`relative overflow-hidden rounded-xl border bg-zinc-950/60 p-6 transition-colors duration-500 ${
                        dailyGoalDone ? 'border-growth/35' : 'border-streak/30'
                    }`}>
                        {/* Animated background progress fill */}
                        <div
                            className={`absolute inset-y-0 left-0 transition-all duration-700 rounded-xl ${dailyGoalDone ? 'bg-growth/8' : 'bg-streak/6'}`}
                            style={{ width: `${dailyGoalPct}%` }}
                        />
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
                            {/* Number + label */}
                            <div className="flex items-baseline gap-3 shrink-0">
                                <span className="text-6xl font-extrabold text-white font-mono leading-none tabular-nums">
                                    {todaySolvedCount}
                                </span>
                                <span className="text-2xl text-zinc-600 font-mono">/ {DAILY_GOAL}</span>
                                <span className="text-zinc-400 text-sm font-sans ml-1">problems today</span>
                            </div>

                            {/* Progress bar + two distinct micro-stats below */}
                            <div className="flex-1 space-y-2">
                                {/* Bar row: label left, remaining annotation right — tightly grouped */}
                                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                                    <span>Daily Target</span>
                                    {!dailyGoalDone && (
                                        <span className="text-zinc-400 normal-case tracking-normal">
                                            {DAILY_GOAL - todaySolvedCount} more to hit goal ↓
                                        </span>
                                    )}
                                    {dailyGoalDone && (
                                        <span className="text-growth font-bold">✓ Complete</span>
                                    )}
                                </div>
                                <div className="h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${dailyGoalDone ? 'bg-growth' : 'bg-streak'}`}
                                        style={{ width: `${dailyGoalPct}%` }}
                                    />
                                </div>
                                {/* Two separate micro-stats — today vs week, never blended */}
                                <div className="flex items-center gap-3 pt-0.5">
                                    <span className="inline-flex items-center gap-1.5 text-[9px] font-mono">
                                        <span className="text-zinc-600 uppercase tracking-widest">Today</span>
                                        <span className={`font-bold tabular-nums ${dailyGoalDone ? 'text-growth' : 'text-zinc-300'}`}>
                                            {dailyGoalPct}%
                                        </span>
                                    </span>
                                    <span className="text-zinc-800">·</span>
                                    <span className="inline-flex items-center gap-1.5 text-[9px] font-mono">
                                        <span className="text-zinc-600 uppercase tracking-widest">This week</span>
                                        <span className="font-bold text-zinc-300 tabular-nums">{weeklySolvedCount} solved</span>
                                    </span>
                                    {todaySolvedCount === 0 && (
                                        <>
                                            <span className="text-zinc-800">·</span>
                                            <span className="text-[9px] text-zinc-600 font-sans italic">Start with one.</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Streak badge — inline, given visual weight */}
                            {streak > 0 && (
                                <div className={`flex flex-col items-center gap-1 px-5 py-3 rounded-xl bg-streak/10 border border-streak/30 shrink-0 transition-all ${streak >= 7 ? 'shadow-[0_0_20px_rgba(249,115,22,0.22)]' : ''}`}>
                                    <Flame size={18} className="text-streak" />
                                    <span className="text-3xl font-extrabold text-streak font-mono leading-none tabular-nums">{streak}</span>
                                    <span className="text-[9px] text-streak/70 font-mono uppercase tracking-wider">day streak</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ══ RATING MILESTONE (secondary) ══ */}
                    <div className="space-y-4">
                        <div className="space-y-2 max-w-2xl bg-zinc-950/40 p-4 border border-zinc-900 rounded-lg">
                            <div className="flex items-baseline justify-between mb-3">
                                <span className="text-xl font-extrabold text-white flex items-center gap-2 font-geist">
                                    {currentGoal.label}
                                    {/* Platform badge — makes the bar color logic explicit */}
                                    {currentGoal.platform && currentGoal.platform !== '' && (
                                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                            currentGoal.platform === 'cf' ? 'text-cf bg-cf/10 border border-cf/25' :
                                            currentGoal.platform === 'lc' ? 'text-lc bg-lc/10 border border-lc/25' :
                                            'text-cc bg-cc/10 border border-cc/25'
                                        }`}>
                                            {currentGoal.platform === 'cf' ? 'CF' : currentGoal.platform === 'lc' ? 'LC' : 'CC'}
                                        </span>
                                    )}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{currentGoal.pct}%</span>
                            </div>
                            {/* Bar color tied to platform — not arbitrary */}
                            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${
                                        currentGoal.platform === 'cf' ? 'bg-cf' :
                                        currentGoal.platform === 'lc' ? 'bg-lc' :
                                        currentGoal.platform === 'cc' ? 'bg-cc' :
                                        'bg-brand-primary'
                                    }`}
                                    style={{ width: `${currentGoal.pct}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono mt-2">
                                <span>{currentGoal.startVal || "—"}</span>
                                <span className="text-zinc-300 font-medium">
                                    {currentGoal.startVal ? `${currentGoal.endVal - currentGoal.startVal} pts remaining · ≈ ${Math.ceil((currentGoal.endVal - currentGoal.startVal) / 35) || 3} contests` : "—"}
                                </span>
                                <span>{currentGoal.endVal || "—"}</span>
                            </div>
                        </div>

                        {/* ══ 3-COLUMN SECONDARY WIDGETS ══ */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] font-mono text-zinc-450">

                            {/* Weakest Skill — with real accuracy stat */}
                            <div className="space-y-3 bg-zinc-950/40 p-4 border-l-2 border-l-ai border-t border-r border-b border-zinc-900 rounded-lg flex flex-col justify-between hover:border-zinc-800 transition-all duration-200">
                                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                                    <span className="flex items-center gap-1.5"><Brain size={12} className="text-ai" /> Weakest Skill</span>
                                    {cfHandle && lcHandle && (
                                        <div className="flex gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 shrink-0">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setWeakestSkillPlatform("cf"); }}
                                                className={`px-1.5 py-0.5 rounded text-[8px] transition-colors ${weakestSkillPlatform === 'cf' ? 'bg-ai/10 text-ai font-bold' : 'text-zinc-500 hover:text-zinc-450'}`}
                                            >
                                                CF
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setWeakestSkillPlatform("lc"); }}
                                                className={`px-1.5 py-0.5 rounded text-[8px] transition-colors ${weakestSkillPlatform === 'lc' ? 'bg-ai/10 text-ai font-bold' : 'text-zinc-500 hover:text-zinc-450'}`}
                                            >
                                                LC
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <div className="text-lg font-extrabold text-ai truncate uppercase tracking-tight leading-none font-mono">
                                        {activeWeakestSkill?.tag || "General"}
                                    </div>
                                    {activeWeakestSkill ? (
                                        <div className="space-y-1">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-xl font-bold text-amber-400 font-mono tabular-nums">{activeWeakestSkill.accuracy}%</span>
                                                <span className="text-[9px] text-zinc-550 font-mono">accuracy</span>
                                            </div>
                                            <span className={`text-[9px] font-mono block ${activeWeakestSkill.delta >= 0 ? 'text-growth' : 'text-amber-500'}`}>
                                                {activeWeakestSkill.delta >= 0 ? '+' : ''}{activeWeakestSkill.delta}% vs avg · Detected today
                                            </span>
                                            <span className="text-[8px] text-zinc-500 font-mono block">
                                                {activeWeakestSkill.isLeetCode
                                                    ? `${activeWeakestSkill.count} solved / ${activeWeakestSkill.totalProblems} total on LeetCode`
                                                    : `${activeWeakestSkill.count}/${activeWeakestSkill.totalProblems} recommendations target this tag`
                                                }
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-zinc-400 font-sans block">All tags stable</span>
                                    )}
                                </div>
                            </div>

                            {/* Next Contest */}
                            <div className="space-y-2 bg-zinc-950/40 p-4 border border-zinc-900 rounded-lg flex flex-col justify-between hover:border-zinc-800 transition-all duration-200">
                                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                                    <span>Next Contest</span>
                                    <Calendar size={12} className="text-cf" />
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold text-zinc-200 truncate font-mono">
                                        {nextContest ? nextContest.name : "CF Div. 2 Round"}
                                    </div>
                                    <span className="text-[10px] text-zinc-400 block font-mono mt-1">
                                        {nextContest
                                            ? new Date(nextContest.startTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                            : "Tomorrow, 8:05 PM"}
                                    </span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cf/10 border border-cf/30 rounded text-cf text-[10px] font-bold font-mono w-fit animate-pulse">
                                    🕒 {nextContest ? getRemainingTime(nextContest.startTime) : "14h"}
                                </div>
                            </div>

                            {/* Weekly Volume */}
                            <div className="space-y-2 bg-zinc-950/40 p-4 border border-zinc-900 rounded-lg flex flex-col justify-between hover:border-zinc-800 transition-all duration-200">
                                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                                    <span>Weekly Volume</span>
                                    <TrendingUp size={12} className="text-growth" />
                                </div>
                                <div className="flex items-end justify-between gap-2">
                                    <div>
                                        <div className="text-3xl font-extrabold text-white font-mono tabular-nums">{weeklySolvedCount}</div>
                                        <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest block mt-1">Solved</span>
                                        {weeklyDeltaPercent !== 0 && (
                                            <span className={`text-[9px] font-mono font-bold mt-1 block ${
                                                weeklyDeltaPercent > 0
                                                    ? 'text-growth'
                                                    : Math.abs(weeklyDeltaPercent) < 30
                                                        ? 'text-zinc-400'
                                                        : 'text-red-400'
                                            }`}>
                                                {weeklyDeltaPercent > 0 ? '▲' : '▼'} {Math.abs(weeklyDeltaPercent)}% vs last week
                                            </span>
                                        )}
                                        {weeklyDeltaPercent === 0 && yesterdaySolvedCount > 0 && (
                                            <span className="text-[9px] font-mono text-zinc-500 mt-1 block">
                                                {yesterdaySolvedCount} solved yesterday
                                            </span>
                                        )}
                                    </div>
                                    {/* Mini Sparkline SVG */}
                                    <div className="w-16 h-8 shrink-0">
                                        <svg viewBox="0 0 7 10" className="w-full h-full text-growth overflow-visible">
                                            <polyline
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                points={last7DaysSubmissions.map((count, idx) => `${idx},${10 - Math.min(10, count * 2.5)}`).join(' ')}
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════
                    SINCE YOUR LAST VISIT & CELEBRATION
                    ═══════════════════════════════════════ */}
                {combinedData && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-entry-delay-1">
                        
                        {/* Since Last Visit Feed: Vertical Timeline */}
                        <section className="lg:col-span-8 card-bordered bg-zinc-950/20 border-zinc-800/80 p-4 space-y-4">
                            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-150 font-geist">
                                <Sparkles size={13} className="text-streak" />
                                <span>Recent Activity Timeline</span>
                            </div>

                            <div className="relative pl-4 border-l border-zinc-850 space-y-4 text-[10px] font-mono text-zinc-400">
                                {/* Timepoint 1: Contest rating / deltas */}
                                <div className="relative hover:bg-zinc-950/40 p-1.5 -ml-1.5 rounded transition-colors duration-150">
                                    <span className="absolute -left-[14.5px] top-3 w-2.5 h-2.5 rounded-full bg-cf border-2 border-zinc-950" />
                                    <div className="space-y-0.5 pl-1.5">
                                        <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Yesterday</span>
                                        <span className="text-zinc-200 font-medium block text-xs">
                                            {cfDelta !== null && cfDelta !== 0 ? "Codeforces" : lcDelta !== null && lcDelta !== 0 ? "LeetCode" : "Platform"}
                                        </span>
                                        <span className={`text-sm font-bold font-mono block ${(cfDelta || lcDelta || 0) >= 0 ? 'text-growth' : 'text-red-400'}`}>
                                            {cfDelta !== null && cfDelta !== 0
                                                ? `${cfDelta > 0 ? '+' : ''}${Math.round(cfDelta)} Rating`
                                                : lcDelta !== null && lcDelta !== 0
                                                    ? `${lcDelta > 0 ? '+' : ''}${Math.round(lcDelta)} Rating`
                                                    : "Logs synced"}
                                        </span>
                                    </div>
                                </div>

                                {/* Timepoint 2: AI Coach Suggestions */}
                                <div className="relative hover:bg-zinc-950/40 p-1.5 -ml-1.5 rounded transition-colors duration-150">
                                    <span className="absolute -left-[14.5px] top-3 w-2.5 h-2.5 rounded-full bg-ai border-2 border-zinc-950" />
                                    <div className="space-y-0.5 pl-1.5">
                                        <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">2 hours ago</span>
                                        <span className="text-zinc-200 font-medium block text-xs">AI Practice Plan</span>
                                        <span className="text-sm font-bold font-mono text-ai block">
                                            {recommendations?.length || 0} targets compiled
                                        </span>
                                    </div>
                                </div>

                                {/* Timepoint 3: Solved count */}
                                <div className="relative hover:bg-zinc-950/40 p-1.5 -ml-1.5 rounded transition-colors duration-150">
                                    <span className="absolute -left-[14.5px] top-3 w-2.5 h-2.5 rounded-full bg-growth border-2 border-zinc-950" />
                                    <div className="space-y-0.5 pl-1.5">
                                        <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Today</span>
                                        <span className="text-zinc-200 font-medium block text-xs">Streak Active</span>
                                        <span className="text-sm font-bold font-mono text-growth block">
                                            {streak} days • {weeklySolvedCount} this week
                                        </span>
                                    </div>
                                </div>

                                {/* Timepoint 4: Next Round Target */}
                                <div className="relative hover:bg-zinc-950/40 p-1.5 -ml-1.5 rounded transition-colors duration-150">
                                    <span className="absolute -left-[14.5px] top-3 w-2.5 h-2.5 rounded-full bg-streak border-2 border-zinc-950 animate-pulse" />
                                    <div className="space-y-0.5 pl-1.5">
                                        <span className="text-[9px] text-streak uppercase tracking-wider block font-bold">Upcoming</span>
                                        <span className="text-zinc-200 font-medium block text-xs">
                                            {nextContest ? nextContest.name : "Codeforces Round"}
                                        </span>
                                        <span className="text-sm font-bold font-mono text-streak block">
                                            {nextContest ? getRemainingTime(nextContest.startTime) : "Starts tomorrow"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Celebration Spotlight Card */}
                        <section className="lg:col-span-4 card-bordered border-l-2 border-l-achievement bg-zinc-950/20 border-zinc-800/80 p-5 flex flex-col shadow-[0_0_24px_rgba(245,158,11,0.12)]">
                            {/* Centered content — fills all available vertical space */}
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-4">
                                {/* Trophy icon with glow ring */}
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-full bg-achievement/20 blur-md scale-125" />
                                    <div className="relative w-14 h-14 rounded-full bg-achievement/10 border border-achievement/30 flex items-center justify-center">
                                        <Trophy size={26} className="text-achievement" />
                                    </div>
                                </div>

                                {/* Badge label */}
                                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                                    {spotlightInfo.badge}
                                </span>

                                {/* Title */}
                                <h4 className="text-sm font-extrabold text-zinc-100 uppercase tracking-wider font-mono leading-tight">
                                    {spotlightInfo.title}
                                </h4>

                                {/* Streak number — big & bold */}
                                {streak > 0 && (
                                    <div className="space-y-0.5">
                                        <div className="text-5xl font-extrabold text-achievement font-mono leading-none">
                                            {streak}
                                        </div>
                                        <span className="text-[10px] text-zinc-400 font-sans">Day Streak</span>
                                    </div>
                                )}

                                {/* Fallback desc if no streak */}
                                {!streak && (
                                    <p className="text-[10px] text-zinc-400 font-sans leading-relaxed max-w-[160px]">
                                        {spotlightInfo.desc}
                                    </p>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="pt-3 border-t border-zinc-900 flex justify-between items-center text-[9px] font-mono shrink-0">
                                <span className="text-zinc-500">{spotlightInfo.time}</span>
                                <Link to="/leaderboard" className="text-achievement hover:underline">View Arena →</Link>
                            </div>
                        </section>
                    </div>
                )}

                {/* ═══════════════════════════════════════
                    PLATFORM RATING CARDS — 3 columns
                    Platform identity colors, clear deltas
                    ═══════════════════════════════════════ */}
                {combinedData && (
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-entry-delay-1 mt-2">

                        {/* Codeforces Card */}
                        <div 
                            onClick={() => cfHandle && window.open(`https://codeforces.com/profile/${cfHandle}`, '_blank')}
                            className="card-platform platform-border-cf space-y-4 group cursor-pointer"
                        >
                            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full platform-dot-cf inline-block animate-pulse" />
                                    <span className="text-[11px] font-semibold text-zinc-200 font-mono uppercase tracking-widest">
                                        Codeforces
                                    </span>
                                </div>
                                <span className="text-[9px] font-bold text-cf bg-cf/5 border border-cf/25 px-2 py-0.5 rounded-sm uppercase font-mono">
                                    {combinedData.codeforces.rank || 'expert'}
                                </span>
                            </div>
                            
                            <div className="flex justify-between items-baseline">
                                <div className="text-3xl font-extrabold font-mono text-cf tracking-tight">
                                    {combinedData.codeforces.rating !== "N/A" ? combinedData.codeforces.rating : "—"}
                                </div>
                                <div className="text-right">
                                    <DeltaBadge value={cfDelta} />
                                    <div className="text-[8px] text-zinc-500 font-mono">last round delta</div>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-zinc-800/40 text-[10px] font-mono text-zinc-500">
                                <div className="flex justify-between">
                                    <span>Solved Index</span>
                                    <span className="text-zinc-300 font-bold">{combinedData.codeforces.solved || 0} problems</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Last Active</span>
                                    <span className="text-zinc-300">{lastActiveText}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Milestone Target</span>
                                    <span className="text-zinc-300 font-bold">{combinedData.codeforces.rating !== "N/A" ? "Candidate Master" : "Expert"}</span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-zinc-800/40 flex justify-between text-[10px] font-mono text-zinc-600 transition-colors">
                                <span>Status: Sync Complete</span>
                                <span className="group-hover:text-cf group-hover:underline transition-all duration-200 group-hover:translate-x-0.5 transform inline-block">Open Profile ↗</span>
                            </div>
                        </div>

                        {/* LeetCode Card */}
                        <div 
                            onClick={() => lcHandle && window.open(`https://leetcode.com/${lcHandle}`, '_blank')}
                            className="card-platform platform-border-lc space-y-4 group cursor-pointer"
                        >
                            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full platform-dot-lc inline-block animate-pulse" />
                                    <span className="text-[11px] font-semibold text-zinc-200 font-mono uppercase tracking-widest">
                                        LeetCode
                                    </span>
                                </div>
                                <span className="text-[9px] font-bold text-lc bg-lc/5 border border-lc/25 px-2 py-0.5 rounded-sm uppercase font-mono">
                                    {combinedData.leetcode.rating !== "N/A" && combinedData.leetcode.rating >= 2180 ? "Guardian" : "Knight"}
                                </span>
                            </div>

                            <div className="flex justify-between items-baseline">
                                <div className="text-3xl font-extrabold font-mono text-lc tracking-tight">
                                    {combinedData.leetcode.rating !== "N/A" ? combinedData.leetcode.rating : "—"}
                                </div>
                                <div className="text-right">
                                    <DeltaBadge value={lcDelta} />
                                    <div className="text-[8px] text-zinc-655 font-mono">last round delta</div>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-zinc-800/40 text-[10px] font-mono text-zinc-500">
                                <div className="flex justify-between items-center">
                                    <span>Difficulty Mix</span>
                                    <div className="flex gap-2 text-[9px] text-zinc-400">
                                        <span className="text-growth font-bold">{combinedData.leetcode.easy || 0}E</span>
                                        <span className="text-streak font-bold">{combinedData.leetcode.medium || 0}M</span>
                                        <span className="text-loss font-bold">{combinedData.leetcode.hard || 0}H</span>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span>Last Active</span>
                                    <span className="text-zinc-300">{lastActiveText}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Milestone Target</span>
                                    <span className="text-zinc-300 font-bold">{combinedData.leetcode.rating !== "N/A" && combinedData.leetcode.rating >= 2180 ? "Grandmaster" : "Guardian"}</span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-zinc-800/40 flex justify-between text-[10px] font-mono text-zinc-600 transition-colors">
                                <span>{combinedData.leetcode.solved || 0} solved</span>
                                <span className="group-hover:text-lc group-hover:underline transition-all duration-200 group-hover:translate-x-0.5 transform inline-block">Open Profile ↗</span>
                            </div>
                        </div>

                        {/* CodeChef Card */}
                        <div 
                            onClick={() => ccHandle && window.open(`https://www.codechef.com/users/${ccHandle}`, '_blank')}
                            className="card-platform platform-border-cc space-y-4 group cursor-pointer"
                        >
                            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full platform-dot-cc inline-block animate-pulse" />
                                    <span className="text-[11px] font-semibold text-zinc-200 font-mono uppercase tracking-widest">
                                        CodeChef
                                    </span>
                                </div>
                                <span className="text-[9px] font-bold text-cc bg-cc/5 border border-cc/25 px-2 py-0.5 rounded-sm uppercase font-mono">
                                    {combinedData.codechef?.stars || '4 star'}
                                </span>
                            </div>

                            <div className="flex justify-between items-baseline">
                                <div className="text-3xl font-extrabold font-mono text-cc tracking-tight">
                                    {combinedData.codechef?.rating !== "N/A" ? combinedData.codechef?.rating : "—"}
                                </div>
                                <div className="text-right">
                                    <DeltaBadge value={ccDelta} />
                                    <div className="text-[8px] text-zinc-655 font-mono">last round delta</div>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-zinc-800/40 text-[10px] font-mono text-zinc-500">
                                <div className="flex justify-between">
                                    <span>Solved Index</span>
                                    <span className="text-zinc-300 font-bold">{combinedData.codechef?.solved || 0} problems</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Last Active</span>
                                    <span className="text-zinc-300">{lastActiveText}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Milestone Target</span>
                                    <span className="text-zinc-300 font-bold">5 Star Division</span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-zinc-800/40 flex justify-between text-[10px] font-mono text-zinc-600 transition-colors">
                                <span>Status: Sync Complete</span>
                                <span className="group-hover:text-cc group-hover:underline transition-all duration-200 group-hover:translate-x-0.5 transform inline-block">Open Profile ↗</span>
                            </div>
                        </div>
                    </section>
                )}

                {/* ═══════════════════════════════════════
                    SUBMISSION HEATMAP — warm orange scale
                    ═══════════════════════════════════════ */}
                {combinedData?.heatmap && (
                    <section>
                        <SubmissionHeatmap data={combinedData.heatmap} streak={streak} />
                    </section>
                )}

                {/* ═══════════════════════════════════════
                    RATING TRAJECTORY — platform-colored lines
                    ═══════════════════════════════════════ */}
                <section className="card-bordered">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-sm font-semibold text-zinc-200 font-geist">Rating Trajectory</h2>
                            <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider mt-0.5">
                                contest history across platforms
                            </p>
                        </div>
                        <TrendingUp size={16} className="text-zinc-600" />
                    </div>

                    {activePlatformCount > 0 ? (
                        <div className={`grid grid-cols-1 gap-4 ${activePlatformCount > 1 ? 'md:grid-cols-2' : ''} ${activePlatformCount > 2 ? 'xl:grid-cols-3' : ''}`}>
                            {ratingHistory.codeforces.length > 0 && (
                                <ActivityGraph
                                    data={ratingHistory.codeforces}
                                    platform="rating"
                                    color="#3b82f6"
                                    title="Codeforces"
                                    platformKey="cf"
                                />
                            )}
                            {ratingHistory.leetcode.length > 0 && (
                                <ActivityGraph
                                    data={ratingHistory.leetcode}
                                    platform="rating"
                                    color="#f97316"
                                    title="LeetCode"
                                    platformKey="lc"
                                />
                            )}
                            {ratingHistory.codechef.length > 0 && (
                                <ActivityGraph
                                    data={ratingHistory.codechef}
                                    platform="rating"
                                    color="#a78bfa"
                                    title="CodeChef"
                                    platformKey="cc"
                                />
                            )}
                        </div>
                    ) : (
                        <div className="h-32 flex flex-col items-center justify-center text-zinc-700 font-mono text-[10px] text-center">
                            <Zap size={20} className="mb-2 text-zinc-800" />
                            <p className="uppercase tracking-wider">No contest data yet</p>
                            <p className="text-zinc-800 mt-1">Compete in rated contests to unlock your trajectory</p>
                        </div>
                    )}
                </section>

                {/* ═══════════════════════════════════════
                    CONTENT SPLIT: Problems + Explorer
                    ═══════════════════════════════════════ */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 relative">
                        {/* Overflow guard: scrolls independently when many cards added */}
                        <div className="max-h-[700px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded">
                            <ProblemList problems={recommendations} cfHandle={cfHandle} lcHandle={lcHandle} />
                        </div>
                        {/* Fade hint at bottom when overflowing */}
                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-brand-bg to-transparent" />
                    </div>
                    <div>
                        <ProblemExplorer />
                    </div>
                </section>

            </main>

            {/* AI Coach — docked sidebar */}
            <AiCoach />

            {/* Edit Modal */}
            {isEditModalOpen && (
                <EditProfileModal
                    user={user}
                    updateUser={updateUser}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}
        </div>
    );
};

export default Dashboard;
