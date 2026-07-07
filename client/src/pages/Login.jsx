import { useState, useContext } from "react";
import React from 'react'
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import apiClient from "../services/apiClient";
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
            const res = await apiClient.post('/api/auth/login', payload);
            const body = res.data;
            const userData = body.user || body;
            const token = body.token || body.accessToken;

            if (!token) {
                console.warn("No token returned from login response");
            }

            login(userData, token);
            navigate('/dashboard');

        } catch (error) {
            const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || "Login Failed";
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-brand-bg flex font-mono text-xs">
            {/* Left Panel: Social Proof & Product Highlights */}
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

                <div className="z-10 max-w-lg space-y-8">
                    <div className="space-y-3">
                        <h2 className="text-3xl font-light text-white font-geist tracking-tight leading-tight">
                            The telemetry workspace that serious competitive programmers use.
                        </h2>
                        <p className="text-zinc-500 font-sans text-sm leading-relaxed">
                            Aggregate ratings, trace trajectories, and follow structured roadmaps — all in one place.
                        </p>
                    </div>

                    {/* Social proof stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border border-zinc-900 bg-zinc-900/20 rounded p-4 space-y-1">
                            <div className="text-2xl font-bold text-zinc-100 font-mono">12,000+</div>
                            <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Problems tracked</div>
                        </div>
                        <div className="border border-zinc-900 bg-zinc-900/20 rounded p-4 space-y-1">
                            <div className="text-2xl font-bold text-zinc-100 font-mono">3</div>
                            <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Platforms unified</div>
                        </div>
                        <div className="border border-zinc-900 bg-zinc-900/20 rounded p-4 space-y-1">
                            <div className="text-2xl font-bold text-zinc-100 font-mono">Live</div>
                            <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Contest radar</div>
                        </div>
                        <div className="border border-zinc-900 bg-zinc-900/20 rounded p-4 space-y-1">
                            <div className="text-2xl font-bold text-zinc-100 font-mono">AI</div>
                            <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Problem routing</div>
                        </div>
                    </div>

                    {/* Feature callout */}
                    <div className="border-l-2 border-streak pl-4 space-y-1">
                        <p className="text-zinc-300 text-sm font-sans leading-relaxed italic">
                            "Statistics without direction is noise."
                        </p>
                        <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-wider">— Coder's Compass Product Philosophy</p>
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

                        {/* Subtle cold-start footnote — demoted from prominent callout */}
                        <p className="text-[9px] text-zinc-700 font-sans text-center leading-relaxed pt-1 border-t border-zinc-900">
                            Backend on free tier &mdash; first request may take up to 60s if idle.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login;

