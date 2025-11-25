import { createContext, useState, useEffect, useCallback } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

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
            console.log('AuthContext.logout: clearing storage and state');
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
            if (token) {
                console.log("token exists in local storage")
            }
        } catch (error) {
            console.error("Failed to read auth data from local storage", error);
            setUser(null);
        }

    }, []);

    return <AuthContext.Provider value={{ user, login, logout }}>
        {children}
    </AuthContext.Provider>

}