import React, { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Cpu, LogOut, User, LayoutDashboard } from 'lucide-react'

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/', { replace: true });
        setTimeout(() => {
            logout();
        }, 50);
    }

    return (
        <nav className="border-b border-gray-800 bg-[#0c1618]/80 backdrop-blur-lg sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="p-1.5 rounded bg-linear-to-br from-[#4ecdc4] to-[#0075a2] group-hover:opacity-90 transition-opacity">
                            <Cpu size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">Coder's Compass</span>
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 border border-gray-700">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-xs text-gray-400 font-mono">System Operational</span>
                                </div>

                                <div className="h-6 w-px bg-gray-800 mx-2 hidden md:block"></div>

                                <Link to="/dashboard" className="flex items-center gap-2 text-gray-300 hover:text-[#4ecdc4] transition-colors">
                                    <LayoutDashboard size={18} />
                                    <span className="text-sm font-medium hidden sm:block">Dashboard</span>
                                </Link>

                                <div className="flex items-center gap-3 pl-2">
                                    <div className="text-right hidden md:block">
                                        <p className="text-sm font-medium text-white">{user.username || 'User'}</p>
                                        <p className="text-xs text-gray-500">Member</p>
                                    </div>
                                    <div className="w-9 h-9 rounded-full bg-linear-to-tr from-gray-700 to-gray-600 border border-gray-500 flex items-center justify-center">
                                        <User size={18} className="text-gray-300" />
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="ml-2 text-gray-500 hover:text-red-400 transition-colors p-1.5 hover:bg-red-500/10 rounded-lg"
                                        title="Logout"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/login">
                                    <button className="text-gray-300 hover:text-white font-medium text-sm px-4 py-2 transition-colors">
                                        Login
                                    </button>
                                </Link>
                                <Link to="/register">
                                    <button className="bg-[#4ecdc4] text-[#0c1618] hover:bg-[#4ecdc4]/90 font-medium text-sm px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_-3px_rgba(78,205,196,0.3)]">
                                        Register
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
