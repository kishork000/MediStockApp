
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, UserRole, RolePermissions, allAppRoutes } from '@/lib/types';
import { auth, db } from '@/lib/firebase-config';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, User as FirebaseAuthUser } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';


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
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", firebaseUser.email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.warn("No user document found for email:", firebaseUser.email);
            return null;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as Omit<User, 'id'>;
        
        return {
            id: userDoc.id,
            ...userData,
        };
    };
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDetails = await fetchUserDetails(firebaseUser);
                if (userDetails) {
                    setUser(userDetails);
                    localStorage.setItem('medi-stock-user', JSON.stringify(userDetails));
                } else {
                    setUser(null);
                    localStorage.removeItem('medi-stock-user');
                    await signOut(auth); // Log out from Firebase if no user document
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
    
    // Admin user management functions
    const createUser = async (newUser: NewUser) => {
        if (user?.role !== 'Admin') throw new Error("Only admins can create users.");
        if (!newUser.password) throw new Error("Password is required to create a user.");
        
        // This is a temporary way to create a user in Firebase Auth from the client.
        // In a real production app, this should be handled by a secure backend function.
        const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
        const { password, ...userData } = newUser;
        
        // Now save the user's role and other details in Firestore
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userDocRef, {
            ...userData,
            id: userCredential.user.uid
        });
    };

    const deleteUser = async (userId: string, email: string) => {
         if (user?.role !== 'Admin') throw new Error("Only admins can delete users.");
         // This is a placeholder. Deleting a user requires backend privileges (e.g., a Firebase Function).
         // It cannot be done securely from the client-side SDK.
         console.warn("User deletion from Firebase Auth must be done from a backend environment.");

         // We can, however, delete their data from Firestore.
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

    