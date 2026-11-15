import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const LogoutButton: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    void logout();
    void navigate("/home");
  };

  return (
    <button onClick={handleLogout} style={{ marginLeft: "1rem" }}>
      Logout
    </button>
  );
};

export default LogoutButton;