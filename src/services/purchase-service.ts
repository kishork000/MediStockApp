
import { db } from '@/lib/firebase-config';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

export interface PurchaseItem {
    id: string;
    medicineId: string;
    medicineName: string;
    quantity: number;
    pricePerUnit: number;
    expiryDate: string;
}

export interface Purchase {
    invoiceId: string;
    date: string;
    manufacturerId: string;
    manufacturerName: string;
    items: PurchaseItem[];
    totalAmount: number;
}

const purchaseCollectionRef = collection(db, 'purchases');

export async function getPurchases(): Promise<Purchase[]> {
    const querySnapshot = await getDocs(purchaseCollectionRef);
    return querySnapshot.docs.map(doc => doc.data() as Purchase);
}

export async function recordPurchase(purchase: Purchase): Promise<void> {
    const purchaseDocRef = doc(db, 'purchases', purchase.invoiceId);
    await setDoc(purchaseDocRef, purchase);
}
