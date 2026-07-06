import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ChevronRight, TrendingUp, Flame, Sparkles, Target, 
    Calendar, Trophy, BookOpen, Clock, Play, Brain, Globe
} from 'lucide-react'

const HeroPage = () => {
    const navigate = useNavigate();

    // Interactive demo states
    const [simulatedPlatform, setSimulatedPlatform] = useState("codeforces");
    const [timeLeft, setTimeLeft] = useState({ h: 14, m: 32, s: 5 });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.s > 0) return { ...prev, s: prev.s - 1 };
                if (prev.m > 0) return { ...prev, m: 59, s: 59 };
                if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
                return { h: 0, m: 0, s: 0 };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-brand-bg text-zinc-100 overflow-x-hidden relative font-sans">
            
            {/* Ambient Background Glows */}
            <div className="absolute top-[8%] left-[-15%] w-[500px] h-[500px] rounded-full bg-cf/5 blur-[140px] pointer-events-none select-none"></div>
            <div className="absolute top-[35%] right-[-15%] w-[500px] h-[500px] rounded-full bg-lc/5 blur-[140px] pointer-events-none select-none"></div>

            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.01] pointer-events-none select-none" style={{
                backgroundImage: `radial-gradient(circle, #f4f4f5 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
            }}></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28 pb-32">

                {/* ═══════════════════════════════════════════════
                    1. HERO SECTION: Powerful Hook & Dashboard Mockup
                    ═══════════════════════════════════════════════ */}
                <header className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-16 md:pt-24">
                    <div className="lg:col-span-5 space-y-6 text-left">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-streak animate-pulse"></span>
                            <span>Unified Telemetry Suite</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white font-geist leading-tight">
                            The personal <span className="font-semibold text-white">operating system</span> for competitive programmers.
                        </h1>

                        <p className="text-zinc-400 leading-relaxed font-sans text-sm max-w-lg">
                            Unify your ratings, consistency streaks, and practice roadmaps from Codeforces, LeetCode, and CodeChef. Analyze target problem gaps, track deltas, and access guided schedules in a unified workspace.
                        </p>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                            <button
                                onClick={() => navigate('/register')}
                                className="btn-primary flex items-center justify-center gap-1.5 text-xs py-2.5 px-6"
                            >
                                Start Tracking My Progress <ChevronRight size={14} />
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-secondary text-xs py-2.5 px-6"
                            >
                                Access My Dashboard
                            </button>
                        </div>
                    </div>

                    {/* High-Fidelity Product UI Mockup - Replicating the real dashboard */}
                    <div className="lg:col-span-7 space-y-4 animate-entry select-none">
                        <div className="border border-zinc-800 bg-brand-surface rounded-lg p-5 shadow-2xl space-y-4 font-mono text-[10px]">
                            
                            {/* Dashboard Header Bar */}
                            <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-streak animate-pulse" />
                                    <span className="text-zinc-200 font-bold font-geist text-xs">Deepak's Telemetry Workspace</span>
                                </div>
                                <div className="text-zinc-500 font-bold bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded-sm">
                                    12 day streak
                                </div>
                            </div>

                            {/* Since Your Last Visit widget */}
                            <div className="bg-zinc-950/40 border border-zinc-900 p-3 rounded space-y-2">
                                <div className="text-zinc-300 font-geist font-semibold flex items-center gap-1.5">
                                    <span>✨</span> Since your last visit
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[9px] text-zinc-500">
                                    <div className="flex items-center gap-1.5 bg-zinc-900/10 px-2 py-1 border border-zinc-950 rounded-sm">
                                        <span className="w-1 h-1 rounded-full bg-cf" />
                                        <span>CF rating refreshed: +45 delta</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-zinc-900/10 px-2 py-1 border border-zinc-950 rounded-sm">
                                        <span className="w-1 h-1 rounded-full bg-ai" />
                                        <span>AI found 3 recommendations</span>
                                    </div>
                                </div>
                            </div>

                            {/* Milestone goal progress */}
                            <div className="space-y-1.5 bg-zinc-950/20 border border-zinc-900 p-3 rounded">
                                <div className="flex justify-between text-[8px] text-zinc-500 uppercase tracking-widest">
                                    <span>Goal: Reach Knight</span>
                                    <span className="text-zinc-400">1900 → 2000</span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                                    <div className="h-full bg-streak rounded-full" style={{ width: "75%" }} />
                                </div>
                                <div className="flex justify-between text-[8px] text-zinc-650">
                                    <span>75% complete</span>
                                    <span>Estimated 3 contests remaining</span>
                                </div>
                            </div>

                            {/* 3 Platform Narrative Preview Cards */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="border border-cf/20 bg-zinc-950/40 rounded p-2.5 space-y-2">
                                    <div className="flex justify-between text-[8px] text-zinc-500 font-bold border-b border-zinc-900 pb-1">
                                        <span>Codeforces</span>
                                        <span className="text-cf">expert</span>
                                    </div>
                                    <div className="text-lg font-bold text-cf leading-none">2,142</div>
                                    <div className="text-[8px] text-zinc-650">Milestone: Candidate Master</div>
                                </div>

                                <div className="border border-lc/20 bg-zinc-950/40 rounded p-2.5 space-y-2">
                                    <div className="flex justify-between text-[8px] text-zinc-500 font-bold border-b border-zinc-900 pb-1">
                                        <span>LeetCode</span>
                                        <span className="text-lc">guardian</span>
                                    </div>
                                    <div className="text-lg font-bold text-lc leading-none">2,845</div>
                                    <div className="text-[8px] text-zinc-650">Top 0.8% Percentile</div>
                                </div>

                                <div className="border border-cc/20 bg-zinc-950/40 rounded p-2.5 space-y-2">
                                    <div className="flex justify-between text-[8px] text-zinc-500 font-bold border-b border-zinc-900 pb-1">
                                        <span>CodeChef</span>
                                        <span className="text-cc">5 star</span>
                                    </div>
                                    <div className="text-lg font-bold text-cc leading-none">2,390</div>
                                    <div className="text-[8px] text-zinc-650">Milestone: 6 Star Division</div>
                                </div>
                            </div>

                        </div>
                    </div>
                </header>

                {/* ═══════════════════════════════════════════════
                    2. TRUST SECTION: Integrated Aggregators
                    ═══════════════════════════════════════════════ */}
                <section className="border-y border-brand-border-subtle py-8 text-center space-y-6">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Connected Platforms & Telemetry Sync</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-zinc-300">LeetCode GraphQL</span>
                            <span className="text-[9px] text-growth font-mono">Synced</span>
                        </div>
                        <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-zinc-300">Codeforces API</span>
                            <span className="text-[9px] text-growth font-mono">Synced</span>
                        </div>
                        <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-zinc-300">CodeChef Web Scraping</span>
                            <span className="text-[9px] text-growth font-mono">Synced</span>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════
                    3. THE EXPERIENCE: Alternate Real UI Sections
                    ═══════════════════════════════════════════════ */}
                <section className="space-y-28">

                    {/* Trajectory */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-5 space-y-4">
                            <div className="w-6 h-6 rounded bg-cf/10 flex items-center justify-center">
                                <TrendingUp size={14} className="text-cf" />
                            </div>
                            <h3 className="text-3xl font-light text-white font-geist leading-tight">
                                Trace your <span className="font-semibold text-cf">Ratings trajectory</span>.
                            </h3>
                            <p className="text-zinc-400 text-sm leading-relaxed font-sans">
                                Monitor your ranking delta in real time. Our unified engine overlay charts your latest contest scores from multiple platforms, displaying performance changes instantly.
                            </p>
                        </div>
                        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-lg p-5 font-mono text-[10px] space-y-4 shadow-xl">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                <span className="text-zinc-300 font-bold uppercase">TRAJECTORY_SIMULATOR</span>
                                <span className="text-zinc-600">STABLE</span>
                            </div>
                            <div className="h-32 flex items-end gap-2 pt-6 relative border-b border-l border-zinc-800">
                                <div className="absolute inset-0 flex flex-col justify-between py-2 opacity-[0.05]">
                                    <div className="border-b border-white" />
                                    <div className="border-b border-white" />
                                    <div className="border-b border-white" />
                                </div>
                                <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <path d="M 0 80 Q 25 50, 50 40 T 100 15" fill="none" stroke="#3b82f6" strokeWidth="2" />
                                    <path d="M 0 90 Q 30 70, 60 40 T 100 30" fill="none" stroke="#f97316" strokeWidth="2" />
                                </svg>
                                <div className="absolute left-[30%] bottom-[45%] w-2 h-2 rounded-full bg-cf" />
                                <div className="absolute left-[70%] bottom-[65%] w-2 h-2 rounded-full bg-lc" />
                            </div>
                        </div>
                    </div>

                    {/* AI problem Recommendations */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-5 lg:order-2 space-y-4 text-left">
                            <div className="w-6 h-6 rounded bg-ai/10 flex items-center justify-center">
                                <Sparkles size={14} className="text-ai" />
                            </div>
                            <h3 className="text-3xl font-light text-white font-geist leading-tight">
                                Targeted <span className="font-semibold text-ai">AI problem routing</span>.
                            </h3>
                            <p className="text-zinc-400 text-sm leading-relaxed font-sans">
                                Avoid practice stagnation. The companion advisor analyzes your telemetry history to locate weak algorithm zones—suggesting specific problems to push your capabilities.
                            </p>
                        </div>
                        <div className="lg:col-span-7 lg:order-1 bg-zinc-900 border border-zinc-800 rounded-lg p-5 font-mono text-[10px] space-y-3 shadow-xl">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                <span className="text-ai font-bold uppercase">COACH_RECOMMENDATION_STREAM</span>
                                <span className="text-zinc-500">DIAGNOSTIC_READY</span>
                            </div>
                            <div className="space-y-2">
                                <div className="border border-zinc-800 bg-zinc-950 p-3 rounded flex justify-between items-center">
                                    <div className="space-y-1">
                                        <div className="text-zinc-200 font-sans text-xs">1800C. Remove Prefix</div>
                                        <div className="text-[9px] text-zinc-500">Codeforces • dynamic programming</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-cf bg-cf/5 border border-cf/20 px-2 py-0.5 rounded-sm">1600 Rating</span>
                                </div>
                                <div className="border border-zinc-800 bg-zinc-950 p-3 rounded flex justify-between items-center">
                                    <div className="space-y-1">
                                        <div className="text-zinc-200 font-sans text-xs">743. Network Delay Time</div>
                                        <div className="text-[9px] text-zinc-500">LeetCode • graphs</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-lc bg-lc/5 border border-lc/20 px-2 py-0.5 rounded-sm">Medium Diff</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Contest countdown radar */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-5 space-y-4 text-left">
                            <div className="w-6 h-6 rounded bg-contest/10 flex items-center justify-center">
                                <Calendar size={14} className="text-contest" />
                            </div>
                            <h3 className="text-3xl font-light text-white font-geist leading-tight">
                                Upcoming <span className="font-semibold text-contest">Contest Radar</span>.
                            </h3>
                            <p className="text-zinc-400 text-sm leading-relaxed font-sans">
                                Never miss a rated round. Live countdown clocks, duration indexes, and automated Google Calendar integration ensure you are registered and prepared.
                            </p>
                        </div>
                        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-lg p-5 font-mono text-[10px] space-y-4 shadow-xl">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                <span className="text-contest font-bold uppercase">NEXT_UPCOMING_CONTEST</span>
                                <span className="text-zinc-500">COUNTER_ACTIVE</span>
                            </div>
                            <div className="flex justify-between items-center bg-zinc-950 p-4 rounded border border-zinc-850">
                                <div>
                                    <span className="text-[9px] font-bold text-cf bg-cf/5 border border-cf/20 px-2 py-0.5 rounded-sm">Codeforces</span>
                                    <h4 className="text-xs font-bold text-zinc-200 mt-2">Codeforces Round 924 (Div. 2)</h4>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-zinc-300 font-mono tracking-wider">
                                        {String(timeLeft.h).padStart(2, "0")}:{String(timeLeft.m).padStart(2, "0")}:{String(timeLeft.s).padStart(2, "0")}
                                    </div>
                                    <span className="text-[8px] text-zinc-600 uppercase mt-1 block">starts in</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════
                    4. WHY USERS RETURN DAILY
                    ═══════════════════════════════════════════════ */}
                <section className="space-y-8 border-t border-zinc-900/60 pt-16">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-light text-white font-geist">Built for daily pacing</h2>
                        <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Why programmers return</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="card-bordered p-6 space-y-3">
                            <Flame className="text-streak" size={16} />
                            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest font-mono">Streak preservation</h4>
                            <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                                Keep the momentum going. A consolidated multi-platform streak encourages you to solve at least one target question every 24 hours.
                            </p>
                        </div>
                        <div className="card-bordered p-6 space-y-3">
                            <Trophy className="text-achievement" size={16} />
                            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest font-mono">Weekly Recap</h4>
                            <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                                Receive structured reviews detailing rating spikes, solved problem targets, and custom achievements unlocked throughout the week.
                            </p>
                        </div>
                        <div className="card-bordered p-6 space-y-3">
                            <Brain className="text-cc" size={16} />
                            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest font-mono">Skill deltas</h4>
                            <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                                Inspect how every contest rank shifts your aggregate diagnostics. Make skill improvements feel tangible.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════
                    5. PRODUCT PHILOSOPHY
                    ═══════════════════════════════════════════════ */}
                <section className="max-w-4xl mx-auto text-center py-20 border-t border-b border-zinc-900 my-12 bg-gradient-to-b from-zinc-950/20 to-transparent rounded-sm px-6">
                    <div className="max-w-2xl mx-auto space-y-6">
                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest block font-bold">Product Philosophy</span>
                        <h2 className="text-4xl sm:text-5xl font-light text-white font-geist tracking-tight leading-tight">
                            "Statistics without <br />
                            <span className="font-semibold text-streak bg-gradient-to-r from-streak to-amber-400 bg-clip-text text-transparent">direction</span> is noise."
                        </h2>
                        <p className="text-xs text-zinc-500 leading-relaxed font-sans max-w-lg mx-auto">
                            Coder's Compass exists because deliberate practice is hard. We replace scattered spreadsheets and tabs with an automated telemetry workspace so you can focus entirely on coding growth.
                        </p>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════
                    6. FINAL CTA
                    ═══════════════════════════════════════════════ */}
                <section className="card-bordered text-center py-16 space-y-6 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.01] pointer-events-none" style={{
                        backgroundImage: `radial-gradient(circle, #f97316 1.5px, transparent 1.5px)`,
                        backgroundSize: '16px 16px'
                    }}></div>

                    <div className="max-w-lg mx-auto space-y-4">
                        <h2 className="text-3xl font-light text-white font-geist tracking-tight">
                            Stop context switching. <br />
                            <span className="font-semibold">Start growing.</span>
                        </h2>
                        <p className="text-zinc-500 font-sans text-xs">
                            Unify your telemetry workspace today.
                        </p>
                        <div className="pt-4">
                            <button
                                onClick={() => navigate('/register')}
                                className="btn-primary inline-flex items-center gap-1.5 px-6 py-2.5 text-xs uppercase tracking-widest"
                            >
                                Get Started <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-brand-border-subtle pt-12 flex flex-col sm:flex-row items-center justify-between text-zinc-600 text-[10px] font-mono uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <Globe size={11} className="text-zinc-700" />
                        <span>OPERATIONAL COMPILER</span>
                    </div>
                    <p>&copy; {new Date().getFullYear()} Coder's Compass. Built for competitive programming.</p>
                </footer>

            </div>
        </div>
    )
}

export default HeroPage;
