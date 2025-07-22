
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, UserRole, RolePermissions, allAppRoutes } from '@/lib/types';


// Mock user data - in a real app, this would come from an API
const initialUsers = [
    { name: "Admin User", email: "admin@medistock.com", role: "Admin" as UserRole, assignedStore: "STR001", password: "password" },
    { name: "Pharmacist One", email: "pharmacist1@medistock.com", role: "Pharmacist" as UserRole, assignedStore: "STR002", password: "password" },
    { name: "Supervisor One", email: "supervisor1@medistock.com", role: "Supervisor" as UserRole, password: "password" },
];

const initialPermissions: RolePermissions = {
    Admin: allAppRoutes.map(r => r.path), // Admin has all permissions
    Pharmacist: ['/', '/patients', '/sales', '/inventory/stores', '/inventory/transfer'],
    Supervisor: ['/', '/sales', '/sales/reports', '/inventory/reports', '/inventory/valuation']
};


interface AuthContextType {
    user: User | null;
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
    permissions: RolePermissions;
    setPermissions: (permissions: RolePermissions) => void;
    hasPermission: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [permissions, setPermissionsState] = useState<RolePermissions>(initialPermissions);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const storedUser = localStorage.getItem('medi-stock-user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        const storedPermissions = localStorage.getItem('medi-stock-permissions');
        if (storedPermissions) {
            setPermissionsState(JSON.parse(storedPermissions));
        } else {
            // If no permissions in storage, set initial and save them
            localStorage.setItem('medi-stock-permissions', JSON.stringify(initialPermissions));
        }
        setLoading(false);
    }, []);

    const hasPermission = useCallback((path: string): boolean => {
        if (!user) return false;
        if (user.role === 'Admin') return true;

        const userPermissions = permissions[user.role] || [];
        
        // For the collapsible trigger, it should be visible if any child route is permitted
        if (path === '/inventory') {
            return userPermissions.some(p => p.startsWith('/inventory/'));
        }
        
        // For all other routes, require an exact match in the permissions array.
        return userPermissions.includes(path);

    }, [user, permissions]);


    useEffect(() => {
        if (loading) return;

        if (!user && pathname !== '/login') {
            router.push('/login');
            return;
        }

        if (user && pathname !== '/login' && !hasPermission(pathname)) {
            // If user doesn't have permission, redirect to their default allowed page (e.g., dashboard)
            // This prevents getting stuck on a page they've just lost access to.
             if(hasPermission('/')) {
                router.push('/');
             } else {
                // If they can't even see the dashboard, log them out.
                logout();
             }
        }

    }, [user, loading, pathname, router, hasPermission]);


    const login = async (email: string, pass: string): Promise<boolean> => {
        const foundUser = initialUsers.find(u => u.email === email && u.password === pass);
        if (foundUser) {
            const { password, ...userToStore } = foundUser;
            setUser(userToStore);
            localStorage.setItem('medi-stock-user', JSON.stringify(userToStore));
            
            // Reload permissions from storage on login to get the latest.
            const storedPermissions = localStorage.getItem('medi-stock-permissions');
            if (storedPermissions) {
                setPermissionsState(JSON.parse(storedPermissions));
            } else {
                setPermissionsState(initialPermissions);
                 localStorage.setItem('medi-stock-permissions', JSON.stringify(initialPermissions));
            }
            
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('medi-stock-user');
        router.push('/login');
    };

    const setPermissions = (newPermissions: RolePermissions) => {
        setPermissionsState(newPermissions);
        localStorage.setItem('medi-stock-permissions', JSON.stringify(newPermissions));
    }

    const value = { user, login, logout, loading, permissions, setPermissions, hasPermission };

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
