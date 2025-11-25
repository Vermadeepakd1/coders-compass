import { useState, useContext } from "react";
import React from 'react'
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

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
                // still accept if API returns token elsewhere -- adjust as needed
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
        <div className="loginForm">
            <form onSubmit={handleSubmit}>

                <div>
                    <label htmlFor="email">E-mail</label>
                    <input id="email" name="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                        required autoComplete="email" />
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <input id="password" name="password"
                        value={formData.password}
                        onChange={handleChange}
                        type="password"
                        required autoComplete="current-password" />
                </div>

                {error && <p style={{ color: "red" }}>{error}</p>}

                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                </button>

            </form>
        </div>
    )
}

export default Login
