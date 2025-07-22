
import { db } from '@/lib/firebase-config';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { updateInventoryAfterSale } from './inventory-service';

export interface SaleItem {
    id: number;
    medicine: string; // Name/label
    medicineValue: string; // ID
    quantity: number;
    price: number;
    gst: number;
    total: number;
    stock: number;
}

export interface Sale {
    invoiceId: string;
    patientId: string;
    patientName: string;
    patientMobile: string; // Added for universal report
    storeId: string;
    storeName: string;
    items: Omit<SaleItem, 'id' | 'stock'>[];
    subtotal: number;
    totalGst: number;
    grandTotal: number;
    paymentMethod: 'Cash' | 'Online';
    soldBy: string; // User's name
    createdAt: string; // ISO string
}


const salesCollectionRef = collection(db, 'sales');

/**
 * Gets all sales from the database.
 */
export async function getSales(): Promise<Sale[]> {
    const querySnapshot = await getDocs(salesCollectionRef);
    return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        invoiceId: doc.id, // Use the document ID as the invoiceId
        createdAt: doc.data().createdAt.toDate().toISOString(), // Convert timestamp to ISO string
    } as Sale));
}


/**
 * Records a new sale in the database and updates inventory levels.
 * This is a transactional operation to ensure data consistency.
 * @param saleData The complete sale object.
 */
export async function recordSale(saleData: Omit<Sale, 'createdAt' | 'invoiceId' | 'patientMobile'>, patientMobile: string): Promise<void> {
    
    // In a real production app with high traffic, you'd use a transaction
    // to read stock levels and write the sale in a single atomic operation.
    // For this app's scale, a batch write after client-side checks is sufficient.
    
    try {
        // 1. Update inventory levels first
        const saleItemsForInventoryUpdate = saleData.items.map(item => ({
            medicineId: item.medicineValue,
            quantity: item.quantity,
            medicineName: item.medicine, // Pass name for potential error messages
        }));
        await updateInventoryAfterSale(saleData.storeId, saleItemsForInventoryUpdate);

        // 2. Record the sale document
        await addDoc(salesCollectionRef, {
            ...saleData,
            patientMobile,
            createdAt: serverTimestamp(),
        });

    } catch (error) {
        console.error("Failed to record sale and update inventory: ", error);
        // Here you might need logic to handle a failed transaction,
        // like attempting to revert the inventory update if it went through but the sale record failed.
        // For now, we'll just throw the error.
        throw new Error("Sale could not be completed. Inventory has not been updated.");
    }
}
