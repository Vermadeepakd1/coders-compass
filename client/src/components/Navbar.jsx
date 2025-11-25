import React, { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        console.log('Navbar.handleLogout: calling logout()');
        navigate('/', { replace: true });
        setTimeout(() => {
            console.log('Navbar.handleLogout: now calling logout()');
            logout();
        }, 50);
    }

    return (
        <nav>
            <div className="logo">
                <Link to="/">Coder's Compass</Link>
            </div>
            {user ? (
                <>
                    <Link to="/dashboard">
                        <button type="button">Dashboard</button>
                    </Link>

                    <button type="button" onClick={handleLogout}>
                        Logout
                    </button>
                </>
            ) : (
                <>
                    <Link to="/register">
                        <button type="button">Register</button>
                    </Link>

                    <Link to="/login">
                        <button type="button">Login</button>
                    </Link>
                </>
            )}
        </nav>
    )
}

export default Navbar
