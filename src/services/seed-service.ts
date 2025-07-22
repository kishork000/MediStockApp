
import { db } from '@/lib/firebase-config';
import { collection, writeBatch, getDocs, doc } from 'firebase/firestore';

const initialMedicines = [
    { id: "MED001", name: "Paracetamol 500mg", hsnCode: "300490", manufacturerId: "MAN002", manufacturerName: "Cipla", purchasePrice: 1.5, sellingPrice: 2, gstSlab: "12", warehouseMinStockLevel: 500, storeMinStockLevel: 100, baseUnit: "PCS", packType: "Strip", unitsPerPack: 10 },
    { id: "MED002", name: "Aspirin 75mg", hsnCode: "300450", manufacturerId: "MAN001", manufacturerName: "Sun Pharma", purchasePrice: 0.5, sellingPrice: 0.75, gstSlab: "5", warehouseMinStockLevel: 1000, storeMinStockLevel: 200, baseUnit: "PCS", packType: "Strip", unitsPerPack: 14 },
    { id: "MED003", name: "Amoxicillin 250mg", hsnCode: "300410", manufacturerId: "MAN003", manufacturerName: "Dr. Reddy's", purchasePrice: 4, sellingPrice: 5, gstSlab: "12", warehouseMinStockLevel: 400, storeMinStockLevel: 50, baseUnit: "PCS", packType: "Strip", unitsPerPack: 10 },
    { id: "MED004", name: "Ibuprofen 200mg", hsnCode: "300490", manufacturerId: "MAN002", manufacturerName: "Cipla", purchasePrice: 1, sellingPrice: 1.5, gstSlab: "12", warehouseMinStockLevel: 750, storeMinStockLevel: 150, baseUnit: "PCS", packType: "Strip", unitsPerPack: 10 },
    { id: "MED005", name: "Cetirizine 10mg", hsnCode: "300490", manufacturerId: "MAN001", manufacturerName: "Sun Pharma", purchasePrice: 0.8, sellingPrice: 1.2, gstSlab: "5", warehouseMinStockLevel: 800, storeMinStockLevel: 100, baseUnit: "PCS", packType: "Strip", unitsPerPack: 10 },
    { id: "MED006", name: "Benadryl Cough Syrup", hsnCode: "300490", manufacturerId: "MAN003", manufacturerName: "Dr. Reddy's", purchasePrice: 80, sellingPrice: 95, gstSlab: "18", warehouseMinStockLevel: 300, storeMinStockLevel: 50, baseUnit: "BTL", packType: "Box", unitsPerPack: 1 },
];

const initialManufacturers = [
    { id: "MAN001", name: "Sun Pharma", contactPerson: "Ravi Kumar", email: "ravi.kumar@sunpharma.com", phone: "9876543210", address: "Sun House, Mumbai", gstin: "27AAACS1116L1ZG" },
    { id: "MAN002", name: "Cipla", contactPerson: "Priya Singh", email: "priya.singh@cipla.com", phone: "9876543211", address: "Cipla House, Mumbai", gstin: "27AAACC2728D1Z2" },
    { id: "MAN003", name: "Dr. Reddy's", contactPerson: "Anil Sharma", email: "anil.sharma@drreddys.com", phone: "9876543212", address: "DRL House, Hyderabad", gstin: "36AADCD2277F1Z5" },
];

const initialInventory = [
    // Warehouse stock
    { locationId: "warehouse", medicineId: "MED001", medicineName: "Paracetamol 500mg", quantity: 5000 },
    { locationId: "warehouse", medicineId: "MED002", medicineName: "Aspirin 75mg", quantity: 10000 },
    { locationId: "warehouse", medicineId: "MED003", medicineName: "Amoxicillin 250mg", quantity: 4000 },
    { locationId: "warehouse", medicineId: "MED004", medicineName: "Ibuprofen 200mg", quantity: 7500 },
    { locationId: "warehouse", medicineId: "MED005", medicineName: "Cetirizine 10mg", quantity: 8000 },
    { locationId: "warehouse", medicineId: "MED006", medicineName: "Benadryl Cough Syrup", quantity: 1500 },
    // Downtown Pharmacy
    { locationId: "STR002", medicineId: "MED001", medicineName: "Paracetamol 500mg", quantity: 1000 },
    { locationId: "STR002", medicineId: "MED005", medicineName: "Cetirizine 10mg", quantity: 500 },
    // Uptown Health
    { locationId: "STR003", medicineId: "MED002", medicineName: "Aspirin 75mg", quantity: 800 },
    { locationId: "STR003", medicineId: "MED004", medicineName: "Ibuprofen 200mg", quantity: 600 },
];

const initialUnitTypes = [
    { name: "PCS" },
    { name: "BTL" },
    { name: "ML" },
    { name: "G" },
    { name: "KIT" },
];

const initialPackagingTypes = [
    { name: "Box" },
    { name: "Strip" },
    { name: "Bottle" },
    { name: "Sachet" },
    { name: "Tube" },
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
        const collectionsToSeed = [
            { name: 'medicines', data: initialMedicines, useId: true },
            { name: 'manufacturers', data: initialManufacturers, useId: true },
            { name: 'units', data: initialUnitTypes, useId: false },
            { name: 'packaging', data: initialPackagingTypes, useId: false },
        ];

        let needsSeeding = false;
        for (const { name } of collectionsToSeed) {
            if (await isCollectionEmpty(name)) {
                needsSeeding = true;
                break;
            }
        }
        
        if (await isCollectionEmpty('inventory')) {
             needsSeeding = true;
        }

        if (!needsSeeding) {
            console.log("Database already seeded. Skipping.");
            return;
        }

        console.log("Database appears to be empty. Seeding with initial data...");
        const batch = writeBatch(db);

        // Seed collections from the array
        for (const { name, data, useId } of collectionsToSeed) {
            const collectionRef = collection(db, name);
            data.forEach((item: any) => {
                const docRef = useId ? doc(collectionRef, item.id) : doc(collectionRef);
                const dataToSet = { ...item };
                if (useId) delete dataToSet.id;
                batch.set(docRef, dataToSet);
            });
        }
        
        // Seed inventory separately because of composite ID
        const inventoryRef = collection(db, 'inventory');
        initialInventory.forEach(item => {
            const docRef = doc(inventoryRef, `${item.locationId}_${item.medicineId}`);
            batch.set(docRef, item);
        });

        await batch.commit();
        console.log("Database seeded successfully.");

    } catch (error) {
        console.error("Error seeding database: ", error);
    }
}
