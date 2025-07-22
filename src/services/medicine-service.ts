
import { db } from '@/lib/firebase-config';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export interface Medicine {
    id: string;
    name: string;
    hsnCode: string;
    manufacturerId: string;
    manufacturerName: string;
    purchasePrice: number;
    sellingPrice: number;
    gstSlab: string;
    minStockLevel: number;
    baseUnit: string; // e.g., PCS, BTL
    packType?: string; // e.g., STRIP, BOX
    unitsPerPack?: number; // e.g., 10 tablets per strip
}

const medicineCollectionRef = collection(db, 'medicines');

export async function getMedicines(): Promise<Medicine[]> {
    const data = await getDocs(medicineCollectionRef);
    return data.docs.map(doc => ({ ...doc.data(), id: doc.id } as Medicine));
}

export async function addMedicine(medicine: Omit<Medicine, 'id'>) {
    return await addDoc(medicineCollectionRef, {
        ...medicine,
        createdAt: serverTimestamp(),
    });
}

export async function updateMedicine(id: string, updatedMedicine: Omit<Medicine, 'id'>) {
    const medicineDoc = doc(db, 'medicines', id);
    return await updateDoc(medicineDoc, {
        ...updatedMedicine,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteMedicine(id: string) {
    const medicineDoc = doc(db, 'medicines', id);
    return await deleteDoc(medicineDoc);
}
