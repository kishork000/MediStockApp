
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole, RolePermissions, allAppRoutes } from '@/lib/types';
import { seedDatabase } from '@/services/seed-service';
import { getUsers, addUser, updateUser as updateUserService, deleteUser as deleteUserService, User, NewUser, UpdateUser } from '@/services/user-service';

const initialPermissions: RolePermissions = {
    Admin: allAppRoutes.map(r => r.path),
    Pharmacist: ['/', '/patients', '/sales', '/inventory/stores', '/inventory/reports', '/inventory/transfer', '/inventory/valuation', '/inventory/ledger', '/reports/profit-loss'],
    Supervisor: ['/', '/patients', '/sales', '/sales/reports', '/inventory', '/inventory/stores', '/inventory/master', '/inventory/manufacturer', '/inventory/add', '/inventory/returns', '/inventory/transfer', '/inventory/reports', '/inventory/valuation', '/inventory/ledger', '/inventory/adjustment', '/inventory/damaged', '/reports/profit-loss' ]
};

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
    const [usersState, setUsersState] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [permissions, setPermissionsState] = useState<RolePermissions>(initialPermissions);
    const router = useRouter();
    const pathname = usePathname();

    const fetchUsers = useCallback(async () => {
        const dbUsers = await getUsers();
        setUsersState(dbUsers);
        return dbUsers;
    }, []);

    useEffect(() => {
        const initializeApp = async () => {
            setLoading(true);
            await seedDatabase();
            const dbUsers = await fetchUsers();

             try {
                const storedUser = localStorage.getItem('medi-stock-user');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    // Verify the user still exists in our primary user list
                    if (dbUsers.some(u => u.id === parsedUser.id)) {
                        setUser(parsedUser);
                    } else {
                        localStorage.removeItem('medi-stock-user');
                    }
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
    }, [fetchUsers]);

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
        
        if (path.startsWith('/reports/') && userPermissions.includes('/reports')) {
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
        
        await addUser(newUser);
        await fetchUsers(); // Re-fetch to get the latest list with the new user
    }, [usersState, fetchUsers]);

    const updateUser = useCallback(async (userId: string, updatedData: UpdateUser) => {
        if (updatedData.email && usersState.some(u => u.email === updatedData.email && u.id !== userId)) {
            throw new Error("A user with this email already exists.");
        }

        await updateUserService(userId, updatedData);
        const updatedUsers = await fetchUsers();

        if (user?.id === userId) {
             const updatedCurrentUser = updatedUsers.find(u => u.id === userId);
             if (updatedCurrentUser) {
                setUser(updatedCurrentUser);
                localStorage.setItem('medi-stock-user', JSON.stringify(updatedCurrentUser));
             }
        }
    }, [usersState, user?.id, fetchUsers]);

    const deleteUser = useCallback(async (userId: string) => {
         await deleteUserService(userId);
         await fetchUsers();
    }, [fetchUsers]);

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

        // Create a new permissions object with the updated role name
        const newPermissions = { ...permissions };
        newPermissions[newRoleName] = newPermissions[oldRoleName];
        delete newPermissions[oldRoleName];
        setPermissions(newPermissions);

        // Update users with the old role to the new role
        const usersToUpdate = usersState.filter(u => u.role === oldRoleName);
        for (const userToUpdate of usersToUpdate) {
            await updateUserService(userToUpdate.id, { role: newRoleName as UserRole });
        }
        
        // Re-fetch all users to reflect the change
        const updatedUsers = await fetchUsers();

        // Update the currently logged-in user if their role changed
        if (user?.role === oldRoleName) {
            const updatedCurrentUser = updatedUsers.find(u => u.id === user.id);
            if (updatedCurrentUser) {
                setUser(updatedCurrentUser);
                localStorage.setItem('medi-stock-user', JSON.stringify(updatedCurrentUser));
            }
        }
    }, [permissions, setPermissions, usersState, user, fetchUsers]);


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
