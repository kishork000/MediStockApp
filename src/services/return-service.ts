
import { db } from '@/lib/firebase-config';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

export interface ReturnItem {
    id: string;
    medicineId: string;
    medicineName: string;
    quantity: number;
}

export interface ManufacturerReturn {
    debitNoteId: string;
    date: string; // ISO string
    manufacturerId: string;
    manufacturerName: string;
    items: ReturnItem[];
}

const returnCollectionRef = collection(db, 'manufacturerReturns');

export async function getManufacturerReturns(): Promise<ManufacturerReturn[]> {
    const querySnapshot = await getDocs(returnCollectionRef);
    return querySnapshot.docs.map(doc => doc.data() as ManufacturerReturn);
}

export async function recordManufacturerReturn(returnData: ManufacturerReturn): Promise<void> {
    const returnDocRef = doc(db, 'manufacturerReturns', returnData.debitNoteId);
    await setDoc(returnDocRef, returnData);
}
