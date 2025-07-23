
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode, useMemo } from 'react';
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
    Pharmacist: ['/', '/patients', '/sales', '/inventory/stores', '/inventory/reports', '/inventory/transfer', '/inventory/valuation', '/inventory/ledger'],
    Supervisor: ['/', '/patients', '/sales', '/sales/reports', '/inventory', '/inventory/stores', '/inventory/master', '/inventory/manufacturer', '/inventory/add', '/inventory/returns', '/inventory/transfer', '/inventory/reports', '/inventory/valuation', '/inventory/ledger' ]
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

export interface UpdateUser extends Omit<NewUser, 'password' | 'loginId'> {
    // loginId and password are not editable
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
    updateUser: (userId: string, updatedData: UpdateUser) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    addRole: (roleName: string) => Promise<void>;
    editRole: (oldRoleName: string, newRoleName: string) => Promise<void>;
    deleteRole: (roleName: string) => Promise<void>;
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
        const initializeApp = async () => {
            await seedDatabase();
             try {
                const storedUser = localStorage.getItem('medi-stock-user');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                }

                const storedUsers = localStorage.getItem('medi-stock-users');
                if (storedUsers) {
                    const parsedUsers = JSON.parse(storedUsers);
                    setUsersState(parsedUsers);
                    mockUsers = parsedUsers; // Keep mockUsers in sync
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
        }
        initializeApp();
    }, []);

    const setPermissions = useCallback((newPermissions: RolePermissions) => {
        setPermissionsState(newPermissions);
        localStorage.setItem('medi-stock-permissions', JSON.stringify(newPermissions));
    }, []);

    const hasPermission = useCallback((path: string): boolean => {
        if (!user) return false;
        if (user.role === 'Admin') return true;

        const userPermissions = permissions[user.role] || [];
        
        if (path === '/inventory') {
            return userPermissions.some(p => p.startsWith('/inventory/'));
        }
        
        // Allow access to admin sub-pages if /admin is permitted
        if (path.startsWith('/admin/') && userPermissions.includes('/admin')) {
            return true;
        }

        return userPermissions.includes(path);

    }, [user, permissions]);

    const logout = useCallback(async () => {
        setUser(null);
        localStorage.removeItem('medi-stock-user');
        router.push('/login');
    }, [router]);

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

    }, [user, loading, pathname, router, hasPermission, logout]);


    const login = useCallback(async (credential: string, pass: string): Promise<boolean> => {
        const foundUser = usersState.find(u => u.email.toLowerCase() === credential.toLowerCase() || u.loginId.toLowerCase() === credential.toLowerCase());
        
        if (foundUser) {
            setUser(foundUser);
            localStorage.setItem('medi-stock-user', JSON.stringify(foundUser));
            return true;
        }
        return false;
    }, [usersState]);
    
    const createUser = useCallback(async (newUser: NewUser) => {
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
    }, [usersState]);

    const updateUser = useCallback(async (userId: string, updatedData: UpdateUser) => {
        if (updatedData.email && usersState.some(u => u.email === updatedData.email && u.id !== userId)) {
            throw new Error("A user with this email already exists.");
        }

        const updatedUsers = usersState.map(u => {
            if (u.id === userId) {
                return {
                    ...u,
                    ...updatedData
                };
            }
            return u;
        });

        setUsersState(updatedUsers);
        localStorage.setItem('medi-stock-users', JSON.stringify(updatedUsers));

        if (user?.id === userId) {
             const updatedCurrentUser = updatedUsers.find(u => u.id === userId);
             if (updatedCurrentUser) {
                setUser(updatedCurrentUser);
                localStorage.setItem('medi-stock-user', JSON.stringify(updatedCurrentUser));
             }
        }
    }, [usersState, user?.id]);

    const deleteUser = useCallback(async (userId: string) => {
         const updatedUsers = usersState.filter(u => u.id !== userId);
         setUsersState(updatedUsers);
         localStorage.setItem('medi-stock-users', JSON.stringify(updatedUsers));
    }, [usersState]);

    const addRole = useCallback(async (roleName: string) => {
        if (permissions[roleName]) {
            throw new Error(`Role "${roleName}" already exists.`);
        }
        const newPermissions = { ...permissions, [roleName]: [] };
        setPermissions(newPermissions);
    }, [permissions, setPermissions]);

    const editRole = useCallback(async (oldRoleName: string, newRoleName: string) => {
        if (oldRoleName === 'Admin') {
            throw new Error("Cannot rename the Admin role.");
        }
        if (permissions[newRoleName] && oldRoleName !== newRoleName) {
            throw new Error(`Role "${newRoleName}" already exists.`);
        }

        const newPermissions = { ...permissions };
        newPermissions[newRoleName] = newPermissions[oldRoleName];
        delete newPermissions[oldRoleName];
        setPermissions(newPermissions);

        const updatedUsers = usersState.map(u => 
            u.role === oldRoleName ? { ...u, role: newRoleName } : u
        );
        setUsersState(updatedUsers);
        localStorage.setItem('medi-stock-users', JSON.stringify(updatedUsers));

        if (user?.role === oldRoleName) {
            const updatedCurrentUser = { ...user, role: newRoleName };
            setUser(updatedCurrentUser);
            localStorage.setItem('medi-stock-user', JSON.stringify(updatedCurrentUser));
        }
    }, [permissions, setPermissions, usersState, user?.role]);

    const deleteRole = useCallback(async (roleName: string) => {
        if (roleName === 'Admin') {
            throw new Error("Cannot delete the Admin role.");
        }
        if (usersState.some(u => u.role === roleName)) {
            throw new Error("Cannot delete role as it is assigned to one or more users.");
        }
        const newPermissions = { ...permissions };
        delete newPermissions[roleName];
        setPermissions(newPermissions);
    }, [permissions, setPermissions, usersState]);


    const value = useMemo(() => ({ user, users: usersState, login, logout, loading, permissions, setPermissions, hasPermission, createUser, updateUser, deleteUser, addRole, editRole, deleteRole }), [user, usersState, login, logout, loading, permissions, setPermissions, hasPermission, createUser, updateUser, deleteUser, addRole, editRole, deleteRole]);

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
