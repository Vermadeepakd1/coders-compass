import React, { useMemo, useState, useCallback } from "react";
import { BookOpen, ExternalLink, Search, CheckCircle2, Circle, TrendingUp } from "lucide-react";

/* ── resource data ─────────────────────────────────────── */
const RESOURCES = [
    { id: "cf-edu",    title: "Codeforces EDU",       category: "Competitive Programming", level: "Beginner",    description: "Structured modules for common CP topics and techniques.",                              url: "https://codeforces.com/edu/courses" },
    { id: "usaco",     title: "USACO Guide",           category: "Competitive Programming", level: "Intermediate", description: "Step-by-step roadmaps from beginner to advanced contest prep.",                    url: "https://usaco.guide/" },
    { id: "cp-algos",  title: "cp-algorithms",         category: "DSA",                     level: "Intermediate", description: "Reference-quality explanations for algorithms and data structures.",               url: "https://cp-algorithms.com/" },
    { id: "neetcode",  title: "NeetCode Roadmap",      category: "Interview Prep",           level: "Beginner",    description: "Practical interview-focused problem progression with explanations.",                url: "https://neetcode.io/roadmap" },
    { id: "lc-explore",title: "LeetCode Explore",      category: "Interview Prep",           level: "Beginner",    description: "Guided study plans and focused topic tracks.",                                     url: "https://leetcode.com/explore/" },
    { id: "atcoder",   title: "AtCoder Problems",      category: "Practice Platforms",       level: "All levels",  description: "Problem browser, virtual contests, and targeted drill practice.",                  url: "https://kenkoooo.com/atcoder/" },
    { id: "gfg",       title: "GeeksforGeeks DSA",     category: "DSA",                     level: "Beginner",    description: "Broad concept summaries with examples and practice links.",                        url: "https://www.geeksforgeeks.org/data-structures/" },
    { id: "cses",      title: "CSES Problem Set",      category: "Practice Platforms",       level: "Intermediate", description: "High-signal curated problems for core algorithm mastery.",                       url: "https://cses.fi/problemset/" },
    { id: "cp-book",   title: "Competitive Programmer's Handbook", category: "Competitive Programming", level: "Advanced", description: "Free, comprehensive book by Antti Laaksonen covering the full CP curriculum.", url: "https://cses.fi/book/book.pdf" },
    { id: "kactl",     title: "KACTL",                 category: "Competitive Programming", level: "Advanced",    description: "KTH's competition team notebook — battle-tested implementations.",                 url: "https://github.com/kth-competitive-programming/kactl" },
    { id: "lchs",      title: "LeetCode Hard Study",   category: "Interview Prep",           level: "Advanced",    description: "Curated Hard problems with community editorial walkthroughs.",                     url: "https://leetcode.com/problemset/?difficulty=HARD" },
    { id: "visualgo",  title: "VisuAlgo",              category: "DSA",                     level: "Beginner",    description: "Animated algorithm visualisations for intuitive understanding.",                   url: "https://visualgo.net/en" },
];

const CATEGORIES = ["All", ...new Set(RESOURCES.map(r => r.category))];

const LEVEL_COLORS = {
    "Beginner":     { color: "#10b981", bg: "#10b98112" },
    "Intermediate": { color: "#f97316", bg: "#f9731612" },
    "Advanced":     { color: "#a78bfa", bg: "#a78bfa12" },
    "All levels":   { color: "#71717a", bg: "#71717a12" },
};

/* ── visited tracking (localStorage) ─────────────────── */
const VISITED_KEY = "cc_resources_visited";

const getVisited = () => {
    try { return new Set(JSON.parse(localStorage.getItem(VISITED_KEY) || "[]")); }
    catch { return new Set(); }
};

const saveVisited = set => {
    try { localStorage.setItem(VISITED_KEY, JSON.stringify([...set])); } catch {}
};

const ROADMAPS = [
    {
        title: "Codeforces Expert Roadmap",
        description: "Sequence to cross the 1600+ rating threshold.",
        steps: ["cf-edu", "usaco", "cses", "cp-book"]
    },
    {
        title: "LeetCode Guardian Roadmap",
        description: "Sequence for top-tier DSA interview prep.",
        steps: ["neetcode", "lc-explore", "lchs"]
    },
    {
        title: "Core Foundations Roadmap",
        description: "Master algorithms and visualizations.",
        steps: ["visualgo", "gfg", "cp-algos"]
    }
];

/* ── Resources ────────────────────────────────────────── */
const Resources = () => {
    const [search, setSearch]     = useState("");
    const [category, setCategory] = useState("All");
    const [visited, setVisited]   = useState(getVisited);

    const [lastVisited, setLastVisited] = useState(() => {
        return {
            id: localStorage.getItem("cc_last_resource_id") || "",
            title: localStorage.getItem("cc_last_resource_title") || "",
            url: localStorage.getItem("cc_last_resource_url") || ""
        };
    });

    const handleResourceClick = useCallback((r) => {
        localStorage.setItem("cc_last_resource_id", r.id);
        localStorage.setItem("cc_last_resource_title", r.title);
        localStorage.setItem("cc_last_resource_url", r.url);
        setLastVisited({ id: r.id, title: r.title, url: r.url });
    }, []);

    const toggleVisited = useCallback(id => {
        setVisited(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            saveVisited(next);
            return next;
        });
    }, []);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return RESOURCES.filter(r =>
            (category === "All" || r.category === category) &&
            (!term || r.title.toLowerCase().includes(term) || r.description.toLowerCase().includes(term))
        );
    }, [search, category]);

    /* Per-category progress */
    const categoryProgress = useMemo(() => {
        const map = {};
        CATEGORIES.slice(1).forEach(cat => {
            const items = RESOURCES.filter(r => r.category === cat);
            const done  = items.filter(r => visited.has(r.id)).length;
            map[cat] = { done, total: items.length };
        });
        return map;
    }, [visited]);

    const totalVisited = visited.size;
    const totalPercent = Math.round((totalVisited / RESOURCES.length) * 100);

    return (
        <div className="min-h-screen bg-brand-bg pb-16 font-sans">
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">

                {/* ═══════════════════════════════════════════════
                    HERO — Progress visual anchor
                    ═══════════════════════════════════════════════ */}
                <section className="card-bordered animate-entry">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="flex-1">
                            <h1 className="text-xl font-semibold text-zinc-100 font-geist">Learning Resources</h1>
                            <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider mt-0.5">
                                {RESOURCES.length} curated resources · click checkmarks to track progress
                            </p>

                            {/* Overall progress bar */}
                            <div className="mt-4">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Overall progress</span>
                                    <span className="text-[10px] font-mono text-zinc-300">
                                        {totalVisited}/{RESOURCES.length}
                                        <span className="text-zinc-600 ml-1">({totalPercent}%)</span>
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-growth rounded-full transition-all duration-500"
                                        style={{ width: `${totalPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Per-category mini progress */}
                        <div className="grid grid-cols-2 gap-3 shrink-0 sm:w-64">
                            {Object.entries(categoryProgress).map(([cat, { done, total }]) => (
                                <div key={cat} className="text-center">
                                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest truncate">{cat}</div>
                                    <div className="mt-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.round((done/total)*100)}%`,
                                                backgroundColor: done === total ? "#10b981" : "#3b82f6",
                                            }}
                                        />
                                    </div>
                                    <div className="text-[9px] font-mono text-zinc-600 mt-0.5">{done}/{total}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Resume Learning card */}
                {lastVisited.title && (
                    <section className="card-bordered animate-entry-delay-1 border-l-2 border-l-cf bg-cf/3 py-4 flex items-center justify-between gap-4">
                        <div>
                            <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Resume Learning</div>
                            <h3 className="text-sm font-semibold text-zinc-100 font-geist mt-1">{lastVisited.title}</h3>
                        </div>
                        <a 
                            href={lastVisited.url} 
                            target="_blank" rel="noopener noreferrer"
                            className="btn-primary text-xs flex items-center gap-1.5"
                        >
                            Open Resource ↗
                        </a>
                    </section>
                )}

                {/* Roadmaps section */}
                <section className="space-y-4 animate-entry-delay-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Milestone Roadmaps</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {ROADMAPS.map((roadmap) => {
                            const steps = roadmap.steps.map(id => RESOURCES.find(r => r.id === id)).filter(Boolean);
                            const doneCount = steps.filter(s => visited.has(s.id)).length;
                            const totalCount = steps.length;
                            const percent = Math.round((doneCount / totalCount) * 100);

                            return (
                                <div key={roadmap.title} className="card-bordered p-4 space-y-3">
                                    <div>
                                        <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">{roadmap.title}</h4>
                                        <p className="text-[10px] text-zinc-500 font-sans leading-snug mt-1">{roadmap.description}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                                            <span>Progress</span>
                                            <span>{doneCount}/{totalCount} ({percent}%)</span>
                                        </div>
                                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-cf rounded-full transition-all duration-350" style={{ width: `${percent}%` }} />
                                        </div>
                                    </div>
                                    <div className="space-y-1 pt-1.5 border-t border-zinc-850">
                                        {steps.map(s => {
                                            const isDone = visited.has(s.id);
                                            return (
                                                <div key={s.id} className="flex items-center justify-between text-[10px] font-sans">
                                                    <span className={isDone ? "text-zinc-400 line-through" : "text-zinc-300"}>{s.title}</span>
                                                    <span className={isDone ? "text-growth font-bold" : "text-zinc-650"}>{isDone ? "✓" : "○"}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Search + Category Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search resources…"
                            className="input-developer w-full pl-9"
                        />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {CATEGORIES.map(cat => {
                            const active = cat === category;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className="px-3 py-1 rounded-sm text-[9px] font-bold font-mono uppercase tracking-widest border transition-all"
                                    style={active
                                        ? { backgroundColor: "#27272a", borderColor: "#3f3f46", color: "#f4f4f5" }
                                        : { backgroundColor: "transparent", borderColor: "#27272a", color: "#52525b" }
                                    }
                                >
                                    {cat}
                                    {cat !== "All" && categoryProgress[cat] && (
                                        <span className="ml-1.5 text-zinc-700">
                                            {categoryProgress[cat].done}/{categoryProgress[cat].total}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Resource list */}
                {filtered.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-zinc-800 rounded text-zinc-700 font-mono text-[10px] uppercase tracking-wider">
                        No resources matched
                    </div>
                ) : (
                    <div className="card-bordered p-0 overflow-hidden">
                        {/* Table header */}
                        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-zinc-950 border-b border-zinc-800 text-[9px] font-mono uppercase tracking-widest text-zinc-600">
                            <div className="col-span-1 text-center">Done</div>
                            <div className="col-span-3">Category</div>
                            <div className="col-span-4">Resource</div>
                            <div className="col-span-3">Description</div>
                            <div className="col-span-1 text-center">Level</div>
                        </div>

                        <div>
                            {filtered.map(item => {
                                const isVisited  = visited.has(item.id);
                                const levelStyle = LEVEL_COLORS[item.level] || LEVEL_COLORS["All levels"];
                                return (
                                    <div
                                        key={item.id}
                                        className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-zinc-800/40 items-center transition-colors ${isVisited ? "bg-growth/3" : "hover:bg-zinc-900/30"}`}
                                    >
                                        {/* Check toggle */}
                                        <div className="col-span-1 flex justify-center">
                                            <button
                                                onClick={() => toggleVisited(item.id)}
                                                className={`w-6 h-6 flex items-center justify-center rounded border transition-all duration-150 active:scale-90 ${
                                                    isVisited
                                                        ? 'bg-growth/15 border-growth/50 text-growth'
                                                        : 'bg-transparent border-zinc-700 text-zinc-700 hover:border-zinc-400 hover:text-zinc-400 hover:bg-zinc-800/40'
                                                }`}
                                                title={isVisited ? "Mark as unvisited" : "Mark as visited"}
                                            >
                                                {isVisited
                                                    ? <CheckCircle2 size={13} />
                                                    : <Circle size={13} />
                                                }
                                            </button>
                                        </div>

                                        {/* Category */}
                                        <div className="col-span-3">
                                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                                                {item.category}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <div className="col-span-4">
                                            <a
                                                href={item.url}
                                                target="_blank" rel="noopener noreferrer"
                                                onClick={() => { toggleVisited(item.id); handleResourceClick(item); }}
                                                className="text-xs font-medium text-zinc-200 hover:text-white hover:underline inline-flex items-center gap-1.5 transition-colors"
                                            >
                                                {item.title}
                                                <ExternalLink size={9} className="text-zinc-600 shrink-0" />
                                            </a>
                                        </div>

                                        {/* Description */}
                                        <p className="col-span-3 text-[10px] text-zinc-500 leading-relaxed font-sans">
                                            {item.description}
                                        </p>

                                        {/* Level badge */}
                                        <div className="col-span-1 flex justify-center">
                                            <span
                                                className="text-[8px] font-bold font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                                                style={{ color: levelStyle.color, backgroundColor: levelStyle.bg }}
                                            >
                                                {item.level.split(" ")[0]}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Resources;
