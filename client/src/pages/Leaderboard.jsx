import React, { useEffect, useMemo, useState } from "react";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleHelp,
    RefreshCw,
    Star,
    Target,
    Trophy,
    X,
} from "lucide-react";
import toast from "react-hot-toast";
import { getLeaderboard } from "../services/leaderboardApi";

const WINDOWS = [
    { key: "global", label: "Overall" },
    { key: "monthly", label: "Monthly" },
    { key: "weekly", label: "Weekly" },
];

const METRICS = [
    { key: "ccScore", label: "C Score", icon: Trophy },
    { key: "totalSolved", label: "Total Questions", icon: Target },
    { key: "lcRating", label: "LeetCode Rating", icon: Star },
    { key: "cfRating", label: "Codeforces Rating", icon: Star },
];

const PAGE_SIZE = 10;

const formatMetricValue = (metricKey, value) => {
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return "N/A";
    if (metricKey === "ccScore") return n.toFixed(2);
    return String(Math.round(n));
};

const Leaderboard = () => {
    const [windowKey, setWindowKey] = useState("global");
    const [metric, setMetric] = useState("ccScore");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [showHowItWorks, setShowHowItWorks] = useState(false);

    const fetchRows = async (showToast = false) => {
        setLoading(true);
        setError("");
        try {
            const data = await getLeaderboard(windowKey, 200);
            setRows(data?.leaderboard || []);
            if (showToast) toast.success("Leaderboard updated");
        } catch (err) {
            const status = Number(err?.response?.status || 0);
            const message =
                status === 401
                    ? "Your session has expired. Please login again."
                    : "Unable to load leaderboard right now. Please try again shortly.";
            setError(message);
            if (showToast) toast.error("Failed to refresh leaderboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRows(false);
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [windowKey]);

    const sortedRows = useMemo(() => {
        const copy = [...rows];
        copy.sort((a, b) => {
            const v1 = Number(a?.[metric] || 0);
            const v2 = Number(b?.[metric] || 0);
            if (v2 !== v1) return v2 - v1;
            return Number(b?.ccScore || 0) - Number(a?.ccScore || 0);
        });
        return copy.map((row, index) => ({ ...row, dynamicRank: index + 1 }));
    }, [rows, metric]);

    const topThree = sortedRows.slice(0, 3);

    const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const pageRows = sortedRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const scoreHint = useMemo(() => {
        if (metric === "ccScore") {
            if (windowKey === "global") {
                return "Rankings are based on cc score, balancing DSA progress, contest performance, and consistency.";
            }
            return "Window rankings prioritize recent cc-score growth and activity consistency.";
        }

        const metricLabel = METRICS.find((item) => item.key === metric)?.label || "Selected metric";
        return `Rankings are currently ordered by ${metricLabel.toLowerCase()} for the selected time window.`;
    }, [metric, windowKey]);

    const selectedMetric = METRICS.find((item) => item.key === metric) || METRICS[0];
    const selectedWindowLabel = WINDOWS.find((item) => item.key === windowKey)?.label || "Overall";

    return (
        <div className="min-h-screen bg-[#0c1618] pb-12">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
                        <p className="text-sm text-gray-400 mt-1 max-w-3xl">{scoreHint}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (metric === "ccScore") {
                                    setShowHowItWorks(true);
                                }
                            }}
                            disabled={metric !== "ccScore"}
                            className={`px-3 py-2 rounded-lg border text-xs inline-flex items-center gap-1 ${metric === "ccScore"
                                ? "border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"
                                : "border-gray-800 text-gray-600 cursor-not-allowed"
                                }`}
                        >
                            <CircleHelp size={14} />
                            How it works?
                        </button>
                        <button
                            onClick={() => fetchRows(true)}
                            disabled={loading}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 border border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10 text-sm ${loading ? "opacity-70 cursor-wait" : ""
                                }`}
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                            {loading ? "Syncing..." : "Refresh"}
                        </button>
                    </div>
                </div>

                <div className="bg-[#111f22] border border-gray-800 rounded-xl p-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                        {METRICS.map((item) => {
                            const Icon = item.icon;
                            const active = metric === item.key;
                            return (
                                <button
                                    key={item.key}
                                    onClick={() => {
                                        setMetric(item.key);
                                        setPage(1);
                                    }}
                                    className={`px-3 py-2 rounded-lg text-sm border inline-flex items-center gap-1.5 transition-colors ${active
                                        ? "bg-[#ff9f1a]/15 border-[#ff9f1a] text-[#ff9f1a]"
                                        : "bg-[#0c1618] border-gray-700 text-gray-400 hover:text-gray-200"
                                        }`}
                                >
                                    <Icon size={14} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 bg-[#0c1618] text-sm text-gray-300">
                        <select
                            value={windowKey}
                            onChange={(e) => setWindowKey(e.target.value)}
                            className="bg-transparent outline-none"
                        >
                            {WINDOWS.map((window) => (
                                <option key={window.key} value={window.key} className="bg-[#0c1618] text-gray-200">
                                    {window.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="text-gray-500" />
                    </div>
                </div>

                {topThree.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {topThree.map((row) => (
                            <div
                                key={`top-${row.userId}`}
                                className={`bg-[#111f22] border rounded-xl p-4 ${row.dynamicRank === 1
                                    ? "border-[#ff9f1a]/70 shadow-[0_0_0_1px_rgba(255,159,26,0.3)]"
                                    : "border-gray-800"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-white font-semibold">{row.username}</p>
                                        <p className="text-xs text-gray-500">@{String(row.username || "").toLowerCase()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] text-gray-500">Rank</p>
                                        <p className="text-lg font-bold text-white">#{row.dynamicRank}</p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className="text-xs text-gray-500">{selectedMetric.label}</p>
                                    <p className="text-3xl font-bold text-[#4ecdc4]">
                                        {formatMetricValue(metric, row?.[metric])}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="bg-[#111f22] border border-gray-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-800">
                        <h2 className="text-2xl font-semibold text-white">{selectedWindowLabel} Ranking</h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Rankings update from your cross-platform coding activity and contest performance.
                        </p>
                    </div>

                    {error ? (
                        <div className="p-6 text-red-400">{error}</div>
                    ) : pageRows.length === 0 && !loading ? (
                        <div className="p-6 text-gray-400">No leaderboard data available yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left">
                                <thead className="bg-[#0f1c1f] border-b border-gray-800 text-xs uppercase text-gray-400 tracking-wide">
                                    <tr>
                                        <th className="px-4 py-3">User Name</th>
                                        <th className="px-4 py-3">Activity Window</th>
                                        <th className="px-4 py-3 text-center">Rank</th>
                                        <th className="px-4 py-3 text-right">{selectedMetric.label}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageRows.map((row) => (
                                        <tr key={row.userId} className="border-b border-gray-800/70 hover:bg-[#0f1c1f]/50">
                                            <td className="px-4 py-3 text-gray-200 font-medium">{row.username}</td>
                                            <td className="px-4 py-3 text-gray-400">{selectedWindowLabel}</td>
                                            <td className="px-4 py-3 text-center text-white">#{row.dynamicRank}</td>
                                            <td className="px-4 py-3 text-right text-[#4ecdc4] font-semibold">
                                                {formatMetricValue(metric, row?.[metric])}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
                        <span>
                            Showing {(safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, sortedRows.length)} of {sortedRows.length} entries
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={safePage === 1}
                                className="p-1.5 rounded border border-gray-700 disabled:opacity-50"
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="px-2 py-1 border border-gray-700 rounded">{safePage}</span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={safePage === totalPages}
                                className="p-1.5 rounded border border-gray-700 disabled:opacity-50"
                                aria-label="Next page"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {showHowItWorks && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="w-full max-w-xl bg-[#111f22] border border-gray-800 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-white">How We Calculate CC Score</h3>
                                <button
                                    onClick={() => setShowHowItWorks(false)}
                                    className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#0c1618]"
                                    aria-label="Close"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-3 text-sm text-gray-300">
                                <p>
                                    CC Score is a balanced metric that combines cross-platform ratings, solved questions,
                                    and consistency over time.
                                </p>
                                <div className="bg-[#0c1618] border border-gray-700 rounded-lg p-3">
                                    <p className="text-xs text-gray-400 mb-2">Overall CC Score Components</p>
                                    <ul className="space-y-1 text-sm">
                                        <li>Rating component: normalized Codeforces + LeetCode + CodeChef ratings</li>
                                        <li>Solved component: total solved across linked platforms</li>
                                        <li>Consistency component: number of active tracked days</li>
                                    </ul>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Monthly/Weekly windows prioritize recent growth in ratings, solved count, and activity.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Leaderboard;
