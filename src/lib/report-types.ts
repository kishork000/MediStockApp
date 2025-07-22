
export interface WarehouseLedgerItem {
    medicineId: string;
    medicineName: string;
    manufacturerName: string;
    opening: number;
    received: number; // from purchase
    totalStock: number; // opening + received + returned from store
    returnedFromStore: number;
    returnedToManufacturer: number;
    transferred: number; // to stores
    balance: number;
}
