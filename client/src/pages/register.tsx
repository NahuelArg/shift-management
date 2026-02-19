import axios from "axios";
import React from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/navBar";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [form, setForm] = React.useState({
        email: "",
        password: "",
        name: "",
    });
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/auth/register`, form);
            navigate('/login');
        } catch (error: any) {
            setError(error.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <div
                className="flex flex-col items-center justify-center flex-1 bg-gradient-to-b from-custom-light to-custom-dark w-full"
                style={{ minHeight: "calc(100vh - 48px)" }}
            >
                <div className="bg-white/90 rounded-xl shadow-lg p-8 w-full max-w-md">
                    <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-2">
                        Register
                    </h2>
                    <p className="text-gray-500 text-center mb-6 text-sm">
                        Create your account to start managing your appointments.
                    </p>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <input
                            type="text"
                            name="name"
                            placeholder="Name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <svg
                                    className="animate-spin h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v16a8 8 0 01-8-8z"
                                    ></path>
                                </svg>
                            ) : null}
                            {loading ? "Registering..." : "Register"}
                        </button>
                        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Register;