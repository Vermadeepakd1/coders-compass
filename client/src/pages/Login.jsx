import { useState, useContext } from "react";
import React from 'react'
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Cpu, MessageSquare, ShieldAlert, ChevronRight } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData((s) => ({ ...s, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError(null);
        if (!formData.email || !formData.password) {
            setError("Email and password are required.");
            return;
        }
        setIsLoading(true);

        const payload = {
            email: formData.email.trim(),
            password: formData.password.trim()
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body.error || body.message || res.statusText || `Status ${res.status}`);
            }
            const userData = body.user || body;
            const token = body.token || body.accessToken;

            if (!token) {
                console.warn("No token returned from login response");
            }

            login(userData, token);
            navigate('/dashboard');

        } catch (error) {
            setError(error.message || "Login Failed");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-brand-bg flex font-mono text-xs">
            {/* Left Panel: Product Promise & Telemetry Simulation (Hidden on small screens) */}
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
                            One telemetry workspace for your <span className="font-semibold text-streak">coding growth</span>.
                        </h2>
                        <p className="text-zinc-500 font-sans text-sm leading-relaxed">
                            Aggregate metrics from LeetCode, Codeforces, and CodeChef. Trace your rating trajectories, leverage AI diagnostics, and compete with peers on a unified matrix.
                        </p>
                    </div>

                    {/* Real dashboard preview cards */}
                    <div className="space-y-4">
                        <div className="border border-zinc-900 bg-zinc-900/20 rounded p-4 space-y-3">
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

                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                            <div className="border border-zinc-900 bg-zinc-900/20 p-3 rounded">
                                <span className="text-zinc-500 uppercase">Codeforces</span>
                                <div className="text-sm font-bold text-cf mt-0.5">2,142 Rating</div>
                                <span className="text-growth font-mono mt-1 block">+45 in Div. 2</span>
                            </div>
                            <div className="border border-zinc-900 bg-zinc-900/20 p-3 rounded">
                                <span className="text-zinc-500 uppercase">LeetCode</span>
                                <div className="text-sm font-bold text-lc mt-0.5">2,845 Rating</div>
                                <span className="text-growth font-mono mt-1 block">Top 0.8% Guardian</span>
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
                <div className="w-full max-w-sm space-y-6">
                    {/* Wordmark (visible on mobile only) */}
                    <div className="lg:hidden">
                        <div className="flex items-center gap-2 mb-1">
                            <Cpu size={16} className="text-zinc-400" />
                            <span className="text-zinc-200 font-semibold text-sm tracking-wider uppercase">Coder's Compass</span>
                        </div>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Sign in to your workspace</p>
                    </div>

                    <div className="border border-brand-border bg-brand-surface rounded p-6 space-y-5">
                        {/* Cold Start Notice */}
                        <div className="bg-zinc-950 border border-zinc-900 rounded p-3 text-[10px]">
                            <p className="text-zinc-300 font-bold uppercase tracking-wider mb-1">Server Cold Start</p>
                            <p className="text-zinc-500 leading-relaxed font-sans">
                                Backend runs on a free tier and sleeps when idle.
                                <span className="text-zinc-300 font-semibold"> First request may take up to 60s.</span>
                            </p>
                        </div>

                        {/* Tab Row */}
                        <div className="flex gap-3 border-b border-zinc-800 pb-3 text-[10px] uppercase tracking-wider font-bold">
                            <button className="text-zinc-200 border-b-2 border-zinc-200 pb-1">Login</button>
                            <button
                                onClick={() => navigate('/register')}
                                className="text-zinc-600 hover:text-zinc-400 pb-1 transition-colors"
                            >
                                Register
                            </button>
                        </div>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block" htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="name@example.com"
                                    className="input-developer w-full"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block" htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="input-developer w-full"
                                />
                            </div>

                            {error && (
                                <div className="p-2.5 border border-brand-danger/30 bg-brand-danger/5 text-brand-danger text-[10px] rounded font-sans">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full flex items-center justify-center gap-1.5 mt-2"
                            >
                                {isLoading ? 'Signing in...' : 'Access Dashboard'}
                                {!isLoading && <ChevronRight size={12} />}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login;

