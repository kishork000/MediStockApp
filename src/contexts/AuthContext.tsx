
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Mock user data - in a real app, this would come from an API
const initialUsers = [
    { name: "Admin User", email: "admin@medistock.com", role: "Admin", assignedStore: "STR001", password: "password" },
    { name: "Pharmacist One", email: "pharmacist1@medistock.com", role: "Pharmacist", assignedStore: "STR002", password: "password" },
];

interface User {
    name: string;
    email: string;
    role: "Admin" | "Pharmacist" | "Technician";
    assignedStore?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const storedUser = localStorage.getItem('medi-stock-user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

     useEffect(() => {
        if (!loading && !user && pathname !== '/login') {
            router.push('/login');
        }
    }, [user, loading, pathname, router]);


    const login = async (email: string, pass: string): Promise<boolean> => {
        const foundUser = initialUsers.find(u => u.email === email && u.password === pass);
        if (foundUser) {
            const { password, ...userToStore } = foundUser;
            setUser(userToStore);
            localStorage.setItem('medi-stock-user', JSON.stringify(userToStore));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('medi-stock-user');
        router.push('/login');
    };

    const value = { user, login, logout, loading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
