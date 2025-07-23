
import { db } from '@/lib/firebase-config';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { UserRole } from '@/lib/types';

export interface User {
    id: string;
    loginId: string;
    name: string;
    email: string;
    mobile: string;
    role: UserRole;
    assignedStore?: string;
    altMobile?: string;
    pan?: string;
    aadhar?: string;
}

export interface NewUser {
    name: string;
    email: string;
    mobile: string;
    loginId: string;
    role: UserRole;
    assignedStore?: string;
    password?: string;
    altMobile?: string;
    pan?: string;
    aadhar?: string;
}

export interface UpdateUser {
    name?: string;
    email?: string;
    mobile?: string;
    role?: UserRole;
    assignedStore?: string;
    altMobile?: string;
    pan?: string;
    aadhar?: string;
}


const userCollectionRef = collection(db, 'users');

export async function getUsers(): Promise<User[]> {
    const data = await getDocs(userCollectionRef);
    return data.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
}

export async function getUser(id: string): Promise<User | null> {
    const userDoc = doc(db, 'users', id);
    const docSnap = await getDoc(userDoc);
    if(docSnap.exists()){
        return { ...docSnap.data(), id: docSnap.id } as User;
    }
    return null;
}

export async function addUser(user: NewUser) {
    const { password, ...userData } = user; // Exclude password before saving
    return await addDoc(userCollectionRef, {
        ...userData,
        createdAt: serverTimestamp(),
    });
}

export async function updateUser(id: string, updatedUser: UpdateUser) {
    const userDoc = doc(db, 'users', id);
    return await updateDoc(userDoc, {
        ...updatedUser,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteUser(id: string) {
    const userDoc = doc(db, 'users', id);
    return await deleteDoc(userDoc);
}
