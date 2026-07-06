import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    ChevronLeft, ChevronRight, Clock, ExternalLink,
    CalendarPlus, RefreshCw, Search, Zap, Timer,
} from "lucide-react";
import toast from "react-hot-toast";
import { getUpcomingContests } from "../services/contestApi";

/* ── platform config ──────────────────────────────────────── */
const PLATFORM_OPTIONS = ["codeforces", "leetcode", "codechef"];

const P = {
    codeforces: { color: "#3b82f6", dot: "platform-dot-cf", text: "platform-cf", label: "CF" },
    leetcode:   { color: "#f97316", dot: "platform-dot-lc", text: "platform-lc", label: "LC" },
    codechef:   { color: "#a78bfa", dot: "platform-dot-cc", text: "platform-cc", label: "CC" },
};

/* ── date helpers ─────────────────────────────────────────── */
const toDateKey = d => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

const toGoogleDate = iso => new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

const fmtTime = iso =>
    new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const fmtDuration = (start, end) => {
    const mins = Math.round((new Date(end) - new Date(start)) / 60000);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60), m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
};

const monthLabel = d => d.toLocaleString(undefined, { month: "long", year: "numeric" });

const buildMonthGrid = month => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
    });
};

const getGoogleCalendarUrl = c => {
    const p = new URLSearchParams({
        action: "TEMPLATE", text: c.title,
        dates: `${toGoogleDate(c.startTime)}/${toGoogleDate(c.endTime)}`,
        details: `Rated contest on ${c.platform}`,
        location: c.url,
    });
    return `https://www.google.com/calendar/render?${p}`;
};

/* ── countdown hook ───────────────────────────────────────── */
function useCountdown(targetIso) {
    const [diff, setDiff] = useState(0);
    useEffect(() => {
        const target = new Date(targetIso).getTime();
        const tick = () => setDiff(Math.max(0, target - Date.now()));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [targetIso]);

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s, done: diff === 0 };
}

/* ── countdown display ────────────────────────────────────── */
function CountdownBlock({ label, value }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-zinc-50 leading-none tabular-nums">
                {String(value).padStart(2, "0")}
            </span>
            <span className="text-[8px] text-zinc-600 uppercase tracking-widest mt-1">{label}</span>
        </div>
    );
}

/* ── main component ───────────────────────────────────────── */
const ContestCalendar = () => {
    const [selectedPlatforms, setSelectedPlatforms] = useState(PLATFORM_OPTIONS);
    const [contests, setContests]                   = useState([]);
    const [sourceStatus, setSourceStatus]           = useState({});
    const [searchTerm, setSearchTerm]               = useState("");
    const [activeMonth, setActiveMonth]             = useState(new Date());
    const [loading, setLoading]                     = useState(true);
    const [error, setError]                         = useState("");

    const fetchContests = useCallback(async (showToast = false) => {
        setLoading(true); setError("");
        try {
            const data = await getUpcomingContests(selectedPlatforms);
            setContests(data?.contests || []);
            setSourceStatus(data?.sourceStatus || {});
            if (showToast) toast.success("Contest calendar refreshed");
        } catch (err) {
            const msg = Number(err?.response?.status) === 401
                ? "Session expired. Please login again."
                : "Unable to load contests right now.";
            setError(msg);
            if (showToast) toast.error("Failed to refresh");
        } finally {
            setLoading(false);
        }
    }, [selectedPlatforms]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchContests(false); }, [selectedPlatforms.join("|")]);

    const filteredContests = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        const sel = new Set(selectedPlatforms.map(p => p.toLowerCase()));
        return contests
            .filter(c => {
                const plat = (c.platform || "").toLowerCase();
                return (sel.size === 0 || sel.has(plat)) &&
                    (!q || c.title?.toLowerCase().includes(q) || plat.includes(q));
            })
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }, [contests, selectedPlatforms, searchTerm]);

    const nextContest  = filteredContests[0] || null;
    const countdown    = useCountdown(nextContest?.startTime || new Date().toISOString());

    const groupedContests = useMemo(() => {
        const map = new Map();
        filteredContests.forEach(c => {
            const key = toDateKey(c.startTime);
            if (!map.has(key)) map.set(key, { date: new Date(c.startTime), items: [] });
            map.get(key).items.push(c);
        });
        return [...map.entries()].map(([key, val]) => ({ key, ...val }));
    }, [filteredContests]);

    const contestsByDate = useMemo(() => {
        const map = new Map();
        filteredContests.forEach(c => {
            const key = toDateKey(c.startTime);
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(c);
        });
        return map;
    }, [filteredContests]);

    const monthCells = useMemo(() => buildMonthGrid(activeMonth), [activeMonth]);

    const togglePlatform = p =>
        setSelectedPlatforms(prev =>
            prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
        );

    const nextPlatKey = nextContest ? (nextContest.platform || "").toLowerCase() : null;
    const nextConfig  = nextPlatKey ? P[nextPlatKey] : null;

    return (
        <div className="min-h-screen bg-brand-bg pb-16 font-sans">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">

                {/* ═══════════════════════════════════════════════
                    NEXT CONTEST HERO — The memorable visual anchor
                    ═══════════════════════════════════════════════ */}
                {nextContest && !loading && (
                    <section className="card-bordered relative overflow-hidden animate-entry">
                        {/* Platform accent bar */}
                        <div
                            className="absolute top-0 left-0 right-0 h-px"
                            style={{ backgroundColor: nextConfig?.color || "#8b5cf6" }}
                        />

                        <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-2">
                            {/* Contest info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap size={11} className="contest-accent" />
                                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Next Up</span>
                                    {nextConfig && (
                                        <span
                                            className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-sm uppercase tracking-wider"
                                            style={{
                                                color: nextConfig.color,
                                                backgroundColor: nextConfig.color + "15",
                                                border: `1px solid ${nextConfig.color}30`,
                                            }}
                                        >
                                            {nextContest.platform}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-lg sm:text-xl font-semibold text-zinc-50 font-geist leading-tight truncate">
                                    {nextContest.title}
                                </h2>
                                <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-zinc-500">
                                    <span className="flex items-center gap-1">
                                        <Clock size={9} />
                                        {fmtTime(nextContest.startTime)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Timer size={9} />
                                        {fmtDuration(nextContest.startTime, nextContest.endTime)}
                                    </span>
                                </div>
                                <div className="flex gap-3 mt-3">
                                    <a
                                        href={nextContest.url}
                                        target="_blank" rel="noopener noreferrer"
                                        className="btn-primary text-[11px] flex items-center gap-1.5"
                                        style={{ backgroundColor: nextConfig?.color }}
                                    >
                                        Register <ExternalLink size={10} />
                                    </a>
                                    <a
                                        href={getGoogleCalendarUrl(nextContest)}
                                        target="_blank" rel="noopener noreferrer"
                                        className="btn-secondary text-[11px] flex items-center gap-1.5"
                                    >
                                        <CalendarPlus size={10} /> Add to Cal
                                    </a>
                                </div>
                            </div>

                            {/* Countdown */}
                            <div className="shrink-0">
                                <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-3 text-center">
                                    Starts in
                                </div>
                                <div className="flex items-end gap-3">
                                    {countdown.d > 0 && <CountdownBlock label="days" value={countdown.d} />}
                                    <CountdownBlock label="hours" value={countdown.h} />
                                    <span className="text-zinc-700 text-2xl font-mono pb-5">:</span>
                                    <CountdownBlock label="min" value={countdown.m} />
                                    <span className="text-zinc-700 text-2xl font-mono pb-5">:</span>
                                    <CountdownBlock label="sec" value={countdown.s} />
                                </div>
                            </div>
                        </div>

                        {/* Warmup & Prep diagnostics section */}
                        <div className="mt-5 pt-4 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-zinc-950/60 border border-zinc-900 rounded p-3 space-y-2">
                                <h4 className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-growth" /> Suggested Contest Warmups
                                </h4>
                                <p className="text-[10px] text-zinc-500 font-sans leading-normal">Solve these high-signal problems to prepare your syntax and logic template before the round starts:</p>
                                <div className="flex gap-4 text-[10px] font-mono">
                                    <a 
                                        href={nextContest.platform === "LeetCode" ? "https://leetcode.com/problems/two-sum" : "https://codeforces.com/problemset/problem/4/A"}
                                        target="_blank" rel="noopener noreferrer" 
                                        className="text-cf hover:underline"
                                    >
                                        Warmup 1 (Easy) ↗
                                    </a>
                                    <a 
                                        href={nextContest.platform === "LeetCode" ? "https://leetcode.com/problems/container-with-most-water" : "https://codeforces.com/problemset/problem/158/A"}
                                        target="_blank" rel="noopener noreferrer" 
                                        className="text-cf hover:underline"
                                    >
                                        Warmup 2 (Medium) ↗
                                    </a>
                                </div>
                            </div>

                            <div className="bg-zinc-950/60 border border-zinc-900 rounded p-3 space-y-2">
                                <h4 className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-streak" /> Round Diagnostics & Topics
                                </h4>
                                <p className="text-[10px] text-zinc-500 font-sans leading-normal">
                                    Based on recent contest profiles, expect high priority on: <span className="text-zinc-300 font-semibold">Greedy algorithms, Binary Search, and Map structures</span>. Keep your template ready.
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* Page header + controls */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                        <h1 className="text-xl font-semibold text-zinc-100 font-geist">Contest Calendar</h1>
                        <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider mt-0.5">
                            {filteredContests.length} upcoming {filteredContests.length === 1 ? "contest" : "contests"}
                        </p>
                    </div>

                    {/* Platform filter chips */}
                    <div className="flex items-center gap-2">
                        {PLATFORM_OPTIONS.map(p => {
                            const cfg = P[p];
                            const active = selectedPlatforms.includes(p);
                            return (
                                <button
                                    key={p}
                                    onClick={() => togglePlatform(p)}
                                    className="px-3 py-1 rounded-sm text-[9px] font-bold font-mono uppercase tracking-widest border transition-all"
                                    style={active ? {
                                        color: cfg.color,
                                        borderColor: cfg.color + "60",
                                        backgroundColor: cfg.color + "10",
                                    } : {
                                        color: "#52525b",
                                        borderColor: "#27272a",
                                        backgroundColor: "transparent",
                                    }}
                                >
                                    {cfg.label}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => fetchContests(true)}
                            disabled={loading}
                            className={`btn-secondary flex items-center gap-1.5 ${loading ? "opacity-50 cursor-wait" : ""}`}
                        >
                            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                            {loading ? "…" : "Refresh"}
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search contests…"
                        className="input-developer w-full pl-9"
                    />
                </div>

                {/* Source status */}
                {Object.keys(sourceStatus).length > 0 && (
                    <div className="flex flex-wrap gap-2 text-[9px] font-mono uppercase tracking-widest">
                        {Object.entries(sourceStatus).map(([k, ok]) => (
                            <span
                                key={k}
                                className="px-2 py-0.5 rounded-sm border"
                                style={ok
                                    ? { color: "#10b981", borderColor: "#10b98130" }
                                    : { color: "#f59e0b", borderColor: "#f59e0b30" }
                                }
                            >
                                {k} {ok ? "●" : "○"}
                            </span>
                        ))}
                    </div>
                )}

                {/* ═══════════════════════════
                    TWO-COLUMN LAYOUT
                    ═══════════════════════════ */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">

                    {/* Contest Feed */}
                    <section className="xl:col-span-1 card-bordered max-h-[70vh] overflow-auto space-y-0">
                        <h2 className="text-xs font-semibold text-zinc-200 font-geist mb-4">Upcoming</h2>

                        {loading ? (
                            <div className="py-10 text-center text-zinc-700 font-mono text-[10px] uppercase tracking-wider">
                                Loading…
                            </div>
                        ) : groupedContests.length === 0 ? (
                            <div className="py-10 text-center text-zinc-700 font-mono text-[10px] uppercase tracking-wider border border-dashed border-zinc-800 rounded">
                                {error || "No contests found"}
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {groupedContests.map(group => (
                                    <div key={group.key}>
                                        <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest border-b border-zinc-800 pb-1.5 mb-2">
                                            {group.date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                        </div>
                                        <div className="space-y-3">
                                            {group.items.map(c => {
                                                const pk = (c.platform || "").toLowerCase();
                                                const cfg = P[pk];
                                                return (
                                                    <div key={c.id} className="group flex gap-3">
                                                        {/* Platform accent */}
                                                        <div
                                                            className="w-0.5 rounded-full shrink-0 mt-1"
                                                            style={{ backgroundColor: cfg?.color || "#52525b", minHeight: "36px" }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <span
                                                                    className="text-[8px] font-bold font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
                                                                    style={{ color: cfg?.color || "#71717a", backgroundColor: (cfg?.color || "#71717a") + "15" }}
                                                                >
                                                                    {c.platform}
                                                                </span>
                                                                <span className="text-[9px] font-mono text-zinc-600">
                                                                    {fmtTime(c.startTime)} · {fmtDuration(c.startTime, c.endTime)}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-zinc-200 font-sans leading-snug truncate">{c.title}</p>
                                                            <div className="flex gap-3 mt-1.5">
                                                                <a href={c.url} target="_blank" rel="noopener noreferrer"
                                                                   className="text-[9px] font-mono text-zinc-500 hover:text-zinc-200 flex items-center gap-0.5 transition-colors">
                                                                    Open <ExternalLink size={8} />
                                                                </a>
                                                                <a href={getGoogleCalendarUrl(c)} target="_blank" rel="noopener noreferrer"
                                                                   className="text-[9px] font-mono text-zinc-500 hover:text-zinc-200 flex items-center gap-0.5 transition-colors">
                                                                    + Cal <CalendarPlus size={8} />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Calendar Grid */}
                    <section className="xl:col-span-2 card-bordered">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-semibold text-zinc-200 font-geist">{monthLabel(activeMonth)}</h2>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setActiveMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1))}
                                    className="p-1 border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 rounded-sm transition-all"
                                >
                                    <ChevronLeft size={13} />
                                </button>
                                <button
                                    onClick={() => setActiveMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1))}
                                    className="p-1 border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 rounded-sm transition-all"
                                >
                                    <ChevronRight size={13} />
                                </button>
                            </div>
                        </div>

                        {/* Weekday header */}
                        <div className="grid grid-cols-7 text-[9px] text-zinc-600 font-mono uppercase tracking-widest mb-1">
                            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                                <div key={d} className="text-center py-1">{d}</div>
                            ))}
                        </div>

                        {/* Day cells */}
                        <div className="grid grid-cols-7 border border-zinc-800 rounded overflow-hidden">
                            {monthCells.map(day => {
                                const key = toDateKey(day);
                                const dayContests = contestsByDate.get(key) || [];
                                const isCurMonth = day.getMonth() === activeMonth.getMonth();
                                const isToday = key === toDateKey(new Date());

                                return (
                                    <div
                                        key={`${key}-cell`}
                                        className={`min-h-[72px] p-1.5 border-r border-b border-zinc-800/50 last:border-r-0 flex flex-col
                                            ${isCurMonth ? "bg-brand-surface" : "bg-brand-bg"}`}
                                    >
                                        <div className={`text-[10px] font-mono w-5 h-5 flex items-center justify-center rounded-sm mb-1 font-semibold
                                            ${isToday ? "bg-zinc-100 text-zinc-950" : isCurMonth ? "text-zinc-400" : "text-zinc-700"}`}>
                                            {day.getDate()}
                                        </div>

                                        <div className="space-y-0.5 mt-auto">
                                            {dayContests.slice(0, 2).map(c => {
                                                const pk = (c.platform || "").toLowerCase();
                                                const cfg = P[pk];
                                                return (
                                                    <a
                                                        key={`${c.id}-${key}`}
                                                        href={c.url} target="_blank" rel="noopener noreferrer"
                                                        title={c.title}
                                                        className="text-[8px] px-1 py-0.5 rounded-sm flex items-center gap-1 truncate transition-all hover:opacity-90"
                                                        style={{
                                                            backgroundColor: (cfg?.color || "#52525b") + "18",
                                                            color: cfg?.color || "#71717a",
                                                        }}
                                                    >
                                                        <span
                                                            className="w-1 h-1 rounded-full shrink-0"
                                                            style={{ backgroundColor: cfg?.color || "#52525b" }}
                                                        />
                                                        <span className="truncate">{c.title}</span>
                                                    </a>
                                                );
                                            })}
                                            {dayContests.length > 2 && (
                                                <div className="text-[8px] font-mono text-zinc-600 pl-1">+{dayContests.length - 2}</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ContestCalendar;
