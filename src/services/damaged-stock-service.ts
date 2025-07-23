
import { db } from '@/lib/firebase-config';
import { collection, doc, getDocs, writeBatch, increment, serverTimestamp } from 'firebase/firestore';

export interface DamagedStockLog {
    id: string;
    locationId: string;
    medicineId: string;
    medicineName: string;
    quantity: number;
    reason: string;
    recordedBy: { id: string; name: string };
    date: string; // ISO string
}

const damagedStockCollectionRef = collection(db, 'damagedStock');

/**
 * Gets all damaged stock log entries.
 */
export async function getDamagedStockLogs(): Promise<DamagedStockLog[]> {
    const querySnapshot = await getDocs(damagedStockCollectionRef);
    return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        date: doc.data().date.toDate().toISOString(),
    } as DamagedStockLog));
}

/**
 * Records damaged stock, updating inventory and creating a log entry atomically.
 * @param locationId Location of the damaged stock.
 * @param medicineId ID of the damaged medicine.
 * @param medicineName Name of the damaged medicine.
 * @param quantity Quantity to write off.
 * @param reason Reason for the write-off.
 * @param user The user recording the damage.
 */
export async function recordDamagedStock(
    locationId: string,
    medicineId: string,
    medicineName: string,
    quantity: number,
    reason: string,
    user: { id: string; name: string }
) {
    const batch = writeBatch(db);

    // 1. Decrement the inventory count
    const inventoryDocRef = doc(db, 'inventory', `${locationId}_${medicineId}`);
    batch.update(inventoryDocRef, { quantity: increment(-quantity) });

    // 2. Create a log entry for the damaged stock
    const damagedLogDocRef = doc(damagedStockCollectionRef);
    batch.set(damagedLogDocRef, {
        locationId,
        medicineId,
        medicineName,
        quantity,
        reason,
        recordedBy: user,
        date: serverTimestamp(),
    });

    await batch.commit();
}
