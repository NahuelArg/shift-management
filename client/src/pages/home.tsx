import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NavBar from "../components/navBar";


const Home: React.FC = () => {
  const { user } = useAuth();

  return (
  <div className="flex flex-col min-h-screen">
    <NavBar />
    <div className="flex flex-col items-center justify-center flex-1 bg-gradient-to-b from-custom-light to-custom-dark w-full" style={{ minHeight: "calc(100vh - 48px)" }}>
      <main className="flex flex-col items-center justify-center flex-grow px-4 py-8 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4">Welcome to the Appointment Manager</h1>
        <p className="text-lg text-gray-700 max-w-xl mb-8 font-light">
          Manage your appointments easily. Book, view, and manage your reservations as a client, or control all bookings as an admin.
        </p>
        {!user ? (
          <div className="flex gap-4">
            <Link to="/login">
              <button className="bg-emerald-500 hover:bg-esmerald-700 focus:ring-2 focus:ring-esmerald-400 text-white shadow font-semibold text-lg py-3 px-6 rounded-lg transition-colors">Login</button>
            </Link>
            <Link to="/register">
              <button className="bg-emerald-500 hover:bg-esmerald-700 focus:ring-2 focus:ring-esmerald-400 text-white shadow font-semibold text-lg py-3 px-6 rounded-lg transition-colors">Register</button>
            </Link>
          </div>
        ) : (
          <div className="flex justify-center">
            {user.role === "ADMIN" ? (
              <Link to="/dashboard/admin">
                <button className="bg-emerald-500 hover:bg-esmerald-700 text-white shadow font-semibold text-lg py-3 px-6 rounded-lg transition-colors">Go to Admin Dashboard</button>
              </Link>
            ) : user.role === "EMPLOYEE" ? (
              <Link to="/dashboard/employee">
                <button className="bg-emerald-500 hover:bg-esmerald-700 text-white font-semibold text-lg py-3 px-6 rounded-lg transition-colors">Go to Employee Dashboard</button>
              </Link>
            ) : (
              <Link to="/dashboard">
                <button className="bg-emerald-500 hover:bg-esmerald-700 text-white font-semibold text-lg py-3 px-6 rounded-lg transition-colors">Go to My Dashboard</button>
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  </div>
);
};

export default Home;