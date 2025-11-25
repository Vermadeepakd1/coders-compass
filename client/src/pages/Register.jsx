import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';

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
        <div className="registerform">


            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">Username</label>
                    <input id="username" name='username' value={formData.username} onChange={handleChange} type="text" required />
                </div>

                <div>
                    <label htmlFor="email">E-mail</label>
                    <input id="email" name="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                        required />
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <input id="password" name="password"
                        value={formData.password}
                        onChange={handleChange}
                        type="password"
                        required />
                </div>

                <div>
                    <label htmlFor="codeforces">Codeforces Handle</label>
                    <input id="codeforces" name="codeforces"
                        value={formData.codeforces}
                        onChange={handleChange}
                        type="text" />
                </div>

                <div>
                    <label htmlFor="codechef">Codechef Handle</label>
                    <input id="codechef" name="codechef"
                        value={formData.codechef}
                        onChange={handleChange}
                        type="text" />
                </div>

                <div>
                    <label htmlFor="leetcode">Leetcode handle</label>
                    <input id="leetcode" name="leetcode"
                        value={formData.leetcode}
                        onChange={handleChange}
                        type="text" />
                </div>

                <button type="submit">Register</button>

            </form>
        </div>
    )
}

export default Register
