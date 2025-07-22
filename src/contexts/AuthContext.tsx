
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole, RolePermissions, allAppRoutes } from '@/lib/types';
import { seedDatabase } from '@/services/seed-service';

export interface User {
    id: string;
    loginId: string;
    name: string;
    email: string;
    role: UserRole;
    assignedStore?: string;
    altMobile?: string;
    pan?: string;
    aadhar?: string;
}

const initialPermissions: RolePermissions = {
    Admin: allAppRoutes.map(r => r.path),
    Pharmacist: ['/', '/patients', '/sales', '/inventory/stores', '/inventory/reports', '/inventory/transfer', '/inventory/valuation'],
    Supervisor: ['/', '/patients', '/sales', '/sales/reports', '/inventory', '/inventory/warehouse', '/inventory/stores', '/inventory/master', '/inventory/manufacturer', '/inventory/add', '/inventory/returns', '/inventory/transfer', '/inventory/reports', '/inventory/valuation' ]
};

let mockUsers: User[] = [
    { id: "1", loginId: "admin", name: "Admin User", email: "admin@medistock.com", role: "Admin", aadhar: "1234 5678 9012", pan: "ABCDE1234F" },
    { id: "2", loginId: "pharm1", name: "Pharmacist One", email: "pharmacist1@medistock.com", role: "Pharmacist", assignedStore: "STR002" },
    { id: "3", loginId: "super1", name: "Supervisor One", email: "supervisor1@medistock.com", role: "Supervisor" },
];


export interface NewUser {
    name: string;
    email: string;
    loginId: string;
    role: UserRole;
    assignedStore?: string;
    password?: string;
    altMobile?: string;
    pan?: string;
    aadhar?: string;
}

interface AuthContextType {
    user: User | null;
    users: User[];
    login: (credential: string, pass: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
    permissions: RolePermissions;
    setPermissions: (permissions: RolePermissions) => void;
    hasPermission: (path: string) => boolean;
    createUser: (newUser: NewUser) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [usersState, setUsersState] = useState<User[]>(mockUsers);
    const [loading, setLoading] = useState(true);
    const [permissions, setPermissionsState] = useState<RolePermissions>(initialPermissions);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('medi-stock-user');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            }

            const storedUsers = localStorage.getItem('medi-stock-users');
            if (storedUsers) {
                setUsersState(JSON.parse(storedUsers));
                mockUsers = JSON.parse(storedUsers); // Keep mockUsers in sync
            } else {
                 localStorage.setItem('medi-stock-users', JSON.stringify(mockUsers));
            }

            const storedPermissions = localStorage.getItem('medi-stock-permissions');
            if (storedPermissions) {
                setPermissionsState(JSON.parse(storedPermissions));
            } else {
                localStorage.setItem('medi-stock-permissions', JSON.stringify(initialPermissions));
            }

        } catch (error) {
            console.error("Failed to parse from localStorage", error);
            localStorage.clear();
        }
        setLoading(false);
    }, []);

    const hasPermission = useCallback((path: string): boolean => {
        if (!user) return false;
        if (user.role === 'Admin') return true;

        const userPermissions = permissions[user.role] || [];
        
        if (path === '/inventory') {
            return userPermissions.some(p => p.startsWith('/inventory/'));
        }
        
        return userPermissions.includes(path);

    }, [user, permissions]);


    useEffect(() => {
        if (loading) return;

        const publicRoutes = ['/login'];
        const pathIsPublic = publicRoutes.includes(pathname);

        if (!user && !pathIsPublic) {
            router.push('/login');
            return;
        }

        if (user && pathname !== '/login' && !hasPermission(pathname)) {
             console.warn(`User ${user.email} with role ${user.role} attempted to access restricted path: ${pathname}`);
             if(hasPermission('/')) {
                router.push('/');
             } else {
                logout();
             }
        }

    }, [user, loading, pathname, router, hasPermission]);


    const login = async (credential: string, pass: string): Promise<boolean> => {
        const foundUser = usersState.find(u => u.email.toLowerCase() === credential.toLowerCase() || u.loginId.toLowerCase() === credential.toLowerCase());
        
        if (foundUser) {
            setUser(foundUser);
            localStorage.setItem('medi-stock-user', JSON.stringify(foundUser));
            return true;
        }
        return false;
    };

    const logout = async () => {
        setUser(null);
        localStorage.removeItem('medi-stock-user');
        router.push('/login');
    };

    const setPermissions = (newPermissions: RolePermissions) => {
        setPermissionsState(newPermissions);
        localStorage.setItem('medi-stock-permissions', JSON.stringify(newPermissions));
    }
    
    const createUser = async (newUser: NewUser) => {
        if (usersState.some(u => u.email === newUser.email)) {
            throw new Error("A user with this email already exists.");
        }
        if (usersState.some(u => u.loginId === newUser.loginId)) {
            throw new Error("A user with this Login ID already exists.");
        }

        const userToCreate: User = {
            id: (usersState.length + 1).toString(),
            ...newUser,
        };

        const updatedUsers = [...usersState, userToCreate];
        setUsersState(updatedUsers);
        localStorage.setItem('medi-stock-users', JSON.stringify(updatedUsers));
    };

    const deleteUser = async (userId: string) => {
         const updatedUsers = usersState.filter(u => u.id !== userId);
         setUsersState(updatedUsers);
         localStorage.setItem('medi-stock-users', JSON.stringify(updatedUsers));
    };


    const value = { user, users: usersState, login, logout, loading, permissions, setPermissions, hasPermission, createUser, deleteUser };

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
