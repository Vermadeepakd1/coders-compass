/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = useCallback((userData, token) => {
        try {
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
        } catch (e) {
            console.error("Failed to persist auth data", e);
        }
    }, []);

    const logout = useCallback(() => {
        try {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        } catch (e) {
            console.error("Failed to clear auth data", e);
        }
        setUser(null);
    }, []);

    useEffect(() => {
        try {
            const token = localStorage.getItem('token');
            const userStored = localStorage.getItem('user');

            if (token && userStored) {
                //Parse the string back into an object
                setUser(JSON.parse(userStored));
            } else {
                // If data is inconsistent (e.g. token exists but no user data), clear it
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            }
        } catch (error) {
            console.error("Failed to read auth data from local storage", error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        } finally {
            setLoading(false);
        }

    }, []);

    return <AuthContext.Provider value={{ user, login, logout, loading }}>
        {children}
    </AuthContext.Provider>

}