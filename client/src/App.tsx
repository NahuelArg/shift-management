import { lazy, Suspense } from 'react';
import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom';
import PrivateRoute from './components/privateRoute';
import AppShell from './components/layout/AppShell';

const Login          = lazy(() => import('./pages/login'));
const Register       = lazy(() => import('./pages/register'));
const Home           = lazy(() => import('./pages/home'));
const Dashboard      = lazy(() => import('./pages/dashboard'));
const EmployeeDash   = lazy(() => import('./pages/employeeDashboard'));
const Bookings       = lazy(() => import('./pages/bookings'));
const Admin          = lazy(() => import('./pages/admin'));
const Users          = lazy(() => import('./pages/users'));
const Services       = lazy(() => import('./pages/services'));
const Schedules      = lazy(() => import('./pages/schedules'));
const BusinessPage   = lazy(() => import('./pages/business'));
const Calendar       = lazy(() => import('./pages/calendar'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-40">
    <svg className="animate-spin-slow w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home"     element={<Home />} />
          <Route path="/"         element={<Navigate to="/home" replace />} />

          {/* Protected routes — all wrapped in AppShell */}
          <Route path="/dashboard" element={
            <PrivateRoute requiredRole="CLIENT">
              <AppShell><Dashboard /></AppShell>
            </PrivateRoute>
          } />
          <Route path="/dashboard/employee" element={
            <PrivateRoute requiredRole="EMPLOYEE">
              <AppShell><EmployeeDash /></AppShell>
            </PrivateRoute>
          } />
          <Route path="/dashboard/admin" element={
            <PrivateRoute requiredRole="ADMIN">
              <AppShell><Admin /></AppShell>
            </PrivateRoute>
          } />
          <Route path="/bookings" element={
            <PrivateRoute>
              <AppShell><Bookings /></AppShell>
            </PrivateRoute>
          } />
          <Route path="/users" element={
            <PrivateRoute requiredRole="ADMIN">
              <AppShell><Users /></AppShell>
            </PrivateRoute>
          } />
          <Route path="/business" element={
            <PrivateRoute requiredRole="ADMIN">
              <AppShell><BusinessPage /></AppShell>
            </PrivateRoute>
          } />
          <Route path="/services" element={
            <PrivateRoute requiredRole="ADMIN">
              <AppShell><Services /></AppShell>
            </PrivateRoute>
          } />
          <Route path="/schedules" element={
            <PrivateRoute requiredRole="ADMIN">
              <AppShell><Schedules /></AppShell>
            </PrivateRoute>
          } />
          <Route path="/calendar" element={
            <PrivateRoute requiredRole="ADMIN">
              <AppShell><Calendar /></AppShell>
            </PrivateRoute>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
