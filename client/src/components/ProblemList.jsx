import React from 'react';
import { ExternalLink, Target, AlertCircle, Link as LinkIcon, RefreshCw } from 'lucide-react';

const ProblemList = ({ problems, cfHandle }) => {
    // Case 1: No Codeforces Handle Linked
    if (!cfHandle) {
        return (
            <div className="bg-[#111f22] p-8 rounded-xl shadow-lg border border-gray-800 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gray-800/50 rounded-full flex items-center justify-center mb-3">
                    <LinkIcon className="text-blue-400" size={24} />
                </div>
                <h3 className="font-bold text-gray-300 text-lg">Link Codeforces Account</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-xs">
                    Connect your Codeforces handle in settings to get personalized AI recommendations.
                </p>
            </div>
        );
    }

    // Case 2: Error Fetching Recommendations (problems is null)
    if (problems === null) {
        return (
            <div className="bg-[#111f22] p-8 rounded-xl shadow-lg border border-red-900/30 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mb-3">
                    <AlertCircle className="text-red-400" size={24} />
                </div>
                <h3 className="font-bold text-red-400 text-lg">Failed to Load Recommendations</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-xs">
                    We couldn't fetch your recommendations right now. The Codeforces API might be busy.
                </p>
            </div>
        );
    }

    // Case 3: Successfully Fetched but Empty (New User / No Rating)
    if (problems.length === 0) {
        return (
            <div className="bg-[#111f22] p-8 rounded-xl shadow-lg border border-dashed border-gray-700 text-center flex flex-col items-center justify-center">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="font-bold text-gray-300 text-lg">No Recommendations Yet</h3>
                <p className="text-gray-500 text-sm mb-4 max-w-xs">
                    We need more data to generate smart hints. Solve a few problems on Codeforces first!
                </p>
                <a
                    href="https://codeforces.com/problemset"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0c1618] font-semibold hover:opacity-90 bg-[#4ecdc4] px-4 py-2 rounded transition-all"
                >
                    Go to Codeforces &rarr;
                </a>
            </div>
        );
    }

    return (
        <div className="bg-[#111f22] p-6 rounded-xl shadow-lg border border-gray-800">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Target className="text-[#4ecdc4]" size={24} />
                    Recommended Next Steps
                </h3>
                <span className="text-xs font-medium text-gray-500 bg-[#0c1618] px-2 py-1 rounded border border-gray-800">
                    Based on your recent activity
                </span>
            </div>

            <div className="space-y-3">
                {problems.map((prob, idx) => (
                    <div
                        key={`${prob.contestId}-${prob.index}-${idx}`}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#0c1618] rounded-lg border border-gray-800 hover:border-[#4ecdc4]/50 transition-all group"
                    >
                        <div className="mb-3 sm:mb-0">
                            <div className="font-semibold text-gray-200 group-hover:text-[#4ecdc4] transition-colors text-lg flex items-center gap-2">
                                {prob.index}. {prob.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-2">
                                {prob.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="bg-gray-800/50 px-2 py-0.5 rounded text-gray-400 border border-gray-700/50">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Rating</span>
                                <span className="text-sm font-bold text-[#4ecdc4] bg-[#4ecdc4]/10 px-3 py-1 rounded border border-[#4ecdc4]/20">
                                    {prob.rating}
                                </span>
                            </div>
                            <a
                                href={`https://codeforces.com/problemset/problem/${prob.contestId}/${prob.index}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-[#4ecdc4] text-[#0c1618] px-4 py-2 rounded-lg hover:bg-[#3dbdb4] hover:shadow-[0_0_15px_rgba(78,205,196,0.3)] transition-all font-bold text-sm"
                            >
                                Solve <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProblemList;