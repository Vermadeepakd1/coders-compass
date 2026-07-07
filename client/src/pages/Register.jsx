import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { Cpu, User, MessageSquare, ShieldAlert, Terminal, Code, Hash, ChevronRight } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        codeforces: "",
        leetcode: "",
        codechef: ""
    });

    const handleChange = (e) => {
        setFormData((s) => ({ ...s, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            username: formData.username.trim(),
            email: formData.email.trim(),
            password: formData.password.trim(),
            handles: {
                codeforces: formData.codeforces.trim(),
                codechef: formData.codechef.trim(),
                leetcode: formData.leetcode.trim()
            },
        };

        try {
            await apiClient.post('/api/auth/register', payload);
            navigate("/login");
        } catch (error) {
            console.error("Registration error:", error);
            const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || "Registration failed";
            alert(errorMsg);
        }
    };

    return (
        <div className="min-h-screen bg-brand-bg flex font-mono text-xs">
            {/* Left Panel: Product Promise & Features Showcase (Hidden on small screens) */}
            <div className="hidden lg:flex lg:w-7/12 bg-zinc-950 border-r border-brand-border-subtle p-12 flex-col justify-between relative overflow-hidden select-none">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
                    backgroundImage: `radial-gradient(circle, #f4f4f5 1px, transparent 1px)`,
                    backgroundSize: '16px 16px'
                }}></div>

                <div className="z-10 flex items-center gap-2">
                    <div className="p-1 rounded-sm border border-zinc-800 bg-zinc-900">
                        <Cpu size={14} className="text-zinc-300" />
                    </div>
                    <span className="text-sm font-bold text-zinc-100 tracking-tight font-geist lowercase">coder's compass</span>
                </div>

                <div className="z-10 max-w-lg space-y-6">
                    <div className="space-y-3">
                        <h2 className="text-3xl font-light text-white font-geist tracking-tight leading-tight">
                            Track. Compare. <span className="font-semibold text-streak">Excel</span>.
                        </h2>
                        <p className="text-zinc-500 font-sans text-sm leading-relaxed">
                            Join competitive programmers worldwide who track their progress using unified telemetry. Gain insights into your strengths and weaknesses automatically.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-sm border border-zinc-800 bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-300 font-bold shrink-0">1</div>
                            <div>
                                <h4 className="text-[11px] font-bold text-zinc-200">Unified Analytics Dashboard</h4>
                                <p className="text-[10px] text-zinc-500 font-sans leading-normal">Interactive heatmaps, rating graphs, and solved counts all synced automatically.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-sm border border-zinc-800 bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-300 font-bold shrink-0">2</div>
                            <div>
                                <h4 className="text-[11px] font-bold text-zinc-200">Upcoming Contest Feed</h4>
                                <p className="text-[10px] text-zinc-500 font-sans leading-normal">Live countdowns and calendar reminders for rated rounds across all major platforms.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-sm border border-zinc-800 bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-300 font-bold shrink-0">3</div>
                            <div>
                                <h4 className="text-[11px] font-bold text-zinc-200">AI Coach & Recommendations</h4>
                                <p className="text-[10px] text-zinc-500 font-sans leading-normal">Intelligent diagnostic feedback tailored to your weak points, plus high-signal practice problems.</p>
                            </div>
                        </div>

                        {/* Consistency preview card */}
                        <div className="border border-zinc-900 bg-zinc-900/20 rounded p-4 space-y-3 mt-4">
                            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Consistency Tracker</span>
                                <span className="text-streak font-bold flex items-center gap-1">🔥 12 days</span>
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {[1, 3, 0, 5, 8, 3, 5, 0, 1, 8, 5, 3, 0, 1].map((cnt, idx) => {
                                    const colors = {
                                        0: "bg-zinc-900",
                                        1: "bg-amber-950/70",
                                        3: "bg-amber-800/70",
                                        5: "bg-orange-700/80",
                                        8: "bg-streak"
                                    };
                                    return <div key={idx} className={`h-3 rounded-sm ${colors[cnt]}`} />;
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="z-10 text-[10px] text-zinc-600">
                    &copy; {new Date().getFullYear()} Coder's Compass. Designed for competitive programmers.
                </div>
            </div>

            {/* Right Panel: Clean form */}
            <div className="w-full lg:w-5/12 flex items-center justify-center p-8 bg-brand-bg">
                <div className="w-full max-w-sm space-y-6 my-8">
                    {/* Wordmark (visible on mobile only) */}
                    <div className="lg:hidden">
                        <div className="flex items-center gap-2 mb-1">
                            <Cpu size={16} className="text-zinc-400" />
                            <span className="text-zinc-200 font-semibold text-sm tracking-wider uppercase">Coder's Compass</span>
                        </div>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Create your workspace</p>
                    </div>

                    <div className="border border-brand-border bg-brand-surface rounded p-6 space-y-5">
                        {/* Tab Row */}
                        <div className="flex gap-3 border-b border-zinc-800 pb-3 text-[10px] uppercase tracking-wider font-bold">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-zinc-600 hover:text-zinc-400 pb-1 transition-colors"
                            >
                                Login
                            </button>
                            <button className="text-zinc-200 border-b-2 border-zinc-200 pb-1">Register</button>
                        </div>

                        <form className="space-y-3.5" onSubmit={handleSubmit}>
                            {/* Core fields */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block" htmlFor="username">Username</label>
                                <input id="username" name="username" value={formData.username} onChange={handleChange} type="text" required placeholder="username" className="input-developer w-full" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block" htmlFor="email">Email</label>
                                <input id="email" name="email" value={formData.email} onChange={handleChange} type="email" required placeholder="name@example.com" className="input-developer w-full" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block" htmlFor="password">Password</label>
                                <input id="password" name="password" value={formData.password} onChange={handleChange} type="password" required placeholder="••••••••" className="input-developer w-full" />
                            </div>

                            {/* Platform handles */}
                            <div className="space-y-3 pt-3 border-t border-zinc-800">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Link Profiles <span className="text-zinc-700 font-normal normal-case">(optional)</span></p>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block" htmlFor="codeforces">Codeforces Handle</label>
                                    <input id="codeforces" name="codeforces" value={formData.codeforces} onChange={handleChange} type="text" placeholder="tourist" className="input-developer w-full" />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block" htmlFor="codechef">CodeChef Handle</label>
                                    <input id="codechef" name="codechef" value={formData.codechef} onChange={handleChange} type="text" placeholder="gennady" className="input-developer w-full" />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block" htmlFor="leetcode">LeetCode Handle</label>
                                    <input id="leetcode" name="leetcode" value={formData.leetcode} onChange={handleChange} type="text" placeholder="neal_wu" className="input-developer w-full" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary w-full flex items-center justify-center gap-1.5 mt-2"
                            >
                                Create Account <ChevronRight size={12} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register;

