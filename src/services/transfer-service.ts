
import { db } from '@/lib/firebase-config';
import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { moveStock } from './inventory-service';

export interface TransferItem {
    medicineId: string;
    medicineName: string;
    quantity: number;
}

export interface Transfer {
    id: string; // TINV- or CNR- number
    type: 'transfer' | 'return';
    from: string; // locationId
    to: string; // locationId
    items: TransferItem[];
    date: string;
    status: 'Completed' | 'In Transit' | 'Cancelled';
}

const transferCollectionRef = collection(db, 'transfers');

export async function getTransfers(): Promise<Transfer[]> {
    const querySnapshot = await getDocs(transferCollectionRef);
    return querySnapshot.docs.map(doc => doc.data() as Transfer);
}

export async function recordTransfer(transfer: Transfer) {
    const batch = writeBatch(db);

    // 1. Move the stock in inventory
    await moveStock(transfer.from, transfer.to, transfer.items);

    // 2. Record the transfer document
    const transferDocRef = doc(db, 'transfers', transfer.id);
    batch.set(transferDocRef, transfer);
    
    await batch.commit();
}

export async function recordReturn(transfer: Transfer) {
     const batch = writeBatch(db);

    // 1. Move the stock in inventory (from store back to warehouse)
    await moveStock(transfer.from, transfer.to, transfer.items);

    // 2. Record the return document (as a transfer)
    const transferDocRef = doc(db, 'transfers', transfer.id);
    batch.set(transferDocRef, transfer);
    
    await batch.commit();
}
