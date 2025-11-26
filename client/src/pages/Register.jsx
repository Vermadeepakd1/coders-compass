import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
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
            const res = await fetch('http://localhost:5000/api/auth/register', {
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

            navigate("/login");

        } catch (error) {
            console.error("Registration error:", error);
            alert(error.message || "Registration failed");
        }
    };

    return (
        <div className="min-h-screen bg-[#0c1618] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#4ecdc4] rounded-full mix-blend-screen filter blur-[128px] opacity-10"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#0075a2] rounded-full mix-blend-screen filter blur-[128px] opacity-10"></div>
            </div>

            <div className="w-full max-w-md z-10 my-8">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Cpu size={32} className="text-[#4ecdc4]" />
                        <h1 className="text-3xl font-bold text-white tracking-tight">Coder's Compass</h1>
                    </div>
                    <p className="text-gray-400">Start your journey to mastery.</p>
                </div>

                <div className="bg-[#111f22] border border-gray-800/50 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-6 border-t-4 border-t-[#4ecdc4]">
                    <div className="flex gap-4 border-b border-gray-800 pb-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="flex-1 pb-2 text-sm font-medium transition-colors text-gray-500 hover:text-gray-300"
                        >
                            Login
                        </button>
                        <button
                            className="flex-1 pb-2 text-sm font-medium transition-colors text-[#4ecdc4] border-b-2 border-[#4ecdc4]"
                        >
                            Register
                        </button>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="username">Username</label>
                            <div className="relative group">
                                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#4ecdc4] transition-colors" />
                                <input
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    type="text"
                                    required
                                    placeholder="dev_master"
                                    className="w-full bg-[#111f22] border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-gray-200 focus:outline-none focus:border-[#4ecdc4] focus:ring-1 focus:ring-[#4ecdc4] transition-all placeholder-gray-600"
                                />
                            </div>
                        </div>

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
                                    placeholder="••••••••"
                                    className="w-full bg-[#111f22] border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-gray-200 focus:outline-none focus:border-[#4ecdc4] focus:ring-1 focus:ring-[#4ecdc4] transition-all placeholder-gray-600"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-gray-800 mt-4">
                            <p className="text-xs text-gray-500 font-medium">LINK YOUR PROFILES (OPTIONAL)</p>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="codeforces">Codeforces Handle</label>
                                <div className="relative group">
                                    <Terminal size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#4ecdc4] transition-colors" />
                                    <input
                                        id="codeforces"
                                        name="codeforces"
                                        value={formData.codeforces}
                                        onChange={handleChange}
                                        type="text"
                                        placeholder="tourist"
                                        className="w-full bg-[#111f22] border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-gray-200 focus:outline-none focus:border-[#4ecdc4] focus:ring-1 focus:ring-[#4ecdc4] transition-all placeholder-gray-600"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="codechef">Codechef Handle</label>
                                <div className="relative group">
                                    <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#4ecdc4] transition-colors" />
                                    <input
                                        id="codechef"
                                        name="codechef"
                                        value={formData.codechef}
                                        onChange={handleChange}
                                        type="text"
                                        placeholder="gennady"
                                        className="w-full bg-[#111f22] border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-gray-200 focus:outline-none focus:border-[#4ecdc4] focus:ring-1 focus:ring-[#4ecdc4] transition-all placeholder-gray-600"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="leetcode">Leetcode Handle</label>
                                <div className="relative group">
                                    <Code size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#4ecdc4] transition-colors" />
                                    <input
                                        id="leetcode"
                                        name="leetcode"
                                        value={formData.leetcode}
                                        onChange={handleChange}
                                        type="text"
                                        placeholder="neal_wu"
                                        className="w-full bg-[#111f22] border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-gray-200 focus:outline-none focus:border-[#4ecdc4] focus:ring-1 focus:ring-[#4ecdc4] transition-all placeholder-gray-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[#4ecdc4] text-[#0c1618] hover:opacity-90 shadow-[0_0_15px_-3px_rgba(78,205,196,0.3)] px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 mt-6"
                        >
                            Start Your Journey <ChevronRight size={16} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Register
