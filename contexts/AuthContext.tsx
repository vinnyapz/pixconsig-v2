'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserType, AuthUser } from '@/types';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
    isAuthenticated: boolean;
    user: AuthUser | null;
    userType: UserType | null;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setIsAuthenticated(true);
                // If on login page, redirect to dashboard
                if (pathname === '/login') {
                    router.push('/dashboard');
                }
            } else {
                setIsAuthenticated(false);
                setUser(null);
                const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/register'];
                const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

                if (res.status === 401 && !isPublicRoute) {
                    router.push('/login');
                }
            }
        } catch (error) {
            console.error('Auth check failed', error);
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, pass: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Falha no login');
        }

        const data = await res.json();
        setUser(data.user);
        setIsAuthenticated(true);
        router.push('/dashboard');
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setIsAuthenticated(false);
            setUser(null);
            router.push('/login');
        } catch (error) {
            console.error('Logout error', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            userType: user?.type || null,
            login,
            logout,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
