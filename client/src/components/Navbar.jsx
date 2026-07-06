import React, { useContext, useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Cpu, LogOut, User, LayoutDashboard, CalendarClock, Trophy, BookOpen, Flame, Search, Command } from 'lucide-react'

const Navbar = ({ streak }) => {
    const { user, logout } = useContext(AuthContext);
    const activeStreak = streak !== undefined ? streak : (user?.streak || 0);
    const navigate = useNavigate();
    const location = useLocation();

    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const paletteRef = useRef(null);

    const navItems = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, keywords: 'home analytics stats problems' },
        { to: '/contests', label: 'Contests', icon: CalendarClock, keywords: 'calendar round register scheduling timing' },
        { to: '/leaderboard', label: 'Leaderboard', icon: Trophy, keywords: 'rank score competition users spikes' },
        { to: '/resources', label: 'Resources', icon: BookOpen, keywords: 'learning roadmaps articles links documentation' },
    ];

    // Listen for Ctrl+K / Cmd+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsPaletteOpen(prev => !prev);
                setSearchQuery("");
            }
            if (e.key === 'Escape') {
                setIsPaletteOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Close palette when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (paletteRef.current && !paletteRef.current.contains(e.target)) {
                setIsPaletteOpen(false);
            }
        };
        if (isPaletteOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isPaletteOpen]);

    const handleLogout = () => {
        setIsPaletteOpen(false);
        navigate('/', { replace: true });
        setTimeout(() => { logout(); }, 50);
    };

    const handleSelectOption = (to) => {
        setIsPaletteOpen(false);
        navigate(to);
    };

    const filteredItems = navItems.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keywords.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <nav className="border-b border-brand-border bg-brand-bg sticky top-0 z-40 font-mono">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 gap-4">

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 shrink-0 group">
                            <div className="p-1 rounded-sm border border-zinc-800 bg-zinc-950 group-hover:border-zinc-700 transition-colors">
                                <Cpu size={13} className="text-zinc-400" />
                            </div>
                            <span className="text-sm font-bold text-zinc-100 tracking-tight font-geist lowercase hidden sm:block">
                                coder's compass
                            </span>
                        </Link>

                        {/* Desktop Nav Links */}
                        {user && (
                            <div className="hidden md:flex items-center gap-1 ml-4 mr-auto">
                                {navItems.map((item) => {
                                    const isActive = location.pathname === item.to;
                                    return (
                                        <Link
                                            key={item.to}
                                            to={item.to}
                                            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm transition-all duration-150 ${
                                                isActive
                                                    ? 'text-white bg-zinc-950 border border-zinc-800 font-extrabold shadow-[0_1px_5px_rgba(255,255,255,0.05)]'
                                                    : 'text-zinc-450 hover:text-zinc-200 border border-transparent'
                                            }`}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                        {/* Right: Search / Streak & User Profiles */}
                        <div className="flex items-center gap-4 ml-auto shrink-0">
                            {user && (
                                <button 
                                    onClick={() => { setIsPaletteOpen(true); setSearchQuery(""); }}
                                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-[10px] bg-zinc-950 border border-zinc-900 px-2.5 py-1.5 rounded-sm transition-colors font-mono"
                                    title="Open Search Palette"
                                >
                                    <Search size={10} />
                                    <span className="hidden sm:inline">Search</span>
                                    <kbd className="text-[8px] bg-zinc-900 text-zinc-650 px-1 rounded-sm border border-zinc-800 flex items-center gap-0.5">
                                        <Command size={7} />
                                        <span>K</span>
                                    </kbd>
                                </button>
                            )}

                            {activeStreak > 0 && (
                                <div className="flex items-center gap-1">
                                    <Flame size={12} className="text-streak animate-pulse" />
                                    <span className="text-[11px] font-bold text-streak font-mono">{activeStreak}d</span>
                                </div>
                            )}

                            {user ? (
                                <>
                                    <div className="flex items-center gap-2 text-zinc-400 text-xs">
                                        <User size={12} className="text-zinc-600" />
                                        <span className="font-semibold text-zinc-300 tracking-tight lowercase hidden sm:inline">
                                            {user.username}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="text-zinc-600 hover:text-zinc-300 transition-colors p-1"
                                        title="Logout"
                                    >
                                        <LogOut size={13} />
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link to="/login">
                                        <button className="text-[11px] text-zinc-400 hover:text-zinc-100 font-medium px-3 py-1.5 uppercase tracking-widest transition-colors">
                                            Login
                                        </button>
                                    </Link>
                                    <Link to="/register">
                                        <button className="btn-primary text-[11px] py-1.5">
                                            Register
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile nav row */}
                    {user && (
                        <div className="md:hidden pb-2 border-t border-zinc-900 mt-0">
                            <div className="flex items-center justify-around pt-2">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.to;
                                    return (
                                        <Link
                                            key={`mob-${item.to}`}
                                            to={item.to}
                                            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[9px] uppercase tracking-widest transition-colors ${
                                                isActive ? 'text-zinc-100' : 'text-zinc-500'
                                            }`}
                                        >
                                            <Icon size={14} />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Global Search Palette Backdrop */}
            {isPaletteOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-start justify-center pt-[15vh] px-4">
                    <div 
                        ref={paletteRef} 
                        className="bg-brand-surface border border-zinc-800 w-full max-w-lg rounded p-4 space-y-4 shadow-xl animate-entry font-mono"
                    >
                        <div className="relative flex items-center">
                            <Search size={14} className="absolute left-3 text-zinc-500" />
                            <input 
                                type="text"
                                placeholder="Jump to Dashboard, Contests, Leaderboard..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                                className="w-full bg-zinc-950 border border-zinc-900 rounded py-2 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-800 transition-colors"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="text-[8px] text-zinc-600 uppercase tracking-widest font-bold px-2">Navigation Shortcuts</div>
                            <div className="space-y-0.5 max-h-[220px] overflow-y-auto">
                                {filteredItems.length > 0 ? (
                                    filteredItems.map(item => {
                                        const Icon = item.icon;
                                        return (
                                            <button
                                                key={item.to}
                                                onClick={() => handleSelectOption(item.to)}
                                                className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-sm hover:bg-zinc-950 border border-transparent hover:border-zinc-900 group transition-all text-xs"
                                            >
                                                <div className="flex items-center gap-2.5 text-zinc-300 group-hover:text-white">
                                                    <Icon size={12} className="text-zinc-500 group-hover:text-zinc-300" />
                                                    <span>{item.label}</span>
                                                </div>
                                                <kbd className="text-[8px] text-zinc-700 font-bold group-hover:text-zinc-500 uppercase">↵ Jump</kbd>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-6 text-zinc-600 text-xs font-sans">
                                        No navigation options match "{searchQuery}"
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-zinc-900 pt-3 text-[9px] text-zinc-650">
                            <span>Press <kbd className="bg-zinc-950 px-1 rounded-sm border border-zinc-900">ESC</kbd> to close</span>
                            <span>Coder's Compass Omnisearch</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
