import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NavBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/home");
  };

  return (
    <nav className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between shadow-md relative">
      {/* Left: Logo + Mobile menu button */}
      <div className="flex w-full items-center justify-between">
        <Link to="/home" className="font-bold text-xl tracking-tight hover:text-gray-600 transition-colors">
          Appointment Manager
        </Link>
        {/* Mobile menu button (left, only visible on mobile) */}
        <button
          className="md:hidden focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"

        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      {/* Right: Desktop links */}
      <div className="hidden md:flex items-center space-x-12">
        <Link to="/home" className="hover:text-gray-600 transition-colors text-lg">Home</Link>
        {user && user.role === "CLIENT" && (
          <Link to="/dashboard" className="hover:text-gray-600 transition-colors text-lg">Dashboard</Link>
        )}
        {user && user.role === "ADMIN" && (
          <>
            <Link to="/dashboard/admin" className="hover:text-gray-600 transition-colors text-lg">Admin</Link>
            <Link to="/users" className="hover:text-gray-600 transition-colors text-lg">Users</Link>
            <Link to="/business" className="hover:text-gray-600 transition-colors text-lg">Business</Link>
            <Link to="/services" className="hover:text-gray-600 transition-colors text-lg">Services</Link>
            <Link to="/schedules" className="hover:text-gray-600 transition-colors text-lg">Schedules</Link>
          </>
        )}
        {user && user.role === "CLIENT" && (
          <Link to="/bookings">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-4 rounded transition-colors ml-2">
              Book Now
            </button>
          </Link>
        )}
        {!user ? (
          <>
            <Link to="/login" className="hover:text-gray-600 transition-colors">Login</Link>
            <Link to="/register" className="hover:text-gray-600 transition-colors">Register</Link>
          </>
        ) : (
          <button onClick={handleLogout} className="hover:text-gray-600 transition-colors ml-2">
            Logout
          </button>
        )}
      </div>
      {/* Mobile menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-gray-800 flex flex-col items-center md:hidden z-50 shadow-lg">
          <Link to="/home" className="py-2 w-full text-center hover:bg-gray-700" onClick={() => setIsOpen(false)}>Home</Link>
          {user && user.role === "CLIENT" && (
            <Link to="/dashboard" className="py-2 w-full text-center hover:bg-gray-700" onClick={() => setIsOpen(false)}>Dashboard</Link>
          )}
          {user && user.role === "ADMIN" && (
            <>
              <Link to="/dashboard/admin" className="py-2 w-full text-center hover:bg-gray-700" onClick={() => setIsOpen(false)}>Admin</Link>
              <Link to="/users" className="py-2 w-full text-center hover:bg-gray-700" onClick={() => setIsOpen(false)}>Users</Link>
              <Link to="/business" className="py-2 w-full text-center hover:bg-gray-700" onClick={() => setIsOpen(false)}>Business</Link>
              <Link to="/services" className="py-2 w-full text-center hover:bg-gray-700" onClick={() => setIsOpen(false)}>Services</Link>
              <Link to="/schedules" className="py-2 w-full text-center hover:bg-gray-700" onClick={() => setIsOpen(false)}>Schedules</Link>
            </>
          )}
          {user && user.role === "CLIENT" && (
            <Link to="/bookings" className="py-2 w-full text-center hover:bg-blue-600 text-white font-semibold" onClick={() => setIsOpen(false)}>
              Book Now
            </Link>
          )}
          {!user ? (
            <>
              <Link to="/login" className="py-2 w-full text-center hover:bg-gray-700" onClick={() => setIsOpen(false)}>Login</Link>
              <Link to="/register" className="py-2 w-full text-center hover:bg-blue-600 text-white font-semibold" onClick={() => setIsOpen(false)}>
                Register
              </Link>
            </>
          ) : (
            <button onClick={() => { handleLogout(); setIsOpen(false); }} className="py-2 w-full text-center hover:bg-gray-700">
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default NavBar;