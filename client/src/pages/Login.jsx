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
        <div className="min-h-screen bg-[#0c1618] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#4ecdc4] rounded-full mix-blend-screen filter blur-[128px] opacity-10"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#0075a2] rounded-full mix-blend-screen filter blur-[128px] opacity-10"></div>
            </div>

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Cpu size={32} className="text-[#4ecdc4]" />
                        <h1 className="text-3xl font-bold text-white tracking-tight">Coder's Compass</h1>
                    </div>
                    <p className="text-gray-400">Navigate your path to mastery.</p>
                </div>

                <div className="bg-[#111f22] border border-gray-800/50 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-6 border-t-4 border-t-[#4ecdc4]">

                    {/* Cold Start Warning Banner */}
                    <div className="mb-6 bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r shadow-sm">
                        <div className="flex">
                            <div className="shrink-0">
                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-400 font-bold">⚠️ Server Cold Start</p>
                                <p className="text-xs text-blue-300 mt-1">
                                    Because this app runs on a free tier, the backend sleeps when inactive.
                                    <span className="font-bold"> The first login may take up to 60 seconds.</span> Please be patient!
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 border-b border-gray-800 pb-4">
                        <button
                            className="flex-1 pb-2 text-sm font-medium transition-colors text-[#4ecdc4] border-b-2 border-[#4ecdc4]"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="flex-1 pb-2 text-sm font-medium transition-colors text-gray-500 hover:text-gray-300"
                        >
                            Register
                        </button>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="email">Email</label>
                            <div className="relative group">
                                <MessageSquare size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#4ecdc4] transition-colors" />
                                <input
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    className="w-full bg-[#111f22] border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-gray-200 focus:outline-none focus:border-[#4ecdc4] focus:ring-1 focus:ring-[#4ecdc4] transition-all placeholder-gray-600"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="password">Password</label>
                            <div className="relative group">
                                <ShieldAlert size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#4ecdc4] transition-colors" />
                                <input
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="w-full bg-[#111f22] border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-gray-200 focus:outline-none focus:border-[#4ecdc4] focus:ring-1 focus:ring-[#4ecdc4] transition-all placeholder-gray-600"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#4ecdc4] text-[#0c1618] hover:opacity-90 shadow-[0_0_15px_-3px_rgba(78,205,196,0.3)] px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {isLoading ? 'Logging in...' : 'Access Dashboard'}
                            {!isLoading && <ChevronRight size={16} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login
