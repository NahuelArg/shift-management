import { createContext } from 'react';

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'CLIENT' | 'EMPLOYEE';
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user:User) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
