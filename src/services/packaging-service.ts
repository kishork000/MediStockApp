
import { db } from '@/lib/firebase-config';
import { collection, getDocs, doc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export interface PackagingType {
    id: string;
    name: string;
}

const packagingTypeCollectionRef = collection(db, 'packaging');

export async function getPackagingTypes(): Promise<PackagingType[]> {
    const data = await getDocs(packagingTypeCollectionRef);
    return data.docs.map(doc => ({ ...doc.data(), id: doc.id } as PackagingType));
}

export async function addPackagingType(packagingType: Omit<PackagingType, 'id'>) {
    return await addDoc(packagingTypeCollectionRef, {
        ...packagingType,
        createdAt: serverTimestamp(),
    });
}

export async function deletePackagingType(id: string) {
    const packagingTypeDoc = doc(db, 'packaging', id);
    return await deleteDoc(packagingTypeDoc);
}

    