
import "./App.css";
import Login from "./pages/login";
import Register from "./pages/register";
import Home from "./pages/home";
import DebugPanel from "./components/DebugPanel";
import { DebugConsole } from "./components/DebugConsole";
import Dashboard from "./pages/dashboard";
import Bookings from "./pages/bookings";
import Admin from "./pages/admin";
import { Route, BrowserRouter, Routes, Navigate } from "react-router";
import PrivateRoute from "./components/privateRoute";
 
// Prevenir que los errores causen refrescos de página
window.addEventListener('error', (event) => {
  event.preventDefault();
  console.error('Error global capturado:', event.error);
  return false;
});

window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
  console.error('Promesa rechazada no manejada:', event.reason);
  return false;
});

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<PrivateRoute requiredRole="CLIENT"><Dashboard /></PrivateRoute>} />
          <Route path="/bookings" element={<PrivateRoute><Bookings /></PrivateRoute>} />
          <Route path="/dashboard/admin" element={<PrivateRoute requiredRole="ADMIN"><Admin /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
      {/* Estos componentes están fuera del BrowserRouter para evitar re-renderizados innecesarios */}
      <DebugPanel />
      <DebugConsole />
    </>
  );
}

export default App;
