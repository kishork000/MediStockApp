
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, UserRole, RolePermissions, allAppRoutes } from '@/lib/types';
import { auth } from '@/lib/firebase-config'; // Import auth from firebase-config
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseAuthUser } from 'firebase/auth';

// This mock data is now only used for initial role permissions.
// User accounts are managed by Firebase Auth and user details would be in Firestore.
const mockUserDetails: Omit<User, 'email'>[] = [
    { name: "Admin User", role: "Admin" as UserRole, assignedStore: "STR001" },
    { name: "Pharmacist One", role: "Pharmacist" as UserRole, assignedStore: "STR002" },
    { name: "Supervisor One", role: "Supervisor" as UserRole },
    { name: "Pharmacist Two", role: "Pharmacist" as UserRole, assignedStore: "STR003" },
];


const initialPermissions: RolePermissions = {
    Admin: allAppRoutes.map(r => r.path), // Admin has all permissions
    Pharmacist: ['/', '/patients', '/sales', '/inventory/stores', '/inventory/reports', '/inventory/transfer', '/inventory/valuation'],
    Supervisor: ['/', '/patients', '/sales', '/sales/reports', '/inventory', '/inventory/warehouse', '/inventory/stores', '/inventory/master', '/inventory/manufacturer', '/inventory/add', '/inventory/returns', '/inventory/transfer', '/inventory/reports', '/inventory/valuation' ]
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
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // In a real app, you'd fetch user role & details from your Firestore database here
                // For this project, we'll map the firebase email to our mock user details
                const userDetails = mockUserDetails.find(u => u.name.toLowerCase().replace(' ', '') === firebaseUser.email?.split('@')[0]);

                if (userDetails) {
                    const appUser: User = {
                        email: firebaseUser.email || '',
                        ...userDetails,
                    };
                    setUser(appUser);
                    localStorage.setItem('medi-stock-user', JSON.stringify(appUser));
                }
            } else {
                setUser(null);
                localStorage.removeItem('medi-stock-user');
            }
            setLoading(false);
        });

        const storedPermissions = localStorage.getItem('medi-stock-permissions');
        if (storedPermissions) {
            setPermissionsState(JSON.parse(storedPermissions));
        } else {
            localStorage.setItem('medi-stock-permissions', JSON.stringify(initialPermissions));
        }

        return () => unsubscribe();
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

        if (!user && pathname !== '/login') {
            router.push('/login');
            return;
        }

        if (user && pathname !== '/login' && !hasPermission(pathname)) {
             if(hasPermission('/')) {
                router.push('/');
             } else {
                logout();
             }
        }

    }, [user, loading, pathname, router, hasPermission]);


    const login = async (email: string, pass: string): Promise<boolean> => {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            // onAuthStateChanged will handle setting the user state
            return true;
        } catch (error) {
            console.error("Firebase Authentication Error:", error);
            return false;
        }
    };

    const logout = async () => {
        await signOut(auth);
        // onAuthStateChanged will handle clearing user state
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
