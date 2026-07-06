import { useState } from "react";
import { getLeetCodeSuggestions } from "../services/platformApi";
import { Compass, Search, ExternalLink, Filter, HelpCircle, Sliders, Cpu } from "lucide-react";

//leetcode problem tags
const TAGS = [
    { label: "Arrays", value: "array" },
    { label: "Dynamic Programming", value: "dynamic-programming" },
    { label: "Strings", value: "string" },
    { label: "Trees", value: "tree" },
    { label: "Graphs", value: "graph" },
    { label: "Hash Table", value: "hash-table" },
    { label: "Binary Search", value: "binary-search" },
    { label: "Two Pointers", value: "two-pointers" },
    { label: "Greedy", value: "greedy" },
    { label: "Stack", value: "stack" },
    { label: "Heap (Priority Queue)", value: "heap-priority-queue" },
    { label: "Backtracking", value: "backtracking" },
    { label: "Bit Manipulation", value: "bit-manipulation" },
    { label: "Linked List", value: "linked-list" },
    { label: "Math", value: "math" },
    { label: "Union Find", value: "union-find" },
    { label: "Trie", value: "trie" },
    { label: "Sliding Window", value: "sliding-window" },
    { label: "Divide and Conquer", value: "divide-and-conquer" },
    { label: "Recursion", value: "recursion" },
    { label: "Segment Tree", value: "segment-tree" },
    { label: "Topological Sort", value: "topological-sort" }
];

const LeetCodeExplorer = () => {
    const [tag, setTag] = useState(TAGS[0].value);
    const [difficulty, setDifficulty] = useState("MEDIUM");
    const [platform, setPlatform] = useState("leetcode");
    const [timeLimit, setTimeLimit] = useState("all");
    const [query, setQuery] = useState("");
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        setLoading(true);
        setProblems([]); // Clear old results
        try {
            // LeetCode active search
            if (platform === "leetcode") {
                const data = await getLeetCodeSuggestions(tag, difficulty);
                // Apply local query filter if exists
                let filtered = data;
                if (query) {
                    filtered = data.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
                }
                setProblems(filtered);
            } else {
                // Codeforces mock suggestion mapping to fit the interactive builder feel
                setTimeout(() => {
                    setProblems([
                        { title: "CF 1800C. Remove Prefix", difficulty: "Medium", acRate: 52.4, titleSlug: "1800/C" },
                        { title: "CF 1650B. DIV + MOD", difficulty: "Easy", acRate: 74.2, titleSlug: "1650/B" },
                        { title: "CF 1920D. Grid Game", difficulty: "Hard", acRate: 31.8, titleSlug: "1920/D" }
                    ]);
                    setLoading(false);
                }, 400);
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (platform === "leetcode") setLoading(false);
        }
    };

    return (
        <div className="card-bordered font-mono text-xs text-zinc-400 border-l-2 border-l-lc/50 flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3 mb-3">
                <h3 className="text-zinc-200 font-semibold tracking-wider flex items-center gap-1.5 font-geist">
                    <Compass size={12} className="text-lc animate-pulse" />
                    Personalized Practice
                </h3>
                <span className="text-[9px] text-ai font-bold bg-ai/5 border border-ai/20 px-2 py-0.5 rounded-sm uppercase font-mono flex items-center gap-1">
                    <Cpu size={9} /> Practice Generator
                </span>
            </div>

            {/* AI Control Suite: Conversational Sentence Builder */}
            <div className="space-y-4 mb-4 bg-zinc-950 p-4 border border-zinc-900 rounded text-zinc-300 leading-relaxed font-sans text-xs">
                
                {/* Search query input */}
                <div className="relative">
                    <Search size={10} className="absolute left-2.5 top-2.5 text-zinc-650" />
                    <input
                        type="text"
                        placeholder="Filter by keyword (e.g. prefix, grid, min...)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-brand-bg border border-zinc-900 text-zinc-200 pl-8 pr-3 py-1.5 rounded text-[11px] focus:outline-none focus:border-zinc-800 font-mono"
                    />
                </div>

                {/* Conversational sentence selector */}
                <div className="pt-2 border-t border-zinc-900/60 leading-loose">
                    I want to practice{' '}
                    <select
                        className="inline-block bg-zinc-900 border border-zinc-850 text-zinc-100 px-1 py-0.5 rounded cursor-pointer focus:outline-none focus:border-zinc-750 font-mono text-[10px] mx-1"
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                    >
                        {TAGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>{' '}
                    problems on{' '}
                    <select
                        className="inline-block bg-zinc-900 border border-zinc-850 text-zinc-100 px-1 py-0.5 rounded cursor-pointer focus:outline-none focus:border-zinc-750 font-mono text-[10px] mx-1"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                    >
                        <option value="leetcode">LeetCode</option>
                        <option value="codeforces">Codeforces</option>
                    </select>{' '}
                    with difficulty{' '}
                    <select
                        className="inline-block bg-zinc-900 border border-zinc-850 text-zinc-100 px-1 py-0.5 rounded cursor-pointer focus:outline-none focus:border-zinc-750 font-mono text-[10px] mx-1"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                    >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                    </select>{' '}
                    targeted under{' '}
                    <select
                        className="inline-block bg-zinc-900 border border-zinc-850 text-zinc-100 px-1 py-0.5 rounded cursor-pointer focus:outline-none focus:border-zinc-750 font-mono text-[10px] mx-1"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(e.target.value)}
                    >
                        <option value="all">no time limit</option>
                        <option value="25">25 minutes</option>
                        <option value="45">45 minutes</option>
                    </select>.
                </div>

                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full py-3 text-[10px] flex items-center justify-center gap-1.5 bg-streak/10 border border-streak/30 text-streak hover:bg-streak/15 hover:border-streak/50 transition-colors font-mono uppercase tracking-wider rounded font-bold"
                >
                    <Sliders size={11} />
                    {loading ? "Compiling plan..." : "✨ Build Today's Practice Plan"}
                </button>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[280px] divide-y divide-zinc-800/40">
                {problems.map((prob, idx) => (
                    <div key={idx} className="pt-2.5 flex justify-between items-center gap-3">
                        <div className="truncate flex-1 space-y-0.5">
                            <div className="text-zinc-200 font-sans text-xs truncate font-medium">{prob.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[9px] uppercase font-bold ${prob.difficulty === 'Easy' ? 'text-growth' :
                                    prob.difficulty === 'Medium' ? 'text-streak' :
                                        'text-loss'
                                    }`}>
                                    {prob.difficulty}
                                </span>
                                <span className="text-[9px] text-zinc-500 font-mono">
                                    Acc: {prob.acRate.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <a
                            href={platform === "leetcode" 
                                ? `https://leetcode.com/problems/${prob.titleSlug}`
                                : `https://codeforces.com/problemset/problem/${prob.titleSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-950 border border-zinc-900 p-1.5 rounded-sm"
                            title="Open Problem"
                        >
                            <ExternalLink size={11} />
                        </a>
                    </div>
                ))}

                {!loading && problems.length === 0 && (
                    <div className="h-24 flex flex-col items-center justify-center text-zinc-650 font-mono text-[9px] uppercase tracking-wider text-center px-4 leading-normal">
                        Configure target filters above <br />
                        and click Generate
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeetCodeExplorer;