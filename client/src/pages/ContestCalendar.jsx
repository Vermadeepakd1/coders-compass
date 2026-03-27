import React, { useEffect, useMemo, useState } from "react";
import {
    CalendarClock,
    ChevronLeft,
    ChevronRight,
    Clock3,
    ExternalLink,
    LocateFixed,
    RefreshCw,
    Search,
} from "lucide-react";
import toast from "react-hot-toast";
import { getUpcomingContests } from "../services/contestApi";

const PLATFORM_OPTIONS = ["codeforces", "leetcode", "codechef"];

const PLATFORM_COLORS = {
    codeforces: "bg-blue-500",
    leetcode: "bg-yellow-500",
    codechef: "bg-amber-500",
};

const toGoogleDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};

const formatTimeRange = (startIso, endIso) => {
    const start = new Date(startIso);
    const end = new Date(endIso);
    return `${start.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    })} - ${end.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    })}`;
};

const monthLabel = (date) =>
    date.toLocaleString(undefined, { month: "long", year: "numeric" });

const buildMonthGrid = (activeMonthDate) => {
    const first = new Date(activeMonthDate.getFullYear(), activeMonthDate.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());

    const cells = [];
    for (let i = 0; i < 42; i += 1) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        cells.push(day);
    }
    return cells;
};

const toDateKey = (date) => {
    const dt = new Date(date);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
        dt.getDate()
    ).padStart(2, "0")}`;
};

const getGoogleCalendarUrl = (contest) => {
    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: contest.title,
        dates: `${toGoogleDate(contest.startTime)}/${toGoogleDate(contest.endTime)}`,
        details: `Join ${contest.platform} contest from Coder's Compass`,
        location: contest.url,
    });

    return `https://www.google.com/calendar/render?${params.toString()}`;
};

const ContestCalendar = () => {
    const [selectedPlatforms, setSelectedPlatforms] = useState(PLATFORM_OPTIONS);
    const [contests, setContests] = useState([]);
    const [sourceStatus, setSourceStatus] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [activeMonth, setActiveMonth] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchContests = async (showToast = false) => {
        setLoading(true);
        setError("");
        try {
            const data = await getUpcomingContests(selectedPlatforms);
            setContests(data?.contests || []);
            setSourceStatus(data?.sourceStatus || {});
            if (showToast) toast.success("Contest calendar refreshed");
        } catch (err) {
            const status = Number(err?.response?.status || 0);
            const message =
                status === 401
                    ? "Your session has expired. Please login again."
                    : "Unable to load upcoming contests right now. Please try again shortly.";
            setError(message);
            if (showToast) toast.error("Failed to refresh contests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContests(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPlatforms.join("|")]);

    const emptyMessage = useMemo(() => {
        if (loading) return "Loading contests...";
        if (error) return error;
        return "No upcoming contests found for the selected platforms.";
    }, [loading, error]);

    const filteredContests = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        const selected = new Set(selectedPlatforms.map((p) => p.toLowerCase()));

        const list = contests.filter((contest) => {
            const platform = String(contest.platform || "").toLowerCase();
            const passesPlatform = selected.size === 0 || selected.has(platform);
            const passesSearch =
                !query ||
                contest.title?.toLowerCase().includes(query) ||
                contest.platform?.toLowerCase().includes(query);
            return passesPlatform && passesSearch;
        });

        return list.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }, [contests, selectedPlatforms, searchTerm]);

    const groupedUpcoming = useMemo(() => {
        const groups = [];
        const map = new Map();

        filteredContests.forEach((contest) => {
            const key = toDateKey(contest.startTime);
            if (!map.has(key)) {
                map.set(key, []);
                groups.push({ key, date: new Date(contest.startTime), items: map.get(key) });
            }
            map.get(key).push(contest);
        });

        return groups;
    }, [filteredContests]);

    const contestsByDate = useMemo(() => {
        const map = new Map();
        filteredContests.forEach((contest) => {
            const key = toDateKey(contest.startTime);
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key).push(contest);
        });
        return map;
    }, [filteredContests]);

    const monthCells = useMemo(() => buildMonthGrid(activeMonth), [activeMonth]);

    const togglePlatform = (platform) => {
        setSelectedPlatforms((prev) =>
            prev.includes(platform)
                ? prev.filter((item) => item !== platform)
                : [...prev, platform]
        );
    };

    return (
        <div className="min-h-screen bg-[#0c1618] pb-12">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <CalendarClock size={22} className="text-[#4ecdc4]" />
                        Contest Calendar
                    </h1>
                    <button
                        onClick={() => fetchContests(true)}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10 text-sm h-9 ${loading ? "opacity-70 cursor-wait" : ""
                            }`}
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        {loading ? "Syncing..." : "Refresh"}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="lg:col-span-2 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search contests"
                            className="w-full bg-[#111f22] border border-gray-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4ecdc4]"
                        />
                    </div>

                    <div className="bg-[#111f22] border border-gray-800 rounded-lg p-1 flex items-center gap-1">
                        {PLATFORM_OPTIONS.map((platform) => {
                            const active = selectedPlatforms.includes(platform);
                            return (
                                <button
                                    key={platform}
                                    onClick={() => togglePlatform(platform)}
                                    className={`flex-1 px-2 py-2 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors ${active
                                        ? "bg-[#4ecdc4]/15 text-[#4ecdc4]"
                                        : "text-gray-400 hover:text-gray-200"
                                        }`}
                                >
                                    {platform}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                    {Object.entries(sourceStatus).map(([key, ok]) => (
                        <span
                            key={key}
                            className={`px-2.5 py-1 rounded-full border capitalize ${ok
                                ? "border-emerald-800 text-emerald-300 bg-emerald-950/40"
                                : "border-amber-900 text-amber-300 bg-amber-950/30"
                                }`}
                        >
                            {key}: {ok ? "live" : "unavailable"}
                        </span>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                    <section className="xl:col-span-1 bg-[#111f22] border border-gray-800 rounded-xl p-4 max-h-[72vh] overflow-auto">
                        <h2 className="text-xl font-semibold text-white">Upcoming Contests</h2>
                        <p className="text-xs text-gray-500 mt-1">Scheduled events by date.</p>

                        {groupedUpcoming.length === 0 ? (
                            <div className="mt-6 border border-dashed border-gray-700 rounded-lg p-5 text-sm text-gray-400 text-center">
                                {emptyMessage}
                            </div>
                        ) : (
                            <div className="mt-4 space-y-4">
                                {groupedUpcoming.map((group) => (
                                    <div key={group.key}>
                                        <p className="text-xs text-gray-500 mb-2">
                                            {group.date.toLocaleDateString(undefined, {
                                                month: "numeric",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>

                                        <div className="space-y-2">
                                            {group.items.map((contest) => {
                                                const platformKey = String(contest.platform || "").toLowerCase();
                                                return (
                                                    <div
                                                        key={contest.id}
                                                        className="rounded-lg border border-gray-700 bg-[#0f1c1f] p-3 transition-all duration-200 hover:border-[#4ecdc4]/35"
                                                    >
                                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                                            <span
                                                                className={`w-2 h-2 rounded-full ${PLATFORM_COLORS[platformKey] || "bg-gray-400"
                                                                    }`}
                                                            ></span>
                                                            <Clock3 size={12} />
                                                            <span>{formatTimeRange(contest.startTime, contest.endTime)}</span>
                                                        </div>

                                                        <p className="text-sm text-gray-100 mt-2 leading-snug">
                                                            {contest.title}
                                                        </p>

                                                        <div className="mt-2 flex items-center gap-3">
                                                            <a
                                                                href={getGoogleCalendarUrl(contest)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-[#4ecdc4] hover:text-white inline-flex items-center gap-1"
                                                            >
                                                                <LocateFixed size={12} />
                                                                Add to Calendar
                                                            </a>
                                                            <a
                                                                href={contest.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-gray-400 hover:text-gray-200 inline-flex items-center gap-1"
                                                            >
                                                                Open
                                                                <ExternalLink size={12} />
                                                            </a>
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

                    <section className="xl:col-span-2 bg-[#111f22] border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-2xl font-semibold text-white">{monthLabel(activeMonth)}</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        setActiveMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1))
                                    }
                                    className="p-2 rounded border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"
                                    aria-label="Previous month"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() =>
                                        setActiveMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1))
                                    }
                                    className="p-2 rounded border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"
                                    aria-label="Next month"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 text-xs text-gray-400 border border-gray-800 rounded-t-lg overflow-hidden">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                <div
                                    key={day}
                                    className="px-2 py-2 bg-[#0f1c1f] text-center border-r border-gray-800 last:border-r-0"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 border-x border-b border-gray-800 rounded-b-lg overflow-hidden">
                            {monthCells.map((day) => {
                                const key = toDateKey(day);
                                const dayContests = contestsByDate.get(key) || [];
                                const isCurrentMonth = day.getMonth() === activeMonth.getMonth();
                                const isToday = toDateKey(day) === toDateKey(new Date());

                                return (
                                    <div
                                        key={`${key}-cell`}
                                        className={`min-h-[95px] p-2 border-r border-b border-gray-800 last:border-r-0 ${isCurrentMonth ? "bg-[#111f22]" : "bg-[#0d181a]"
                                            }`}
                                    >
                                        <div
                                            className={`text-xs mb-1 ${isToday
                                                ? "text-[#4ecdc4] font-bold"
                                                : isCurrentMonth
                                                    ? "text-gray-300"
                                                    : "text-gray-600"
                                                }`}
                                        >
                                            {day.getDate()}
                                        </div>

                                        <div className="space-y-1">
                                            {dayContests.slice(0, 2).map((contest) => {
                                                const platformKey = String(contest.platform || "").toLowerCase();
                                                return (
                                                    <a
                                                        key={`${contest.id}-${key}`}
                                                        href={contest.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] leading-tight px-1.5 py-1 rounded bg-[#0f1c1f] border border-gray-700 text-gray-200 truncate"
                                                        title={contest.title}
                                                    >
                                                        <span
                                                            className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${PLATFORM_COLORS[platformKey] || "bg-gray-400"
                                                                }`}
                                                        ></span>
                                                        {contest.title}
                                                    </a>
                                                );
                                            })}
                                            {dayContests.length > 2 && (
                                                <div className="text-[10px] text-gray-500">+{dayContests.length - 2} more</div>
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
