import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LogEntry {
    timestamp: string;
    component: string;
    message: string;
    data?: unknown;
}

interface LogState {
    logs: LogEntry[];
    addLog: (log: Omit<LogEntry, 'timestamp'>) => void;
    clearLogs: () => void;
}

export const useLogStore = create<LogState>()(
    persist(
        (set) => ({
            logs: [],
            addLog: (log) => set((state) => ({
                logs: [...state.logs, {
                    ...log,
                    timestamp: new Date().toISOString(),
                }]
            })),
            clearLogs: () => set({ logs: [] }),
        }),
        {
            name: 'debug-logs',
        }
    )
);
