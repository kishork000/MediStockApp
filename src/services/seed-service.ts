
import { db } from '@/lib/firebase-config';
import { collection, writeBatch, getDocs, doc } from 'firebase/firestore';

const initialMedicines = [
    { id: "MED001", name: "Paracetamol 500mg", hsnCode: "300490", purchasePrice: 1.5, sellingPrice: 2, gstSlab: "12", minStockLevel: 50, unitType: "STRIP" },
    { id: "MED002", name: "Aspirin 75mg", hsnCode: "300450", purchasePrice: 0.5, sellingPrice: 0.75, gstSlab: "5", minStockLevel: 100, unitType: "STRIP" },
    { id: "MED003", name: "Amoxicillin 250mg", hsnCode: "300410", purchasePrice: 4, sellingPrice: 5, gstSlab: "12", minStockLevel: 40, unitType: "STRIP" },
    { id: "MED004", name: "Ibuprofen 200mg", hsnCode: "300490", purchasePrice: 1, sellingPrice: 1.5, gstSlab: "12", minStockLevel: 75, unitType: "STRIP" },
    { id: "MED005", name: "Cetirizine 10mg", hsnCode: "300490", purchasePrice: 0.8, sellingPrice: 1.2, gstSlab: "5", minStockLevel: 80, unitType: "STRIP" },
    { id: "MED006", name: "Benadryl Cough Syrup", hsnCode: "300490", purchasePrice: 80, sellingPrice: 95, gstSlab: "18", minStockLevel: 30, unitType: "BTL" },
];

const initialManufacturers = [
    { id: "MAN001", name: "Sun Pharma", contactPerson: "Ravi Kumar", email: "ravi.kumar@sunpharma.com", phone: "9876543210", address: "Sun House, Mumbai", gstin: "27AAACS1116L1ZG" },
    { id: "MAN002", name: "Cipla", contactPerson: "Priya Singh", email: "priya.singh@cipla.com", phone: "9876543211", address: "Cipla House, Mumbai", gstin: "27AAACC2728D1Z2" },
    { id: "MAN003", name: "Dr. Reddy's", contactPerson: "Anil Sharma", email: "anil.sharma@drreddys.com", phone: "9876543212", address: "DRL House, Hyderabad", gstin: "36AADCD2277F1Z5" },
];

const initialInventory = [
    // Warehouse stock
    { locationId: "warehouse", medicineId: "MED001", medicineName: "Paracetamol 500mg", quantity: 500 },
    { locationId: "warehouse", medicineId: "MED002", medicineName: "Aspirin 75mg", quantity: 1000 },
    { locationId: "warehouse", medicineId: "MED003", medicineName: "Amoxicillin 250mg", quantity: 400 },
    { locationId: "warehouse", medicineId: "MED004", medicineName: "Ibuprofen 200mg", quantity: 750 },
    { locationId: "warehouse", medicineId: "MED005", medicineName: "Cetirizine 10mg", quantity: 800 },
    { locationId: "warehouse", medicineId: "MED006", medicineName: "Benadryl Cough Syrup", quantity: 150 },
    // Downtown Pharmacy
    { locationId: "STR002", medicineId: "MED001", medicineName: "Paracetamol 500mg", quantity: 100 },
    { locationId: "STR002", medicineId: "MED005", medicineName: "Cetirizine 10mg", quantity: 50 },
    // Uptown Health
    { locationId: "STR003", medicineId: "MED002", medicineName: "Aspirin 75mg", quantity: 80 },
    { locationId: "STR003", medicineId: "MED004", medicineName: "Ibuprofen 200mg", quantity: 60 },
];

/**
 * Checks if a collection is empty.
 * @param collectionName The name of the collection to check.
 * @returns True if the collection is empty, false otherwise.
 */
async function isCollectionEmpty(collectionName: string): Promise<boolean> {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    return snapshot.empty;
}

/**
 * Seeds the database with initial data if it's empty.
 */
export async function seedDatabase() {
    try {
        const medicinesEmpty = await isCollectionEmpty('medicines');
        if (medicinesEmpty) {
            console.log("Medicines collection is empty. Seeding...");
            const batch = writeBatch(db);
            const medicinesRef = collection(db, 'medicines');
            initialMedicines.forEach(med => {
                const docRef = doc(medicinesRef, med.id);
                batch.set(docRef, med);
            });
            await batch.commit();
            console.log("Medicines seeded successfully.");
        } else {
             console.log("Medicines collection already has data.");
        }

        const manufacturersEmpty = await isCollectionEmpty('manufacturers');
        if (manufacturersEmpty) {
            console.log("Manufacturers collection is empty. Seeding...");
            const batch = writeBatch(db);
            const manufacturersRef = collection(db, 'manufacturers');
            initialManufacturers.forEach(man => {
                 const docRef = doc(manufacturersRef, man.id);
                 batch.set(docRef, man);
            });
            await batch.commit();
             console.log("Manufacturers seeded successfully.");
        } else {
            console.log("Manufacturers collection already has data.");
        }

        const inventoryEmpty = await isCollectionEmpty('inventory');
        if (inventoryEmpty) {
            console.log("Inventory collection is empty. Seeding...");
            const batch = writeBatch(db);
            const inventoryRef = collection(db, 'inventory');
            initialInventory.forEach(item => {
                const docRef = doc(inventoryRef, `${item.locationId}_${item.medicineId}`);
                batch.set(docRef, item);
            });
            await batch.commit();
            console.log("Inventory seeded successfully.");
        } else {
            console.log("Inventory collection already has data.");
        }

    } catch (error) {
        console.error("Error seeding database: ", error);
    }
}
