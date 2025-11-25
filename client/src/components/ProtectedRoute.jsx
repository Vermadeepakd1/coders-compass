import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    console.log('ProtectedRoute render, user =', user);
    if (!user) {
        console.log('ProtectedRoute: redirecting to /login');
        return <Navigate to="/login" replace />
    }
    return <>{children}</>
}

export default ProtectedRoute
