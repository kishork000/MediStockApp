
import { db } from '@/lib/firebase-config';
import { collection, doc, getDocs, query, where, writeBatch, increment, getDoc, setDoc } from 'firebase/firestore';

export interface InventoryItem {
    id: string; // Composite key like `${locationId}_${medicineId}`
    locationId: string;
    medicineId: string;
    quantity: number;
    medicineName: string; // Denormalized for easier display
}

// Defining a type for the items passed to updateInventoryAfterSale for clarity
export interface SaleItemForInventory {
    medicineId: string;
    quantity: number;
    medicineName: string;
}

const inventoryCollectionRef = collection(db, 'inventory');

/**
 * Gets the current stock for a specific medicine at a specific location.
 * @param locationId The ID of the store or 'warehouse'.
 * @param medicineId The ID of the medicine.
 * @returns The current quantity, or 0 if it doesn't exist.
 */
export async function getStockLevel(locationId: string, medicineId: string): Promise<number> {
    const docRef = doc(db, 'inventory', `${locationId}_${medicineId}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().quantity;
    }
    return 0;
}

/**
 * Gets all available medicines and their stock for a given location.
 * This is used to populate the sales dropdown.
 */
export async function getAvailableStockForLocation(locationId: string): Promise<InventoryItem[]> {
    const q = query(inventoryCollectionRef, where("locationId", "==", locationId), where("quantity", ">", 0));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id} as InventoryItem));
}


/**
 * Updates inventory levels after a sale. This is an atomic operation.
 * @param locationId The ID of the store where the sale occurred.
 * @param items The items that were sold.
 */
export async function updateInventoryAfterSale(locationId: string, items: SaleItemForInventory[]) {
    const batch = writeBatch(db);

    for (const item of items) {
        const docRef = doc(db, 'inventory', `${locationId}_${item.medicineId}`);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().quantity >= item.quantity) {
             batch.update(docRef, { quantity: increment(-item.quantity) });
        } else {
            throw new Error(`Insufficient stock for ${item.medicineName}. Cannot record sale.`);
        }
    }

    await batch.commit();
}


/**
 * Adds new stock to inventory. If the item doesn't exist, it's created.
 * @param locationId The ID of the store or 'warehouse'.
 * @param items The items being added.
 */
export async function addStockToInventory(locationId: string, items: { medicineId: string, medicineName: string, quantity: number }[]) {
    const batch = writeBatch(db);

    for (const item of items) {
        const docRef = doc(db, 'inventory', `${locationId}_${item.medicineId}`);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            batch.update(docRef, { quantity: increment(item.quantity) });
        } else {
            batch.set(docRef, {
                locationId,
                medicineId: item.medicineId,
                medicineName: item.medicineName,
                quantity: item.quantity,
            });
        }
    }

    await batch.commit();
}

/**
 * Removes stock from a single location, e.g. for manufacturer returns.
 * @param locationId The ID of the store or 'warehouse'.
 * @param items The items to remove.
 */
export async function removeStockFromInventory(locationId: string, items: { medicineId: string, quantity: number }[]) {
    const batch = writeBatch(db);

    for (const item of items) {
        const docRef = doc(db, 'inventory', `${locationId}_${item.medicineId}`);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().quantity >= item.quantity) {
            batch.update(docRef, { quantity: increment(-item.quantity) });
        } else {
            throw new Error(`Insufficient stock to remove for medicine ID ${item.medicineId}.`);
        }
    }

    await batch.commit();
}


/**
 * Moves stock from one location to another.
 * @param from The source location ID.
 * @param to The destination location ID.
 * @param items The items to move.
 */
export async function moveStock(from: string, to: string, items: { medicineId: string, medicineName: string, quantity: number }[]) {
    const batch = writeBatch(db);

    for (const item of items) {
        // Decrement from source
        const fromDocRef = doc(db, 'inventory', `${from}_${item.medicineId}`);
        batch.update(fromDocRef, { quantity: increment(-item.quantity) });

        // Increment or set at destination
        const toDocRef = doc(db, 'inventory', `${to}_${item.medicineId}`);
        const toDocSnap = await getDoc(toDocRef);
        if (toDocSnap.exists()) {
            batch.update(toDocRef, { quantity: increment(item.quantity) });
        } else {
            batch.set(toDocRef, {
                locationId: to,
                medicineId: item.medicineId,
                medicineName: item.medicineName,
                quantity: item.quantity,
            });
        }
    }

    await batch.commit();
}
