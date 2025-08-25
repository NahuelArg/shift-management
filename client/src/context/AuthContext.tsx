import React, { createContext, useContext, useEffect, useState } from 'react';

interface User{
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'CLIENT' | 'EMPLOYEE';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user:User) => Promise<void>;
    logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children:React.ReactNode}> = ({children})=>{
    const [user, setUser] = useState< User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if(storedToken && storedUser && storedUser != 'undefined') {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = async (token:string, user:User) => {
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    const logout = async () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}