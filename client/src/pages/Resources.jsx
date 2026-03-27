import React, { useMemo, useState } from "react";
import { BookOpen, ExternalLink, Search, Sparkles } from "lucide-react";

const RESOURCES = [
    {
        title: "Codeforces EDU",
        category: "Competitive Programming",
        description: "Structured modules for common CP topics and techniques.",
        url: "https://codeforces.com/edu/courses",
    },
    {
        title: "USACO Guide",
        category: "Competitive Programming",
        description: "Step-by-step roadmaps from beginner to advanced contest prep.",
        url: "https://usaco.guide/",
    },
    {
        title: "cp-algorithms",
        category: "DSA",
        description: "Reference-quality explanations for algorithms and data structures.",
        url: "https://cp-algorithms.com/",
    },
    {
        title: "NeetCode Roadmap",
        category: "Interview Prep",
        description: "Practical interview-focused problem progression with explanations.",
        url: "https://neetcode.io/roadmap",
    },
    {
        title: "LeetCode Explore",
        category: "Interview Prep",
        description: "Guided study plans and focused topic tracks.",
        url: "https://leetcode.com/explore/",
    },
    {
        title: "AtCoder Problems",
        category: "Practice Platforms",
        description: "Problem browser, virtual contests, and targeted drill practice.",
        url: "https://kenkoooo.com/atcoder/",
    },
    {
        title: "GeeksforGeeks DSA",
        category: "DSA",
        description: "Broad concept summaries with examples and practice links.",
        url: "https://www.geeksforgeeks.org/data-structures/",
    },
    {
        title: "CSES Problem Set",
        category: "Practice Platforms",
        description: "High-signal curated problems for core algorithm mastery.",
        url: "https://cses.fi/problemset/",
    },
];

const CATEGORIES = ["All", ...new Set(RESOURCES.map((item) => item.category))];

const Resources = () => {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return RESOURCES.filter((item) => {
            const inCategory = category === "All" || item.category === category;
            const inSearch =
                !term ||
                item.title.toLowerCase().includes(term) ||
                item.description.toLowerCase().includes(term);
            return inCategory && inSearch;
        });
    }, [search, category]);

    return (
        <div className="min-h-screen bg-[#0c1618] pb-12">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <BookOpen size={24} className="text-[#4ecdc4]" />
                        Learning Resources
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Curated coding and competitive programming resources to help you level up.
                    </p>
                </div>

                <div className="bg-linear-to-r from-[#111f22] to-[#0f1c1f] border border-gray-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-[#4ecdc4] font-semibold inline-flex items-center gap-1">
                            <Sparkles size={14} />
                            Curated Stack
                        </p>
                        <p className="text-sm text-gray-300">
                            {filtered.length} resources matched across {CATEGORIES.length - 1} categories.
                        </p>
                    </div>
                    <p className="text-xs text-gray-500 max-w-sm">
                        Use filters to quickly switch from interview prep to contest-grade algorithm references.
                    </p>
                </div>

                <div className="bg-[#111f22] border border-gray-800 rounded-xl p-4 space-y-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search resources..."
                            className="w-full bg-[#0c1618] border border-gray-700 text-white pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:border-[#4ecdc4]"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((item) => {
                            const active = item === category;
                            return (
                                <button
                                    key={item}
                                    onClick={() => setCategory(item)}
                                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${active
                                        ? "bg-[#4ecdc4]/15 border-[#4ecdc4] text-[#4ecdc4]"
                                        : "bg-[#0c1618] border-gray-700 text-gray-400 hover:text-gray-200"
                                        }`}
                                >
                                    {item}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="bg-[#111f22] border border-dashed border-gray-700 rounded-xl p-10 text-center text-gray-400">
                        No resources match your current search.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filtered.map((item) => (
                            <div
                                key={item.title}
                                className="bg-[#111f22] border border-gray-800 rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 hover:border-[#4ecdc4]/40 hover:-translate-y-0.5"
                            >
                                <p className="text-xs uppercase tracking-wide text-[#4ecdc4] font-semibold">
                                    {item.category}
                                </p>
                                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                                <p className="text-sm text-gray-400 flex-1">{item.description}</p>
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-medium text-[#4ecdc4] hover:text-white transition-colors"
                                >
                                    Open Resource
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Resources;
