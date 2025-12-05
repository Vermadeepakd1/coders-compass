import { useState } from "react";
import { getLeetCodeSuggestions } from "../services/platformApi";
import { Compass, Search, ExternalLink, Filter } from "lucide-react";

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
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        setLoading(true);
        setProblems([]); // Clear old results
        try {
            const data = await getLeetCodeSuggestions(tag, difficulty);
            setProblems(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#111f22] p-6 rounded-xl shadow-lg border border-gray-800 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Compass className="text-[#4ecdc4]" size={24} />
                    LeetCode Explorer
                </h3>
                <span className="text-xs font-medium text-gray-500 bg-[#0c1618] px-2 py-1 rounded border border-gray-800">
                    Discover Problems
                </span>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 mb-6 bg-[#0c1618] p-4 rounded-lg border border-gray-800">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block tracking-wider">Topic</label>
                        <div className="relative">
                            <select
                                className="w-full bg-[#111f22] border border-gray-700 text-gray-200 pl-2 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:border-[#4ecdc4] appearance-none cursor-pointer truncate"
                                value={tag}
                                onChange={(e) => setTag(e.target.value)}
                            >
                                {TAGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block tracking-wider">Difficulty</label>
                        <div className="relative">
                            <select
                                className="w-full bg-[#111f22] border border-gray-700 text-gray-200 pl-2 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:border-[#4ecdc4] appearance-none cursor-pointer"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                            >
                                <option value="EASY">Easy</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HARD">Hard</option>
                            </select>
                            <div className={`absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none ${difficulty === 'EASY' ? 'bg-green-500' : difficulty === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full bg-[#4ecdc4] text-[#0c1618] font-bold py-2.5 rounded-lg hover:bg-[#3dbdb4] hover:shadow-[0_0_15px_rgba(78,205,196,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-[#0c1618] border-t-transparent rounded-full animate-spin"></span>
                            Searching...
                        </>
                    ) : (
                        <>
                            <Search size={18} />
                            Find Problems
                        </>
                    )}
                </button>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 thin-scrollbar">
                {problems.map((prob, idx) => (
                    <div key={idx} className="group flex justify-between items-center p-3 bg-[#0c1618] rounded-lg border border-gray-800 hover:border-[#4ecdc4]/50 transition-all">
                        <div className="truncate mr-3 flex-1">
                            <div className="font-medium text-gray-200 truncate group-hover:text-[#4ecdc4] transition-colors text-sm">{prob.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${prob.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                    prob.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                        'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}>
                                    {prob.difficulty}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                    Acc: {prob.acRate.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <a
                            href={`https://leetcode.com/problems/${prob.titleSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 p-2 bg-[#111f22] text-gray-400 rounded-lg hover:bg-[#4ecdc4] hover:text-[#0c1618] transition-all border border-gray-700 hover:border-[#4ecdc4]"
                        >
                            <ExternalLink size={16} />
                        </a>
                    </div>
                ))}

                {!loading && problems.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 py-8 opacity-50">
                        <Search size={48} className="mb-2" />
                        <p className="text-sm">Select filters and hit search!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeetCodeExplorer;