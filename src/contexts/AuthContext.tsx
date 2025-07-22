
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, UserRole, RolePermissions, allAppRoutes } from '@/lib/types';
import { auth, db } from '@/lib/firebase-config';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, User as FirebaseAuthUser } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { seedDatabase } from '@/services/seed-service';


const initialPermissions: RolePermissions = {
    Admin: allAppRoutes.map(r => r.path),
    Pharmacist: ['/', '/patients', '/sales', '/inventory/stores', '/inventory/reports', '/inventory/transfer', '/inventory/valuation'],
    Supervisor: ['/', '/patients', '/sales', '/sales/reports', '/inventory', '/inventory/warehouse', '/inventory/stores', '/inventory/master', '/inventory/manufacturer', '/inventory/add', '/inventory/returns', '/inventory/transfer', '/inventory/reports', '/inventory/valuation' ]
};

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
    // User management functions, only available to Admin
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

    const fetchUserDetails = async (firebaseUser: FirebaseAuthUser): Promise<User | null> => {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        let userDocSnap = await getDoc(userDocRef);
        
        // This is the critical fix: If the admin user logs in and doesn't have a DB record, create one.
        if (!userDocSnap.exists() && firebaseUser.email === 'admin@medistock.com') {
            console.log("Admin user not found in Firestore, creating record...");
            const adminData: User = {
                id: firebaseUser.uid,
                name: 'Admin User',
                email: firebaseUser.email,
                role: 'Admin',
            };
            await setDoc(userDocRef, adminData);
            userDocSnap = await getDoc(userDocRef); // Re-fetch the document
            console.log("Admin user record created.");
        }

        if (!userDocSnap.exists()) {
            console.warn("No user document found for UID:", firebaseUser.uid);
            return null;
        }

        return { id: userDocSnap.id, ...userDocSnap.data() } as User;
    };
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setLoading(true);
                try {
                    const userDetails = await fetchUserDetails(firebaseUser);
                    if (userDetails) {
                        setUser(userDetails);
                        localStorage.setItem('medi-stock-user', JSON.stringify(userDetails));

                        if (userDetails.role === 'Admin') {
                            const seeded = localStorage.getItem('db_seeded_v1'); // Changed key to allow re-seeding if needed
                            if (!seeded) {
                                console.log("Admin logged in, checking if DB needs seeding...");
                                await seedDatabase();
                                localStorage.setItem('db_seeded_v1', 'true');
                                console.log("Database seeding complete.");
                            }
                        }
                    } else {
                        // This case happens if a user exists in Firebase Auth but not in the 'users' collection
                        console.error(`User with email ${firebaseUser.email} authenticated but not found in database.`);
                        await signOut(auth); // Sign out the user to prevent being in a broken state
                        setUser(null);
                        localStorage.removeItem('medi-stock-user');
                    }
                } catch (error) {
                    console.error("Error during user details fetch or seeding:", error);
                    await signOut(auth);
                    setUser(null);
                    localStorage.removeItem('medi-stock-user');
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
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            return true;
        } catch (error) {
            console.error("Firebase Authentication Error:", error);
            return false;
        }
    };

    const logout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    const setPermissions = (newPermissions: RolePermissions) => {
        setPermissionsState(newPermissions);
        localStorage.setItem('medi-stock-permissions', JSON.stringify(newPermissions));
    }
    
    const createUser = async (newUser: NewUser) => {
        if (user?.role !== 'Admin') throw new Error("Only admins can create users.");
        if (!newUser.password) throw new Error("Password is required to create a user.");
        
        // This is a temporary solution. In a real app, you'd use a backend function to create users.
        // We re-authenticate the admin to perform this action, which is not ideal but works for this context.
        const tempAuth = auth;
        const userCredential = await createUserWithEmailAndPassword(tempAuth, newUser.email, newUser.password);
        
        const { password, ...userData } = newUser;
        
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userDocRef, {
            ...userData,
            // id: userCredential.user.uid // The doc ID is the UID, so this is redundant
        });
    };

    const deleteUser = async (userId: string, email: string) => {
         if (user?.role !== 'Admin') throw new Error("Only admins can delete users.");
         console.warn("User deletion from Firebase Auth must be done from a backend environment or Firebase Console.");
         const userDocRef = doc(db, 'users', userId);
         await deleteDoc(userDocRef);
    };

    const fetchUsers = async (): Promise<User[]> => {
        if (user?.role !== 'Admin') return [];
        const usersCollectionRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersCollectionRef);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
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

    