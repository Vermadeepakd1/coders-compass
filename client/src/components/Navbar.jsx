import React, { useContext } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Cpu, LogOut, User, LayoutDashboard, CalendarClock, Trophy, BookOpen } from 'lucide-react'

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/contests', label: 'Contests', icon: CalendarClock },
        { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
        { to: '/resources', label: 'Resources', icon: BookOpen },
    ];

    const handleLogout = () => {
        navigate('/', { replace: true });
        setTimeout(() => {
            logout();
        }, 50);
    }

    return (
        <nav className="border-b border-gray-800 bg-[#0c1618]/80 backdrop-blur-lg sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-3 group shrink-0">
                        <div className="p-1.5 rounded bg-linear-to-br from-[#4ecdc4] to-[#0075a2] group-hover:opacity-90 transition-opacity">
                            <Cpu size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight hidden sm:block">Coder's Compass</span>
                    </Link>

                    {user && (
                        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 p-1 rounded-xl border border-gray-800 bg-[#111f22]/95 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.9)]">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.to;

                                return (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                            ? 'bg-[#4ecdc4]/15 text-[#4ecdc4] border border-[#4ecdc4]/30'
                                            : 'text-gray-300 hover:text-white hover:bg-[#0c1618]'
                                            }`}
                                    >
                                        <Icon size={16} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex items-center gap-3 shrink-0">
                        {user ? (
                            <div className="flex items-center gap-2 pl-1">
                                <div className="text-right hidden lg:block">
                                    <p className="text-sm font-medium text-white">{user.username || 'User'}</p>
                                    <p className="text-xs text-gray-500">Member</p>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-linear-to-tr from-gray-700 to-gray-600 border border-gray-500 flex items-center justify-center">
                                    <User size={18} className="text-gray-300" />
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="ml-1 text-gray-500 hover:text-red-400 transition-colors p-1.5 hover:bg-red-500/10 rounded-lg"
                                    title="Logout"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Link to="/login">
                                    <button className="text-gray-300 hover:text-white font-medium text-sm px-3 sm:px-4 py-2 transition-colors">
                                        Login
                                    </button>
                                </Link>
                                <Link to="/register">
                                    <button className="bg-[#4ecdc4] text-[#0c1618] hover:bg-[#4ecdc4]/90 font-medium text-sm px-3 sm:px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_-3px_rgba(78,205,196,0.3)]">
                                        Register
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {user && (
                    <div className="md:hidden pb-3">
                        <div className="mx-auto w-full max-w-md flex items-center justify-center gap-1 p-1 rounded-xl border border-gray-800 bg-[#111f22]">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.to;

                                return (
                                    <Link
                                        key={`mobile-${item.to}`}
                                        to={item.to}
                                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs transition-all ${isActive
                                            ? 'bg-[#4ecdc4]/15 text-[#4ecdc4] border border-[#4ecdc4]/30'
                                            : 'text-gray-300 hover:text-white hover:bg-[#0c1618]'
                                            }`}
                                        title={item.label}
                                        aria-label={item.label}
                                    >
                                        <Icon size={15} />
                                        <span className="hidden sm:inline">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}

export default Navbar
