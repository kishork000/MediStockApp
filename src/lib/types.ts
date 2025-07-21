
export type UserRole = "Admin" | "Pharmacist" | "Technician";

export interface User {
    name: string;
    email: string;
    role: UserRole;
    assignedStore?: string;
}

export type RolePermissions = {
    [key in UserRole]: string[];
};

export interface AppRoute {
    path: string;
    name: string;
    inSidebar: boolean;
}

export const allAppRoutes: AppRoute[] = [
    { path: "/", name: "Dashboard", inSidebar: true },
    { path: "/patients", name: "Patients", inSidebar: true },
    { path: "/sales", name: "Sales", inSidebar: true },
    { path: "/inventory", name: "Warehouse Stock", inSidebar: true },
    { path: "/inventory/stores", name: "Store Stock", inSidebar: true },
    { path: "/inventory/add", name: "Add Medicine", inSidebar: true },
    { path: "/inventory/transfer", name: "Stock Transfer", inSidebar: true },
    { path: "/inventory/reports", name: "Stock Reports", inSidebar: true },
    { path: "/diseases", name: "Diseases", inSidebar: true },
    { path: "/admin", name: "Admin", inSidebar: true },
];

    