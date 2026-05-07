import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { ToastProvider } from './components/ui/Toast';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SidebarProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </SidebarProvider>
    </AuthProvider>
  </StrictMode>,
);
