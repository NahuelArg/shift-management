
import "./App.css";
import Login from "./pages/login";
import Register from "./pages/register";
import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import EmployeeDashboard from "./pages/employeeDashboard";
import Bookings from "./pages/bookings";
import Admin from "./pages/admin";
import Users from "./pages/users";
import Services from "./pages/services";
import Schedules from "./pages/schedules";
import BusinessPage from "./pages/business";
import { Route, BrowserRouter, Routes, Navigate } from "react-router";
import PrivateRoute from "./components/privateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/dashboard" element={<PrivateRoute requiredRole="CLIENT"><Dashboard /></PrivateRoute>} />
        <Route path="/dashboard/employee" element={<PrivateRoute requiredRole="EMPLOYEE"><EmployeeDashboard /></PrivateRoute>} />
        <Route path="/bookings" element={<PrivateRoute><Bookings /></PrivateRoute>} />
        <Route path="/dashboard/admin" element={<PrivateRoute requiredRole="ADMIN"><Admin /></PrivateRoute>} />
        <Route path="/users" element={<PrivateRoute requiredRole="ADMIN"><Users /></PrivateRoute>} />
        <Route path="/business" element={<PrivateRoute requiredRole="ADMIN"><BusinessPage /></PrivateRoute>} />
        <Route path="/services" element={<PrivateRoute requiredRole="ADMIN"><Services /></PrivateRoute>} />
        <Route path="/schedules" element={<PrivateRoute requiredRole="ADMIN"><Schedules /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
