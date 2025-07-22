
export interface WarehouseLedgerItem {
    medicineId: string;
    medicineName: string;
    manufacturerName: string;
    opening: number;
    received: number;
    returnedFromStore: number;
    returnedToManufacturer: number;
    transferred: number;
    balance: number;
}
