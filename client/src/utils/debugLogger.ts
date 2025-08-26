import { useLogStore } from '../store/logStore';

export const debugLog = (area: string, message: string, data?: unknown) => {
    // Agregar al store de Zustand
    useLogStore.getState().addLog({
        component: area,
        message,
        data
    });
    
    // También mostrar en consola
    console.log(`${area} - ${message}`, data || '');
};

// Función para obtener todos los logs
export const getLogs = () => {
    return JSON.parse(localStorage.getItem('debug_logs') || '[]');
};

// Función para limpiar logs
export const clearLogs = () => {
    localStorage.removeItem('debug_logs');
};
