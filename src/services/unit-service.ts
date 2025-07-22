
import { db } from '@/lib/firebase-config';
import { collection, getDocs, doc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export interface UnitType {
    id: string;
    name: string;
}

const unitTypeCollectionRef = collection(db, 'units');

export async function getUnitTypes(): Promise<UnitType[]> {
    const data = await getDocs(unitTypeCollectionRef);
    return data.docs.map(doc => ({ ...doc.data(), id: doc.id } as UnitType));
}

export async function addUnitType(unitType: Omit<UnitType, 'id'>) {
    return await addDoc(unitTypeCollectionRef, {
        ...unitType,
        createdAt: serverTimestamp(),
    });
}

export async function deleteUnitType(id: string) {
    const unitTypeDoc = doc(db, 'units', id);
    return await deleteDoc(unitTypeDoc);
}

    