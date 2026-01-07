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

    const updateUser = useCallback((updates) => {
        setUser(prev => {
            const newUser = { ...prev, ...updates };
            try {
                localStorage.setItem("user", JSON.stringify(newUser));
            } catch (e) {
                console.error("Failed to update auth data", e);
            }
            return newUser;
        });
    }, []);

    // Check token expiry on load
    const isTokenExpired = (token) => {
        if (!token) return true;
        try {
            const payloadBase64 = token.split('.')[1];
            if (!payloadBase64) return true;
            const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
            const decoded = JSON.parse(decodedJson);
            const exp = decoded.exp;
            const now = Date.now() / 1000;
            return exp < now;
        } catch {
            return true;
        }
    };

    useEffect(() => {
        try {
            const token = localStorage.getItem('token');
            const userStored = localStorage.getItem('user');

            if (token && userStored) {
                if (isTokenExpired(token)) {
                    console.log("Token expired on load, logging out.");
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                } else {
                    //Parse the string back into an object
                    setUser(JSON.parse(userStored));
                }
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

    return <AuthContext.Provider value={{ user, setUser, updateUser, login, logout, loading }}>
        {children}
    </AuthContext.Provider>

}