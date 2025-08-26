import React, { useEffect, useState } from 'react';
import { debugLog } from '../utils/debugLogger';
import { AuthContext, type User } from './AuthContextType';

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
        debugLog('AuthContext', '🔐 Login iniciado', { user });
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        debugLog('AuthContext', '✅ Estado actualizado', { token, user });
        debugLog('AuthContext', '💾 LocalStorage actualizado', {
            storedToken: localStorage.getItem('token'),
            storedUser: localStorage.getItem('user')
        });
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