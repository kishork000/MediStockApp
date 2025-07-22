
import { db } from '@/lib/firebase-config';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export interface Manufacturer {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    gstin: string;
    cin?: string;
}

const manufacturerCollectionRef = collection(db, 'manufacturers');

export async function getManufacturers(): Promise<Manufacturer[]> {
    const data = await getDocs(manufacturerCollectionRef);
    return data.docs.map(doc => ({ ...doc.data(), id: doc.id } as Manufacturer));
}

export async function addManufacturer(manufacturer: Omit<Manufacturer, 'id'>) {
    return await addDoc(manufacturerCollectionRef, {
        ...manufacturer,
        createdAt: serverTimestamp(),
    });
}

export async function updateManufacturer(id: string, updatedManufacturer: Omit<Manufacturer, 'id'>) {
    const manufacturerDoc = doc(db, 'manufacturers', id);
    return await updateDoc(manufacturerDoc, {
        ...updatedManufacturer,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteManufacturer(id: string) {
    const manufacturerDoc = doc(db, 'manufacturers', id);
    return await deleteDoc(manufacturerDoc);
}
