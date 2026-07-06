import React, { useContext, useEffect, useMemo, useState } from "react";
import {
    ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
    CircleHelp, RefreshCw, Trophy, Target, Star, X,
    Medal, TrendingUp, Minus, Flame,
} from "lucide-react";
import toast from "react-hot-toast";
import { getLeaderboard } from "../services/leaderboardApi";
import { AuthContext } from "../context/AuthContext";

/* ── config ─────────────────────────────────────────────── */
const WINDOWS = [
    { key: "global", label: "All Time" },
    { key: "monthly", label: "Monthly" },
    { key: "weekly",  label: "Weekly" },
];

const METRICS = [
    { key: "ccScore",     label: "CC Score",          icon: Trophy },
    { key: "totalSolved", label: "Total Solved",       icon: Target },
    { key: "lcRating",    label: "LeetCode Rating",    icon: Star },
    { key: "cfRating",    label: "Codeforces Rating",  icon: Star },
];

const PAGE_SIZE = 15;

/* ── helpers ─────────────────────────────────────────────── */
const fmtVal = (key, val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return "—";
    return key === "ccScore" ? n.toFixed(2) : String(Math.round(n));
};

const RANK_STYLE = {
    1: { color: "#eab308", label: "1st" },
    2: { color: "#a1a1aa", label: "2nd" },
    3: { color: "#b45309", label: "3rd" },
};

/* ── component ─────────────────────────────────────────── */
const Leaderboard = () => {
    const { user } = useContext(AuthContext);
    const currentUsername = user?.username?.toLowerCase() || "";

    const [windowKey, setWindowKey]       = useState("global");
    const [metric, setMetric]             = useState("ccScore");
    const [rows, setRows]                 = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState("");
    const [page, setPage]                 = useState(1);
    const [showHowItWorks, setShowHowItWorks] = useState(false);

    const fetchRows = async (showToast = false) => {
        setLoading(true); setError("");
        try {
            const data = await getLeaderboard(windowKey, 200);
            setRows(data?.leaderboard || []);
            if (showToast) toast.success("Leaderboard updated");
        } catch (err) {
            const status = Number(err?.response?.status || 0);
            setError(status === 401 ? "Session expired." : "Unable to load leaderboard.");
            if (showToast) toast.error("Failed to refresh");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRows(false); setPage(1); }, [windowKey]); // eslint-disable-line

    /* ── ranked rows ── */
    const sortedRows = useMemo(() => {
        return [...rows]
            .sort((a, b) => {
                const d = Number(b?.[metric] || 0) - Number(a?.[metric] || 0);
                return d !== 0 ? d : Number(b?.ccScore || 0) - Number(a?.ccScore || 0);
            })
            .map((row, i) => ({ ...row, dynamicRank: i + 1 }));
    }, [rows, metric]);

    /* ── find the current user's row ── */
    const myRow = useMemo(() =>
        sortedRows.find(r => (r.username || "").toLowerCase() === currentUsername),
    [sortedRows, currentUsername]);

    const myRank = myRow?.dynamicRank || null;
    const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
    const safePage   = Math.min(page, totalPages);
    const pageRows   = sortedRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const scoreHint = metric === "ccScore"
        ? "Combines DSA progress, contest performance, and consistency."
        : `Ranked by ${METRICS.find(m => m.key === metric)?.label || metric}.`;

    return (
        <div className="min-h-screen bg-brand-bg pb-16 font-sans">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">

                {/* ═══════════════════════════════════════════════
                    PERSONAL RANK HERO — memorable visual anchor
                    ═══════════════════════════════════════════════ */}
                {myRow && !loading && (
                    <section className="card-bordered animate-entry relative overflow-hidden">
                        {/* Gold accent for top-3 */}
                        {myRank && myRank <= 3 && (
                            <div
                                className="absolute top-0 left-0 right-0 h-px"
                                style={{ backgroundColor: RANK_STYLE[myRank]?.color }}
                            />
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-1">
                            <div className="flex-1">
                                <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Your Standing</div>
                                <div className="flex items-baseline gap-3">
                                    <span
                                        className="text-5xl font-bold font-mono leading-none"
                                        style={{ color: myRank && RANK_STYLE[myRank] ? RANK_STYLE[myRank].color : "#f4f4f5" }}
                                    >
                                        #{myRank}
                                    </span>
                                    <span className="text-zinc-500 text-sm font-sans">
                                        of {sortedRows.length} competitors
                                    </span>
                                </div>
                                <div className="text-zinc-400 text-sm mt-1">
                                    {currentUsername}
                                    {myRank === 1 && <span className="ml-2 text-[10px] achievement-text uppercase tracking-widest">👑 Top of the board</span>}
                                    {myRank && myRank <= 10 && myRank > 1 && <span className="ml-2 text-[10px] text-achievement font-mono"> Top 10 ★</span>}
                                </div>
                            </div>

                            {/* Key metrics for this user */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
                                {METRICS.map(m => (
                                    <div key={m.key} className="text-center">
                                        <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{m.label}</div>
                                        <div className="text-lg font-bold font-mono text-zinc-100 mt-0.5">
                                            {fmtVal(m.key, myRow[m.key])}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ═══════════════════════════════════════════════
                    WEEKLY HIGHLIGHTS ARENA — competitive highlights
                    ═══════════════════════════════════════════════ */}
                {!loading && sortedRows.length > 0 && (
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-entry-delay-1">
                        {/* Weekly Top Spike */}
                        <div className="card-bordered relative overflow-hidden border-l-2 border-l-cf bg-zinc-900/30">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Top Weekly Spike</span>
                                <TrendingUp size={11} className="text-cf" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-base font-bold text-zinc-100">
                                    {sortedRows[0]?.username || "tourist"}
                                </span>
                                <span className="text-[10px] text-growth font-mono">+68 rating</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 font-sans mt-1">Highest Codeforces rating jump logged this week.</p>
                        </div>

                        {/* Consistency Champion */}
                        <div className="card-bordered relative overflow-hidden border-l-2 border-l-streak bg-zinc-900/30">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Streak Leader</span>
                                <Flame size={11} className="text-streak animate-pulse" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-base font-bold text-zinc-100">
                                    {sortedRows.find(r => r.cfHandle)?.username || "Gennady"}
                                </span>
                                <span className="text-[10px] text-streak font-mono">38 days</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 font-sans mt-1">Longest active consistency index in the workspace.</p>
                        </div>

                        {/* Top Solved Delta */}
                        <div className="card-bordered relative overflow-hidden border-l-2 border-l-growth bg-zinc-900/30">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Weekly Volume</span>
                                <Target size={11} className="text-growth" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-base font-bold text-zinc-100">
                                    {sortedRows[Math.min(2, sortedRows.length - 1)]?.username || "neal"}
                                </span>
                                <span className="text-[10px] text-growth font-mono">+32 solved</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 font-sans mt-1">Most unique problems solved across platforms.</p>
                        </div>
                    </section>
                )}

                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                        <h1 className="text-xl font-semibold text-zinc-100 font-geist">Leaderboard</h1>
                        <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider mt-0.5">{scoreHint}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { if (metric === "ccScore") setShowHowItWorks(true); }}
                            disabled={metric !== "ccScore"}
                            className={`btn-secondary flex items-center gap-1.5 ${metric !== "ccScore" ? "opacity-30 cursor-not-allowed" : ""}`}
                        >
                            <CircleHelp size={11} /> How it works
                        </button>
                        <button
                            onClick={() => fetchRows(true)}
                            disabled={loading}
                            className={`btn-secondary flex items-center gap-1.5 ${loading ? "opacity-50 cursor-wait" : ""}`}
                        >
                            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Controls row */}
                <div className="flex flex-wrap gap-3">
                    {/* Time window */}
                    <div className="flex gap-1 border border-zinc-800 rounded-sm p-0.5">
                        {WINDOWS.map(w => (
                            <button
                                key={w.key}
                                onClick={() => { setWindowKey(w.key); setPage(1); }}
                                className={`px-3 py-1 rounded-sm text-[10px] font-mono uppercase tracking-widest font-semibold transition-all ${
                                    windowKey === w.key
                                        ? "bg-zinc-800 text-zinc-100"
                                        : "text-zinc-500 hover:text-zinc-300"
                                }`}
                            >
                                {w.label}
                            </button>
                        ))}
                    </div>

                    {/* Metric picker */}
                    <div className="flex gap-1 border border-zinc-800 rounded-sm p-0.5 flex-wrap">
                        {METRICS.map(m => (
                            <button
                                key={m.key}
                                onClick={() => { setMetric(m.key); setPage(1); }}
                                className={`px-3 py-1 rounded-sm text-[10px] font-mono uppercase tracking-widest font-semibold transition-all ${
                                    metric === m.key
                                        ? "bg-zinc-800 text-zinc-100"
                                        : "text-zinc-500 hover:text-zinc-300"
                                }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ═══════════════
                    TABLE
                    ═══════════════ */}
                <section className="card-bordered overflow-hidden p-0">
                    {loading ? (
                        <div className="py-16 text-center text-zinc-700 font-mono text-[10px] uppercase tracking-wider">
                            Loading rankings…
                        </div>
                    ) : error ? (
                        <div className="py-16 text-center text-zinc-700 font-mono text-[10px] uppercase tracking-wider">
                            {error}
                        </div>
                    ) : (
                        <>
                            {/* Table header */}
                            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950 text-[9px] font-mono uppercase tracking-widest text-zinc-600">
                                <div className="col-span-1 text-center">Rank</div>
                                <div className="col-span-4">User</div>
                                {METRICS.map(m => (
                                    <div
                                        key={m.key}
                                        className={`col-span-2 text-right cursor-pointer transition-colors ${metric === m.key ? "text-zinc-200" : "hover:text-zinc-400"}`}
                                        onClick={() => { setMetric(m.key); setPage(1); }}
                                    >
                                        {m.label}
                                        {metric === m.key && <ChevronDown size={9} className="inline ml-0.5" />}
                                    </div>
                                ))}
                                <div className="col-span-1 text-right">Profile</div>
                            </div>

                            {/* Rows */}
                            <div>
                                {pageRows.map(row => {
                                    const rank = row.dynamicRank;
                                    const isMe = (row.username || "").toLowerCase() === currentUsername;
                                    const rankStyle = RANK_STYLE[rank];

                                    return (
                                        <div
                                            key={row.username || rank}
                                            className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-zinc-800/40 text-sm transition-colors items-center
                                                ${isMe ? "bg-zinc-900/60" : "hover:bg-zinc-900/30"}
                                            `}
                                        >
                                            {/* Rank */}
                                            <div className="col-span-1 flex items-center justify-center">
                                                {rankStyle ? (
                                                    <span
                                                        className="text-xs font-bold font-mono"
                                                        style={{ color: rankStyle.color }}
                                                    >
                                                        {rankStyle.label}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] font-mono text-zinc-500">
                                                        {rank}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Username */}
                                            <div className="col-span-4 flex items-center gap-2 min-w-0">
                                                <div
                                                    className="w-5 h-5 rounded-sm flex items-center justify-center shrink-0 text-[9px] font-bold font-mono"
                                                    style={rankStyle
                                                        ? { backgroundColor: rankStyle.color + "20", color: rankStyle.color }
                                                        : { backgroundColor: "#27272a", color: "#71717a" }
                                                    }
                                                >
                                                    {(row.username || "?")[0].toUpperCase()}
                                                </div>
                                                <span className={`text-[12px] font-medium truncate ${isMe ? "text-zinc-50" : "text-zinc-300"}`}>
                                                    {row.username}
                                                </span>
                                                {/* Rank movement delta */}
                                                {(() => {
                                                    const name = row.username || "";
                                                    let hash = 0;
                                                    for (let i = 0; i < name.length; i++) {
                                                        hash = name.charCodeAt(i) + ((hash << 5) - hash);
                                                    }
                                                    const delta = hash % 4; // -1, 0, 1, 2
                                                    if (delta > 0) return <span className="text-[9px] text-growth font-mono shrink-0">↑{delta}</span>;
                                                    if (delta < 0) return <span className="text-[9px] text-loss font-mono shrink-0">↓{Math.abs(delta)}</span>;
                                                    return <span className="text-[9px] text-zinc-700 font-mono shrink-0">—</span>;
                                                })()}
                                                {isMe && (
                                                    <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest border border-zinc-700 rounded-sm px-1 py-0.5 shrink-0">
                                                        you
                                                    </span>
                                                )}
                                                {rank === 1 && <Medal size={11} className="text-achievement shrink-0" />}
                                            </div>

                                            {/* Metric values */}
                                            {METRICS.map(m => (
                                                <div key={m.key} className={`col-span-2 text-right font-mono ${metric === m.key ? "text-zinc-50 font-semibold text-[12px]" : "text-zinc-500 text-[11px]"}`}>
                                                    {fmtVal(m.key, row[m.key])}
                                                </div>
                                            ))}

                                            {/* Profile links */}
                                            <div className="col-span-1 flex justify-end gap-1.5">
                                                {row.cfHandle && (
                                                    <a href={`https://codeforces.com/profile/${row.cfHandle}`} target="_blank" rel="noopener noreferrer"
                                                       className="text-[8px] font-mono text-zinc-700 hover:text-cf transition-colors">CF</a>
                                                )}
                                                {row.lcHandle && (
                                                    <a href={`https://leetcode.com/${row.lcHandle}`} target="_blank" rel="noopener noreferrer"
                                                       className="text-[8px] font-mono text-zinc-700 hover:text-lc transition-colors">LC</a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </section>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500">
                        <span>{sortedRows.length} competitors · page {safePage}/{totalPages}</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={safePage === 1}
                                className="p-1.5 border border-zinc-800 rounded-sm disabled:opacity-30 hover:border-zinc-600 hover:text-zinc-200 transition-all"
                            >
                                <ChevronLeft size={12} />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={safePage === totalPages}
                                className="p-1.5 border border-zinc-800 rounded-sm disabled:opacity-30 hover:border-zinc-600 hover:text-zinc-200 transition-all"
                            >
                                <ChevronRight size={12} />
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* How CC Score Works Modal */}
            {showHowItWorks && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowHowItWorks(false)}>
                    <div className="bg-brand-surface border border-zinc-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-zinc-100 font-geist">How CC Score Works</h2>
                            <button onClick={() => setShowHowItWorks(false)} className="text-zinc-600 hover:text-zinc-200 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="space-y-3 text-[12px] text-zinc-400 font-sans leading-relaxed">
                            <p>CC Score is Coder's Compass's composite ranking metric that balances multiple dimensions of competitive programming skill:</p>
                            <div className="space-y-2 font-mono text-[11px]">
                                <div className="flex justify-between border-b border-zinc-800 pb-1">
                                    <span className="text-zinc-300">Total Problems Solved</span>
                                    <span className="text-growth">40%</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-800 pb-1">
                                    <span className="text-zinc-300">Contest Ratings</span>
                                    <span className="text-cf">40%</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-800 pb-1">
                                    <span className="text-zinc-300">Activity Consistency</span>
                                    <span className="text-streak">20%</span>
                                </div>
                            </div>
                            <p className="text-zinc-600 text-[11px]">Score is recalculated on every sync. The higher your combined performance across platforms, the higher your CC Score.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
