
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, UserRole, RolePermissions, allAppRoutes } from '@/lib/types';
import { seedDatabase } from '@/services/seed-service';


const initialPermissions: RolePermissions = {
    Admin: allAppRoutes.map(r => r.path),
    Pharmacist: ['/', '/patients', '/sales', '/inventory/stores', '/inventory/reports', '/inventory/transfer', '/inventory/valuation'],
    Supervisor: ['/', '/patients', '/sales', '/sales/reports', '/inventory', '/inventory/warehouse', '/inventory/stores', '/inventory/master', '/inventory/manufacturer', '/inventory/add', '/inventory/returns', '/inventory/transfer', '/inventory/reports', '/inventory/valuation' ]
};

const mockUsers: User[] = [
    { id: "1", name: "Admin User", email: "admin@medistock.com", role: "Admin" },
    { id: "2", name: "Pharmacist One", email: "pharmacist1@medistock.com", role: "Pharmacist", assignedStore: "STR002" },
    { id: "3", name: "Supervisor One", email: "supervisor1@medistock.com", role: "Supervisor" },
];


interface NewUser {
    name: string;
    email: string;
    role: UserRole;
    assignedStore?: string;
    password?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
    permissions: RolePermissions;
    setPermissions: (permissions: RolePermissions) => void;
    hasPermission: (path: string) => boolean;
    // These functions will now be simple placeholders, as user management will happen in the Admin page state
    createUser: (newUser: NewUser) => Promise<void>;
    deleteUser: (userId: string, email: string) => Promise<void>;
    fetchUsers: () => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [permissions, setPermissionsState] = useState<RolePermissions>(initialPermissions);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check if a user session exists in local storage
        try {
            const storedUser = localStorage.getItem('medi-stock-user');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                 if (parsedUser.role === 'Admin') {
                    const seeded = localStorage.getItem('db_seeded_v2');
                    if (!seeded) {
                        console.log("Admin logged in, checking if DB needs seeding...");
                        seedDatabase().then(() => {
                           localStorage.setItem('db_seeded_v2', 'true');
                           console.log("Database seeding complete.");
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('medi-stock-user');
        }
        setLoading(false);

        const storedPermissions = localStorage.getItem('medi-stock-permissions');
        if (storedPermissions) {
            setPermissionsState(JSON.parse(storedPermissions));
        } else {
            localStorage.setItem('medi-stock-permissions', JSON.stringify(initialPermissions));
        }
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


    const login = async (email: string, pass: string): Promise<boolean> => {
        const foundUser = mockUsers.find(u => u.email === email);
        // We're ignoring the password for this mock implementation for simplicity.
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
    
    // These functions are now placeholders. The actual logic will be handled
    // within the Admin page component's state.
    const createUser = async (newUser: NewUser) => {
        console.log("Mock createUser called. User management is handled in Admin page state.");
    };

    const deleteUser = async (userId: string, email: string) => {
         console.log("Mock deleteUser called. User management is handled in Admin page state.");
    };

    const fetchUsers = async (): Promise<User[]> => {
        console.log("Mock fetchUsers called. Users are managed in Admin page state.");
        return Promise.resolve(mockUsers); // Return the base mock users
    };


    const value = { user, login, logout, loading, permissions, setPermissions, hasPermission, createUser, deleteUser, fetchUsers };

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
